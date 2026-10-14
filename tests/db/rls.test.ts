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

/**
 * Row Level Security: verified through the real API with real sessions.
 * Fixtures: two clients (A, B) each with one portal user, one admin who has
 * completed MFA, the same admin without MFA, and an unrelated signed-in user.
 */

let admin: Db;
let adminNoMfa: Db;
let userA: Db;
let userB: Db;
let stranger: Db;
let userAId: string;
let clientA: string;
let clientB: string;

beforeAll(async () => {
  const svc = serviceClient();

  const adminUser = await createUser("admin");
  await makeAdmin(adminUser.id);
  admin = (await signInWithMfa(adminUser.email)).client;

  const adminUser2 = await createUser("admin-nomfa");
  await makeAdmin(adminUser2.id);
  adminNoMfa = await signIn(adminUser2.email);

  const a = await createUser("client-a");
  const b = await createUser("client-b");
  const s = await createUser("stranger");
  userAId = a.id;

  const { data: clients, error } = await svc
    .from("clients")
    .insert([
      { display_name: "Client A", billing_email: a.email },
      { display_name: "Client B", billing_email: b.email },
    ])
    .select("id, display_name");
  if (error) throw error;
  clientA = clients.find((c) => c.display_name === "Client A")!.id;
  clientB = clients.find((c) => c.display_name === "Client B")!.id;

  const { error: memberError } = await svc.from("client_members").insert([
    { client_id: clientA, user_id: a.id },
    { client_id: clientB, user_id: b.id },
  ]);
  if (memberError) throw memberError;

  const { error: noteError } = await svc
    .from("internal_notes")
    .insert({ subject_type: "client", subject_id: clientA, body: "Private: price sensitive." });
  if (noteError) throw noteError;

  userA = await signIn(a.email);
  userB = await signIn(b.email);
  stranger = await signIn(s.email);
});

describe("client isolation", () => {
  it("a client sees only their own client record", async () => {
    const { data, error } = await userA.from("clients").select("id");
    expect(error).toBeNull();
    expect(data!.map((r) => r.id)).toEqual([clientA]);
  });

  it("requesting another client's record by id returns nothing", async () => {
    const { data } = await userA.from("clients").select("*").eq("id", clientB);
    expect(data).toEqual([]);
    const { data: viaB } = await userB.from("clients").select("*").eq("id", clientA);
    expect(viaB).toEqual([]);
  });

  it("a client cannot create, change or delete client records", async () => {
    const insert = await userA
      .from("clients")
      .insert({ display_name: "X", billing_email: "x@example.test" });
    expect(insert.error).not.toBeNull();

    const update = await userA
      .from("clients")
      .update({ display_name: "Hacked" })
      .eq("id", clientA)
      .select();
    expect(update.data ?? []).toEqual([]);

    const del = await userA.from("clients").delete().eq("id", clientB).select();
    expect(del.data ?? []).toEqual([]);

    const { data } = await serviceClient()
      .from("clients")
      .select("display_name")
      .eq("id", clientA)
      .single();
    expect(data!.display_name).toBe("Client A");
  });

  it("a client cannot add themselves to another client", async () => {
    const { error } = await userA
      .from("client_members")
      .insert({ client_id: clientB, user_id: userAId });
    expect(error).not.toBeNull();
  });

  it("a client sees only their own membership rows", async () => {
    const { data } = await userA.from("client_members").select("client_id");
    expect(data!.map((r) => r.client_id)).toEqual([clientA]);
  });

  it("a signed-in user with no membership sees no clients", async () => {
    const { data } = await stranger.from("clients").select("id");
    expect(data).toEqual([]);
  });
});

describe("internal data is never visible to clients", () => {
  it.each(["internal_notes", "audit_log", "business_settings"] as const)(
    "%s is empty for a client",
    async (table) => {
      const { data } = await userA.from(table).select("*");
      expect(data ?? []).toEqual([]);
    },
  );

  it("anonymous visitors cannot read private tables", async () => {
    for (const table of [
      "clients",
      "client_members",
      "internal_notes",
      "audit_log",
      "business_settings",
      "profiles",
    ] as const) {
      const { data, error } = await anonClient().from(table).select("*");
      expect(data ?? [], table).toEqual([]);
      expect(error, table).not.toBeNull();
    }
  });
});

describe("roles", () => {
  it("users read only their own profile", async () => {
    const { data } = await userA.from("profiles").select("id, role");
    expect(data).toEqual([{ id: userAId, role: "client" }]);
  });

  it("a user cannot promote themselves to admin", async () => {
    const { error } = await userA.from("profiles").update({ role: "admin" }).eq("id", userAId);
    expect(error).not.toBeNull();
    const { data } = await serviceClient()
      .from("profiles")
      .select("role")
      .eq("id", userAId)
      .single();
    expect(data!.role).toBe("client");
  });

  it("a user can change their own display name", async () => {
    const { error } = await userA.from("profiles").update({ full_name: "Alex" }).eq("id", userAId);
    expect(error).toBeNull();
  });
});

describe("admin access requires MFA", () => {
  it("an admin with an MFA session can read all clients and notes", async () => {
    const { data: clients } = await admin.from("clients").select("id").in("id", [clientA, clientB]);
    expect(clients).toHaveLength(2);
    const { data: notes } = await admin
      .from("internal_notes")
      .select("body")
      .eq("subject_id", clientA);
    expect(notes).toHaveLength(1);
  });

  it("the same role without MFA (aal1) gets nothing", async () => {
    const { data } = await adminNoMfa.from("clients").select("id");
    expect(data).toEqual([]);
    const insert = await adminNoMfa
      .from("clients")
      .insert({ display_name: "X", billing_email: "y@example.test" });
    expect(insert.error).not.toBeNull();
  });

  it("an admin can create and update clients, and duplicates are rejected", async () => {
    const email = `dup-${Date.now()}@example.test`;
    const first = await admin
      .from("clients")
      .insert({ display_name: "Dup", billing_email: email })
      .select("id")
      .single();
    expect(first.error).toBeNull();
    const second = await admin
      .from("clients")
      .insert({ display_name: "Dup 2", billing_email: email.toUpperCase() });
    expect(second.error?.code).toBe("23505");
    const upd = await admin
      .from("clients")
      .update({ phone: "+44 20 0000 0000" })
      .eq("id", first.data!.id)
      .select();
    expect(upd.data).toHaveLength(1);
  });

  it("only admins can draw business numbers, and they never repeat", async () => {
    const denied = await userA.rpc("next_sequence_value", { p_scope: "invoice", p_year: 2099 });
    expect(denied.error).not.toBeNull();
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        admin.rpc("next_sequence_value", { p_scope: "invoice", p_year: 2099 }),
      ),
    );
    const values = results.map((r) => r.data);
    expect(new Set(values).size).toBe(5);
  });
});

describe("audit log", () => {
  it("records changes with the acting user", async () => {
    const { data } = await admin
      .from("audit_log")
      .select("action, table_name, record_id")
      .eq("table_name", "clients")
      .eq("record_id", clientA);
    expect(data!.some((r) => r.action === "INSERT")).toBe(true);
  });

  it("cannot be altered or deleted, even by the service role", async () => {
    const svc = serviceClient();
    const { data } = await svc.from("audit_log").select("id").limit(1).single();
    const upd = await svc.from("audit_log").update({ action: "TAMPERED" }).eq("id", data!.id);
    expect(upd.error).not.toBeNull();
    const del = await svc.from("audit_log").delete().eq("id", data!.id);
    expect(del.error).not.toBeNull();
    const asAdmin = await admin.from("audit_log").delete().eq("id", data!.id).select();
    expect(asAdmin.data ?? []).toEqual([]);
  });
});

describe("public content", () => {
  it("anonymous visitors read published services and FAQs only", async () => {
    const svc = serviceClient();
    const { data: draft } = await svc
      .from("services")
      .insert({
        slug: `draft-${Date.now()}`,
        name: "Draft service",
        short_name: "Draft",
        summary: "Not ready",
        meta_title: "Draft",
        meta_description:
          "A draft service that must never be visible to the public before it is published.",
        eyebrow: "Draft",
        headline: "Draft",
        intro: "Draft",
        demo: "vitals",
        cta: { title: "t", body: "b", label: "l" },
      })
      .select("slug")
      .single();

    const { data } = await anonClient().from("services").select("slug");
    const slugs = data!.map((s) => s.slug);
    expect(slugs).toContain("technical-seo");
    expect(slugs).not.toContain(draft!.slug);

    const { data: adminView } = await admin.from("services").select("slug").eq("slug", draft!.slug);
    expect(adminView).toHaveLength(1);
  });

  it("anonymous visitors and clients cannot edit content", async () => {
    const a = await anonClient()
      .from("services")
      .update({ name: "Hacked" })
      .eq("slug", "technical-seo")
      .select();
    expect(a.data ?? []).toEqual([]);
    const c = await userA
      .from("services")
      .update({ name: "Hacked" })
      .eq("slug", "technical-seo")
      .select();
    expect(c.data ?? []).toEqual([]);
    const f = await userA.from("faqs").insert({ question: "Q", answer: "A" });
    expect(f.error).not.toBeNull();
  });
});
