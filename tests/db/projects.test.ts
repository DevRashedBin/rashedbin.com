import { randomUUID } from "node:crypto";
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

/** Phase 5: project data visible in the client portal, and nothing more. */

const svc = serviceClient();
let admin: Db;
let adminNoMfa: Db;
let memberA: Db;
let memberB: Db;
let clientA: string;
let clientB: string;
let projectA: { id: string; ref: string };
let projectB: { id: string; ref: string };

beforeAll(async () => {
  const a = await createUser("proj-admin");
  await makeAdmin(a.id);
  admin = (await signInWithMfa(a.email)).client;
  const a2 = await createUser("proj-admin-aal1");
  await makeAdmin(a2.id);
  adminNoMfa = await signIn(a2.email);

  const ua = await createUser("proj-member-a");
  const ub = await createUser("proj-member-b");
  const { data: clients } = await svc
    .from("clients")
    .insert([
      { display_name: `Proj A ${randomUUID().slice(0, 4)}`, billing_email: ua.email },
      { display_name: `Proj B ${randomUUID().slice(0, 4)}`, billing_email: ub.email },
    ])
    .select("id, billing_email");
  clientA = clients!.find((c) => c.billing_email === ua.email)!.id;
  clientB = clients!.find((c) => c.billing_email === ub.email)!.id;
  await svc.from("client_members").insert([
    { client_id: clientA, user_id: ua.id },
    { client_id: clientB, user_id: ub.id },
  ]);

  const create = async (client_id: string, title: string) => {
    const { data, error } = await admin.rpc("create_project", {
      p_client_id: client_id,
      p_title: title,
      p_status_key: "in_progress",
      p_currency: "GBP",
      p_value_minor: 200000,
    });
    if (error) throw error;
    return { id: data[0].project_id, ref: data[0].project_ref };
  };
  projectA = await create(clientA, "Project A");
  projectB = await create(clientB, "Project B");

  await admin.from("milestones").insert([
    { project_id: projectA.id, title: "Visible milestone", client_visible: true, position: 1 },
    { project_id: projectA.id, title: "Hidden milestone", client_visible: false, position: 2 },
    { project_id: projectB.id, title: "B milestone", client_visible: true, position: 1 },
  ]);
  await admin.from("project_updates").insert([
    { project_id: projectA.id, body: "Published update", published_at: new Date().toISOString() },
    { project_id: projectA.id, body: "Draft update" },
    { project_id: projectB.id, body: "B update", published_at: new Date().toISOString() },
  ]);
  await admin
    .from("internal_notes")
    .insert({ subject_type: "project", subject_id: projectA.id, body: "Private margin note" });

  memberA = await signIn(ua.email);
  memberB = await signIn(ub.email);
});

describe("create_project", () => {
  it("assigns a project reference", () => {
    expect(projectA.ref).toMatch(/^RB-\d{4}-\d{4,}$/);
    expect(projectB.ref).not.toBe(projectA.ref);
  });

  it("requires an MFA-verified admin", async () => {
    const args = { p_client_id: clientA, p_title: "X", p_status_key: "inquiry", p_currency: "USD" };
    expect((await adminNoMfa.rpc("create_project", args)).error).not.toBeNull();
    expect((await memberA.rpc("create_project", args)).error).not.toBeNull();
    expect((await anonClient().rpc("create_project", args)).error).not.toBeNull();
  });

  it("rejects a target date before the start date", async () => {
    const { error } = await admin.rpc("create_project", {
      p_client_id: clientA,
      p_title: "Backwards",
      p_status_key: "inquiry",
      p_currency: "USD",
      p_start_date: "2026-12-01",
      p_target_date: "2026-11-01",
    });
    expect(error).not.toBeNull();
  });
});

describe("portal visibility", () => {
  it("a member sees only their own projects, even when asking for another by id or reference", async () => {
    const { data } = await memberA.from("projects").select("id");
    expect(data!.map((p) => p.id)).toEqual([projectA.id]);
    expect((await memberA.from("projects").select("id").eq("id", projectB.id)).data).toEqual([]);
    expect((await memberA.from("projects").select("id").eq("ref", projectB.ref)).data).toEqual([]);
  });

  it("sees only client-visible milestones of their own projects", async () => {
    const { data } = await memberA.from("milestones").select("title");
    expect(data!.map((m) => m.title)).toEqual(["Visible milestone"]);
  });

  it("sees only published updates of their own projects", async () => {
    const { data } = await memberA.from("project_updates").select("body");
    expect(data!.map((u) => u.body)).toEqual(["Published update"]);
    const { data: b } = await memberB.from("project_updates").select("body");
    expect(b!.map((u) => u.body)).toEqual(["B update"]);
  });

  it("never sees internal notes or activity", async () => {
    expect((await memberA.from("internal_notes").select("*")).data ?? []).toEqual([]);
    expect((await memberA.from("activities").select("*")).data ?? []).toEqual([]);
  });

  it("cannot change projects, milestones or updates", async () => {
    const upd = await memberA
      .from("projects")
      .update({ title: "Hacked" })
      .eq("id", projectA.id)
      .select();
    expect(upd.data ?? []).toEqual([]);
    expect(
      (await memberA.from("milestones").insert({ project_id: projectA.id, title: "X" })).error,
    ).not.toBeNull();
    expect(
      (await memberA.from("project_updates").insert({ project_id: projectA.id, body: "X" })).error,
    ).not.toBeNull();
    const done = await memberA
      .from("milestones")
      .update({ completed_at: new Date().toISOString() })
      .eq("project_id", projectA.id)
      .select();
    expect(done.data ?? []).toEqual([]);
  });

  it("anonymous visitors see nothing", async () => {
    for (const t of ["projects", "milestones", "project_updates"] as const) {
      expect((await anonClient().from(t).select("*")).data ?? []).toEqual([]);
    }
  });

  it("removing a membership removes access immediately", async () => {
    const extra = await createUser("proj-temp");
    await svc.from("client_members").insert({ client_id: clientA, user_id: extra.id });
    const temp = await signIn(extra.email);
    expect((await temp.from("projects").select("id")).data).toHaveLength(1);
    await admin.from("client_members").delete().eq("client_id", clientA).eq("user_id", extra.id);
    expect((await temp.from("projects").select("id")).data).toEqual([]);
  });
});

describe("find_user_id_by_email", () => {
  it("is callable by the server only", async () => {
    const args = { p_email: "nobody@example.test" };
    expect((await admin.rpc("find_user_id_by_email", args)).error).not.toBeNull();
    expect((await memberA.rpc("find_user_id_by_email", args)).error).not.toBeNull();
    expect((await anonClient().rpc("find_user_id_by_email", args)).error).not.toBeNull();
    const own = await createUser("proj-lookup");
    expect(
      (await svc.rpc("find_user_id_by_email", { p_email: own.email.toUpperCase() })).data,
    ).toBe(own.id);
  });
});
