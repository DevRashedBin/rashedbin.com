import { createHash, randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  anonClient,
  createUser,
  makeAdmin,
  serviceClient,
  signIn,
  signInWithMfa,
  type Db,
} from "../helpers/supabase";

/** Phase 4 CRM: access control and the transactional database functions. */

const svc = serviceClient();
let admin: Db;
let adminNoMfa: Db;
let clientUser: Db;
let clientUserEmail: string;

function inquiry(overrides: Record<string, unknown> = {}) {
  return {
    p_idempotency_key: randomUUID(),
    p_name: "Jane Prospect",
    p_email: `jane-${randomUUID().slice(0, 8)}@example.test`,
    p_company: "Prospect Ltd",
    p_website_url: "https://prospect.example/",
    p_service_slug: "website-redesign",
    p_service_label: "Website Redesign and Modernisation",
    p_description: "Our site is slow and dated and we want a redesign.",
    p_details: { currency: "GBP", budget: "b3", timeline: "1-3-months" },
    p_notice_version: "2026-10-13",
    p_ip_hash: "a".repeat(64),
    p_user_agent: "vitest",
    ...overrides,
  };
}

async function submit(args: ReturnType<typeof inquiry> & { p_resume_token_hash?: string }) {
  const { data, error } = await svc.rpc("submit_inquiry", args);
  if (error) throw error;
  return data[0];
}

beforeAll(async () => {
  const a = await createUser("crm-admin");
  await makeAdmin(a.id);
  admin = (await signInWithMfa(a.email)).client;
  const b = await createUser("crm-admin-aal1");
  await makeAdmin(b.id);
  adminNoMfa = await signIn(b.email);
  const c = await createUser("crm-client");
  clientUserEmail = c.email;
  clientUser = await signIn(c.email);
});

describe("access control", () => {
  const privateTables = [
    "leads",
    "consent_records",
    "inquiry_resume_tokens",
    "activities",
    "pipeline_stages",
    "email_templates",
    "email_messages",
    "email_events",
    "rate_limits",
  ] as const;

  it.each(privateTables)("%s is invisible to anonymous visitors and clients", async (table) => {
    await submit(inquiry());
    for (const db of [anonClient(), clientUser, adminNoMfa]) {
      const { data } = await db.from(table).select("*").limit(5);
      expect(data ?? []).toEqual([]);
    }
  });

  it("only the server can call intake and maintenance functions", async () => {
    for (const db of [anonClient(), clientUser, admin]) {
      expect((await db.rpc("submit_inquiry", inquiry())).error).not.toBeNull();
      expect(
        (await db.rpc("check_rate_limit", { p_bucket: "x", p_limit: 1, p_window_seconds: 60 }))
          .error,
      ).not.toBeNull();
      expect((await db.rpc("purge_expired_data")).error).not.toBeNull();
    }
  });

  it("an MFA-verified admin can read leads and templates", async () => {
    const lead = await submit(inquiry());
    const { data } = await admin.from("leads").select("ref").eq("id", lead.lead_id);
    expect(data).toEqual([{ ref: lead.lead_ref }]);
    const { data: templates } = await admin.from("email_templates").select("key");
    expect(templates!.map((t) => t.key)).toEqual(
      expect.arrayContaining(["initial_response", "follow_up"]),
    );
  });

  it("system pipeline stages cannot be deleted", async () => {
    const { error } = await admin.from("pipeline_stages").delete().eq("key", "new");
    expect(error).not.toBeNull();
    const { data } = await svc.from("pipeline_stages").select("key").eq("key", "new");
    expect(data).toHaveLength(1);
  });
});

describe("submit_inquiry", () => {
  it("creates a lead with a reference, consent and activity", async () => {
    const args = inquiry();
    const res = await submit(args);
    expect(res.outcome).toBe("created");
    expect(res.lead_ref).toMatch(/^L-\d{4}-\d{4,}$/);
    const { data: lead } = await svc.from("leads").select("*").eq("id", res.lead_id).single();
    expect(lead).toMatchObject({ stage_key: "new", email: args.p_email, source: "website" });
    expect(lead!.submitted_at).not.toBeNull();
    const { data: consent } = await svc
      .from("consent_records")
      .select("purpose, notice_version")
      .eq("lead_id", res.lead_id);
    expect(consent).toEqual([{ purpose: "inquiry_contact", notice_version: "2026-10-13" }]);
    const { data: acts } = await svc
      .from("activities")
      .select("kind")
      .eq("subject_id", res.lead_id);
    expect(acts!.map((a) => a.kind)).toContain("inquiry_submitted");
  });

  it("replaying the same submission does not create a second lead", async () => {
    const args = inquiry();
    const first = await submit(args);
    const again = await submit(args);
    expect(again).toMatchObject({ lead_id: first.lead_id, outcome: "duplicate" });
    const { count } = await svc
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("email", args.p_email);
    expect(count).toBe(1);
  });

  it("the same email and service within 24 hours is logged on the existing lead", async () => {
    const email = `repeat-${randomUUID().slice(0, 8)}@example.test`;
    const first = await submit(inquiry({ p_email: email, p_service_slug: "technical-seo" }));
    const second = await submit(
      inquiry({ p_email: email.toUpperCase(), p_service_slug: "technical-seo" }),
    );
    expect(second).toMatchObject({ lead_id: first.lead_id, outcome: "duplicate" });
    const { data: acts } = await svc
      .from("activities")
      .select("kind")
      .eq("subject_id", first.lead_id);
    expect(acts!.map((a) => a.kind)).toContain("inquiry_repeated");

    const other = await submit(inquiry({ p_email: email, p_service_slug: "website-bug-fixes" }));
    expect(other.outcome).toBe("created");
    expect(other.lead_id).not.toBe(first.lead_id);
  });

  it("concurrent identical submissions create exactly one lead", async () => {
    const args = inquiry();
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, () => svc.rpc("submit_inquiry", args)),
    );
    const { count } = await svc
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("email", args.p_email);
    expect(count).toBe(1);
    expect(results.some((r) => r.status === "fulfilled" && !r.value.error)).toBe(true);
  });
});

describe("saved drafts", () => {
  const hash = (t: string) => createHash("sha256").update(t).digest("hex");

  it("a draft is incomplete until submitted, then completes the same lead", async () => {
    const args = inquiry();
    const token = randomUUID();
    const { data: saved, error } = await svc.rpc("save_inquiry_draft", {
      p_idempotency_key: args.p_idempotency_key,
      p_name: args.p_name,
      p_email: args.p_email,
      p_company: undefined,
      p_website_url: undefined,
      p_service_slug: args.p_service_slug,
      p_service_label: args.p_service_label,
      p_description: "Partial",
      p_details: {},
      p_notice_version: "2026-10-13",
      p_ip_hash: undefined,
      p_user_agent: undefined,
      p_token_hash: hash(token),
      p_token_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    });
    expect(error).toBeNull();
    const draftId = saved![0].lead_id;
    const { data: draft } = await svc
      .from("leads")
      .select("stage_key, submitted_at")
      .eq("id", draftId)
      .single();
    expect(draft).toEqual({ stage_key: "incomplete", submitted_at: null });
    const { data: consent } = await svc
      .from("consent_records")
      .select("purpose")
      .eq("lead_id", draftId);
    expect(consent!.map((c) => c.purpose)).toEqual(["save_and_resume"]);

    // Completed from a different browser session via the resume token.
    const done = await submit({
      ...args,
      p_idempotency_key: randomUUID(),
      p_resume_token_hash: hash(token),
    });
    expect(done).toMatchObject({ lead_id: draftId, outcome: "completed" });
    const { data: lead } = await svc
      .from("leads")
      .select("stage_key, submitted_at")
      .eq("id", draftId)
      .single();
    expect(lead!.stage_key).toBe("new");
    expect(lead!.submitted_at).not.toBeNull();

    // The token is single-use.
    const { data: tok } = await svc
      .from("inquiry_resume_tokens")
      .select("used_at")
      .eq("token_hash", hash(token))
      .single();
    expect(tok!.used_at).not.toBeNull();
  });

  it("a submitted enquiry can't be overwritten by a later draft save", async () => {
    const args = inquiry();
    await submit(args);
    const { data } = await svc.rpc("save_inquiry_draft", {
      p_idempotency_key: args.p_idempotency_key,
      p_name: "Overwrite",
      p_email: args.p_email,
      p_company: undefined,
      p_website_url: undefined,
      p_service_slug: undefined,
      p_service_label: undefined,
      p_description: "",
      p_details: {},
      p_notice_version: "2026-10-13",
      p_ip_hash: undefined,
      p_user_agent: undefined,
      p_token_hash: hash(randomUUID()),
      p_token_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    });
    expect(data![0].outcome).toBe("already_submitted");
    const { data: lead } = await svc
      .from("leads")
      .select("name")
      .eq("idempotency_key", args.p_idempotency_key)
      .single();
    expect(lead!.name).toBe(args.p_name);
  });
});

describe("convert_lead_to_project", () => {
  it("creates a client and project once, and marks the lead won", async () => {
    const lead = await submit(inquiry());
    const first = await admin.rpc("convert_lead_to_project", {
      p_lead_id: lead.lead_id,
      p_title: "Website redesign",
    });
    expect(first.error).toBeNull();
    const created = first.data![0];
    expect(created.created).toBe(true);
    expect(created.project_ref).toMatch(/^RB-\d{4}-\d{4,}$/);

    const again = await admin.rpc("convert_lead_to_project", {
      p_lead_id: lead.lead_id,
      p_title: "Again",
    });
    expect(again.data![0]).toMatchObject({ project_id: created.project_id, created: false });

    const { count } = await svc
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", lead.lead_id);
    expect(count).toBe(1);
    const { data: l } = await svc
      .from("leads")
      .select("stage_key, client_id")
      .eq("id", lead.lead_id)
      .single();
    expect(l).toEqual({ stage_key: "won", client_id: created.client_id });
  });

  it("reuses an existing client with the same email instead of duplicating it", async () => {
    const email = `same-${randomUUID().slice(0, 8)}@example.test`;
    const a = await submit(inquiry({ p_email: email, p_service_slug: "technical-seo" }));
    const b = await submit(inquiry({ p_email: email, p_service_slug: "website-bug-fixes" }));
    const ca = (
      await admin.rpc("convert_lead_to_project", { p_lead_id: a.lead_id, p_title: "SEO" })
    ).data![0];
    const cb = (
      await admin.rpc("convert_lead_to_project", { p_lead_id: b.lead_id, p_title: "Fixes" })
    ).data![0];
    expect(cb.client_id).toBe(ca.client_id);
    const { count } = await svc
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("billing_email", email);
    expect(count).toBe(1);
  });

  it("is refused without MFA and for incomplete drafts", async () => {
    const lead = await submit(inquiry());
    const denied = await adminNoMfa.rpc("convert_lead_to_project", {
      p_lead_id: lead.lead_id,
      p_title: "X",
    });
    expect(denied.error).not.toBeNull();

    const args = inquiry();
    await svc.rpc("save_inquiry_draft", {
      p_idempotency_key: args.p_idempotency_key,
      p_name: "D",
      p_email: args.p_email,
      p_company: undefined,
      p_website_url: undefined,
      p_service_slug: undefined,
      p_service_label: undefined,
      p_description: "",
      p_details: {},
      p_notice_version: "v",
      p_ip_hash: undefined,
      p_user_agent: undefined,
      p_token_hash: createHash("sha256").update(randomUUID()).digest("hex"),
      p_token_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    });
    const { data: draft } = await svc
      .from("leads")
      .select("id")
      .eq("idempotency_key", args.p_idempotency_key)
      .single();
    const refused = await admin.rpc("convert_lead_to_project", {
      p_lead_id: draft!.id,
      p_title: "X",
    });
    expect(refused.error).not.toBeNull();
  });

  it("client members see their own projects only", async () => {
    const lead = await submit(inquiry({ p_email: clientUserEmail }));
    const conv = (
      await admin.rpc("convert_lead_to_project", { p_lead_id: lead.lead_id, p_title: "Mine" })
    ).data![0];
    const { data: me } = await clientUser.auth.getUser();
    await svc.from("client_members").insert({ client_id: conv.client_id, user_id: me.user!.id });
    const other = await submit(inquiry());
    const otherConv = (
      await admin.rpc("convert_lead_to_project", { p_lead_id: other.lead_id, p_title: "Theirs" })
    ).data![0];

    const { data } = await clientUser.from("projects").select("id");
    const ids = data!.map((p) => p.id);
    expect(ids).toContain(conv.project_id);
    expect(ids).not.toContain(otherConv.project_id);
  });
});

describe("retention and rate limits", () => {
  it("purges stale drafts and anonymises old lost leads", async () => {
    const draftArgs = inquiry();
    await svc.rpc("save_inquiry_draft", {
      p_idempotency_key: draftArgs.p_idempotency_key,
      p_name: "Old draft",
      p_email: draftArgs.p_email,
      p_company: undefined,
      p_website_url: undefined,
      p_service_slug: undefined,
      p_service_label: undefined,
      p_description: "",
      p_details: {},
      p_notice_version: "v",
      p_ip_hash: undefined,
      p_user_agent: undefined,
      p_token_hash: createHash("sha256").update(randomUUID()).digest("hex"),
      p_token_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    });
    await svc
      .from("leads")
      .update({ created_at: new Date(Date.now() - 91 * 86_400_000).toISOString() })
      .eq("idempotency_key", draftArgs.p_idempotency_key);

    const lost = await submit(inquiry());
    await svc.from("leads").update({ stage_key: "lost" }).eq("id", lost.lead_id);
    await svc
      .from("leads")
      .update({ last_activity_at: new Date(Date.now() - 800 * 86_400_000).toISOString() })
      .eq("id", lost.lead_id);

    const { data, error } = await svc.rpc("purge_expired_data");
    expect(error).toBeNull();
    expect((data as { drafts_deleted: number }).drafts_deleted).toBeGreaterThanOrEqual(1);

    const { count } = await svc
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("idempotency_key", draftArgs.p_idempotency_key);
    expect(count).toBe(0);
    const { data: anon } = await svc
      .from("leads")
      .select("name, email, description, anonymised_at")
      .eq("id", lost.lead_id)
      .single();
    expect(anon!.name).toBe("Anonymised");
    expect(anon!.email).not.toContain("@example.test");
    expect(anon!.anonymised_at).not.toBeNull();
  });

  it("rate limits allow up to the limit per window", async () => {
    const bucket = `test:${randomUUID()}`;
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      const { data } = await svc.rpc("check_rate_limit", {
        p_bucket: bucket,
        p_limit: 3,
        p_window_seconds: 600,
      });
      results.push(data as boolean);
    }
    expect(results).toEqual([true, true, true, false]);
  });
});
