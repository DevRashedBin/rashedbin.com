import { expect, test, type Page } from "@playwright/test";
import { createUser, latestEmailCode, serviceClient, signInAsNewAdmin } from "./fixtures";

/** Phase 5: project management, client notifications and the client portal. */

const MAILPIT = () => process.env.MAILPIT_URL!;
const unique = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

async function subjectsTo(to: string): Promise<string[]> {
  const res = await fetch(`${MAILPIT()}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
  const body = (await res.json()) as { messages?: { Subject: string }[] };
  return (body.messages ?? []).map((m) => m.Subject).sort();
}

async function portalSignIn(page: Page, email: string) {
  await page.context().clearCookies();
  await page.goto("/portal/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  await expect(page.getByRole("status")).toContainText("a 6-digit code is on its way");
  await page.getByLabel("Sign-in code").fill(await latestEmailCode(email));
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/portal$/);
}

test("project lifecycle: create, invite, update, notify, and what the client sees", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const svc = serviceClient();
  const clientEmail = `${unique("billing")}@example.test`;
  const portalEmail = `${unique("portal")}@example.test`;
  const clientName = unique("Studio");
  const { data: client } = await svc
    .from("clients")
    .insert({
      display_name: clientName,
      billing_email: clientEmail,
      contact_name: "Pat Client",
      default_currency: "GBP",
    })
    .select("id")
    .single();

  // A second client's project that must stay invisible.
  const { data: other } = await svc
    .from("clients")
    .insert({ display_name: unique("Other"), billing_email: `${unique("other")}@example.test` })
    .select("id")
    .single();
  const { data: otherProject } = await svc
    .from("projects")
    .insert({
      ref: `RB-2099-${String(Date.now()).slice(-6)}`,
      client_id: other!.id,
      title: "Secret other project",
    })
    .select("ref")
    .single();

  await signInAsNewAdmin(page);

  // Create a project manually.
  await page.goto(`/admin/projects/new?clientId=${client!.id}`);
  await page.getByLabel("Project title").fill("Brand website");
  await page.getByLabel("Agreed value").fill("2,000.5");
  await page.getByLabel("Start date").fill("2026-11-02");
  await page.getByLabel("Target completion").fill("2026-10-01");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByText("The target date can't be before the start date.")).toBeVisible();
  await page.getByLabel("Target completion").fill("2026-12-18");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByText(/^Project RB-\d{4}-\d+ created\.$/)).toBeVisible();
  await expect(page.getByText("GBP 2,000.50")).toBeVisible();
  const projectUrl = page.url().split("?")[0];
  const ref = (await page.getByText(/^Project RB-\d{4}-\d+ created\.$/).textContent())!.match(
    /RB-\d{4}-\d+/,
  )![0];

  // Milestones: one visible, one hidden.
  await page.getByLabel("New milestone").fill("Design approved");
  await page.getByRole("button", { name: "Add milestone" }).click();
  await expect(page.getByText("Milestone added.")).toBeVisible();
  await page.getByLabel("New milestone").fill("Internal QA checklist");
  await page.getByLabel("Visible to the client").uncheck();
  await page.getByRole("button", { name: "Add milestone" }).click();
  await expect(page.getByText("Internal QA checklist", { exact: true })).toBeVisible();

  // Give the client portal access.
  await page.goto(`/admin/clients/${client!.id}`);
  await page.getByLabel("Name", { exact: true }).fill("Pat Client");
  await page.getByLabel("Email", { exact: true }).fill(portalEmail);
  await page.getByRole("button", { name: "Give access and send invitation" }).click();
  await expect(
    page.getByText(`${portalEmail} now has access. Invitation email sent.`),
  ).toBeVisible();
  await expect
    .poll(() => subjectsTo(portalEmail))
    .toEqual([expect.stringMatching(/^Your client area for /)]);

  // Private note (never shown or emailed to the client).
  await page.goto(projectUrl);
  await page.getByLabel("New note").fill("PRIVATE: client is price-sensitive");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("PRIVATE: client is price-sensitive")).toBeVisible();

  // Publish an update and email it.
  await page.getByLabel("Update for the client").fill("Homepage design is ready for your review.");
  await page.getByRole("button", { name: "Publish update" }).click();
  await expect(
    page.getByText(/Update published to the client area\. Client emailed \(1\)\./),
  ).toBeVisible();

  // Status change without notifying: no email. Then with notifying: one email.
  await page.getByLabel("Status", { exact: true }).selectOption("in_progress");
  await page.getByLabel("Email the client about this change").uncheck();
  await page.getByRole("button", { name: "Change status" }).click();
  await expect(page.getByText(/^Status changed to In Progress\.$/)).toBeVisible();
  await page.getByLabel("Status", { exact: true }).selectOption("awaiting_feedback");
  await expect(page.getByText("The client sees: “Waiting for your feedback”")).toBeVisible();
  await expect(page.getByLabel("Email the client about this change")).toBeChecked();
  await page.getByRole("button", { name: "Change status" }).click();
  await expect(
    page.getByText(/Status changed to Awaiting Client Feedback\. Client emailed \(1\)\./),
  ).toBeVisible();

  // Complete the visible milestone and notify.
  const row = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: "Move Design approved up" }) });
  await row.getByRole("button", { name: "Mark complete" }).click();
  await expect(row.getByText(/Milestone completed\. Client emailed \(1\)\./)).toBeVisible();

  await expect
    .poll(() => subjectsTo(portalEmail))
    .toEqual([
      "Brand website: Waiting for your feedback",
      "Milestone completed: Design approved",
      "Update on Brand website",
      expect.stringMatching(/^Your client area for /),
    ]);
  // The billing address is not emailed once a portal user exists.
  expect(await subjectsTo(clientEmail)).toEqual([]);

  // What the client sees.
  await portalSignIn(page, portalEmail);
  await expect(page.getByRole("heading", { name: clientName })).toBeVisible();
  await page.getByRole("link", { name: /Brand website/ }).click();
  await expect(page).toHaveURL(new RegExp(`/portal/projects/${ref}$`));
  await expect(page.getByText("Waiting for your feedback").filter({ visible: true })).toBeVisible();
  await expect(page.getByText("GBP 2,000.50")).toBeVisible();
  await expect(
    page.getByRole("listitem").filter({ hasText: "Design approved (complete)" }),
  ).toBeVisible();
  await expect(page.getByText("Homepage design is ready for your review.")).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  await expect(page.getByText("Internal QA checklist")).toHaveCount(0);
  await expect(page.getByText(/PRIVATE/)).toHaveCount(0);

  // Another client's project is not reachable by changing the URL.
  await page.goto(`/portal/projects/${otherProject!.ref}`);
  await expect(page.getByText("Error 404")).toBeVisible();
  await expect(page.getByText("Secret other project")).toHaveCount(0);
  await page.goto("/portal");
  await expect(page.getByText("Secret other project")).toHaveCount(0);
});

test("unpublishing an update and removing access take effect for the client", async ({ page }) => {
  test.setTimeout(120_000);
  const svc = serviceClient();
  const member = await createUser("portal-revoke");
  const { data: client } = await svc
    .from("clients")
    .insert({ display_name: unique("Revoke Co"), billing_email: member.email })
    .select("id")
    .single();
  await svc.from("client_members").insert({ client_id: client!.id, user_id: member.id });
  const { data: project } = await svc
    .from("projects")
    .insert({
      ref: `RB-2098-${String(Date.now()).slice(-6)}`,
      client_id: client!.id,
      title: "Revocable project",
    })
    .select("id, ref")
    .single();
  await svc.from("project_updates").insert({
    project_id: project!.id,
    body: "Temporary update",
    published_at: new Date().toISOString(),
  });

  await signInAsNewAdmin(page);
  await page.goto(`/admin/projects/${project!.id}`);
  await page.getByRole("button", { name: "Unpublish" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Unpublish" }).click();
  await expect(page.getByText("Unpublished", { exact: true })).toBeVisible();

  await portalSignIn(page, member.email);
  await page.goto(`/portal/projects/${project!.ref}`);
  await expect(page.getByText("No updates yet.")).toBeVisible();

  await page.context().clearCookies();
  await signInAsNewAdmin(page);
  await page.goto(`/admin/clients/${client!.id}`);
  await page.getByRole("button", { name: "Remove" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Remove access" }).click();
  await expect(page.getByText("Nobody has access to the client area yet.")).toBeVisible();

  await portalSignIn(page, member.email);
  await expect(page.getByText("Your account isn’t linked to a client record yet.")).toBeVisible();
  await page.goto(`/portal/projects/${project!.ref}`);
  await expect(page.getByText("Error 404")).toBeVisible();
  await expect(page.getByText("Revocable project")).toHaveCount(0);
});
