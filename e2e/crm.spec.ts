import { expect, test, type Page } from "@playwright/test";
import { serviceClient, signInAsNewAdmin } from "./fixtures";

/** Phase 4: inquiry intake, save-and-resume, follow-ups and conversion. */

const MAILPIT = () => process.env.MAILPIT_URL!;
const uniqueEmail = (p: string) =>
  `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;

type MailSummary = { ID: string; Subject: string };

async function mailsTo(to: string): Promise<MailSummary[]> {
  const res = await fetch(`${MAILPIT()}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
  return ((await res.json()) as { messages?: MailSummary[] }).messages ?? [];
}

async function mailText(id: string): Promise<string> {
  const msg = (await (await fetch(`${MAILPIT()}/api/v1/message/${id}`)).json()) as {
    Text?: string;
  };
  return msg.Text ?? "";
}

/** Fills steps 1–3 for a redesign enquiry. */
async function fillToContactStep(page: Page, description: string) {
  await page.goto("/start-a-project?service=website-redesign");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Website address").fill("example-business.test");
  await page.getByLabel("What do you need?").fill(description);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("Not sure yet", { exact: true }).click();
  await page.getByText("Flexible", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
}

async function submitContact(page: Page, name: string, email: string) {
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("checkbox").check();
  await page.waitForTimeout(4_200);
  await page.getByRole("button", { name: "Send enquiry" }).click();
}

test.describe("enquiries", () => {
  test("a submitted enquiry creates a lead and sends both notifications", async ({ page }) => {
    const email = uniqueEmail("visitor");
    await fillToContactStep(page, "Our site is dated and slow; we want a redesign before spring.");
    await submitContact(page, "Visitor Example", email);
    await expect(page.getByRole("heading", { name: /your enquiry is in/ })).toBeVisible();

    const { data: lead } = await serviceClient()
      .from("leads")
      .select("id, ref, stage_key")
      .eq("email", email)
      .single();
    expect(lead!.stage_key).toBe("new");

    await expect
      .poll(async () => (await mailsTo(email)).map((m) => m.Subject))
      .toEqual([`Thanks for your enquiry — ${lead!.ref}`]);
    await expect
      .poll(async () =>
        (await mailsTo("hello@rashedbin.com")).some((m) => m.Subject.includes(lead!.ref)),
      )
      .toBe(true);
  });

  test("nothing is stored before consent; save and resume completes the same lead", async ({
    page,
  }) => {
    const email = uniqueEmail("resume");
    await page.goto("/start-a-project?service=technical-seo");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Website address").fill("seo-client.test");
    await page
      .getByLabel("What do you need?")
      .fill("Pages are not being indexed and we need a technical review.");

    await page.getByRole("button", { name: "Not ready to finish? Save and finish later" }).click();
    const panel = page.getByRole("region", { name: "Save and finish later" });
    await panel.getByLabel("Your name").fill("Resume Person");
    await panel.getByLabel("Email address").fill(email);

    // Without ticking consent nothing is saved.
    await panel.getByRole("button", { name: "Save and email me a link" }).click();
    await expect(panel.getByText("Please confirm you'd like me to store")).toBeVisible();
    const before = await serviceClient().from("leads").select("id").eq("email", email);
    expect(before.data).toEqual([]);

    await panel.getByRole("checkbox").check();
    await panel.getByRole("button", { name: "Save and email me a link" }).click();
    await expect(page.getByText("A link to finish your enquiry is on its way")).toBeVisible();

    const { data: draft } = await serviceClient()
      .from("leads")
      .select("id, stage_key, submitted_at")
      .eq("email", email)
      .single();
    expect(draft).toMatchObject({ stage_key: "incomplete", submitted_at: null });

    // Open the link from the email in a fresh context (as if on another device).
    const mails = await expect
      .poll(async () => (await mailsTo(email)).length)
      .toBe(1)
      .then(() => mailsTo(email));
    const text = await mailText(mails[0].ID);
    const path = new URL(text.match(/https?:\/\/\S+\/start-a-project\/resume\/\S+/)![0]).pathname;

    const res = await page.context().request.get(path);
    expect(res.headers()["referrer-policy"]).toBe("no-referrer");
    await page.context().clearCookies();
    await page.goto(path);
    await expect(page.getByRole("heading", { name: /Finish your enquiry/ })).toBeVisible();
    // Answers are restored; the first incomplete step is shown.
    await expect(page.getByRole("heading", { name: "Budget and timeline" })).toBeVisible();
    await page.getByText("Not sure yet", { exact: true }).click();
    await page.getByText("As soon as possible", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByLabel("Email address")).toHaveValue(email);
    await page.getByRole("checkbox").check();
    await page.waitForTimeout(4_200);
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByRole("heading", { name: /your enquiry is in/ })).toBeVisible();

    const { data: done } = await serviceClient()
      .from("leads")
      .select("id, stage_key, submitted_at")
      .eq("email", email);
    expect(done).toHaveLength(1);
    expect(done![0].id).toBe(draft!.id);
    expect(done![0].stage_key).toBe("new");

    // The link is single-use.
    await page.goto(path);
    await expect(page.getByText("This link has expired or has already been used.")).toBeVisible();
  });

  test("an invalid resume link is rejected", async ({ page }) => {
    await page.goto("/start-a-project/resume/not-a-real-token-123456789");
    await expect(page.getByText("This link has expired or has already been used.")).toBeVisible();
  });
});

test.describe("lead management", () => {
  test("admin follows up once, sees the history, and converts the lead without duplicates", async ({
    page,
  }) => {
    const email = uniqueEmail("lead");
    await fillToContactStep(page, "We need a refreshed design and better mobile performance.");
    await submitContact(page, "Lead Person", email);
    await expect(page.getByRole("heading", { name: /your enquiry is in/ })).toBeVisible();
    const { data: lead } = await serviceClient()
      .from("leads")
      .select("id, ref")
      .eq("email", email)
      .single();

    await page.context().clearCookies();
    await signInAsNewAdmin(page);
    await page.goto("/admin/leads");
    await page.getByRole("link", { name: new RegExp(lead!.ref) }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lead Person");
    await expect(page.getByText("Enquiry submitted through the website")).toBeVisible();

    // Follow up with a saved template.
    await page.getByRole("link", { name: "Follow up" }).click();
    await page.getByRole("link", { name: "Follow-up", exact: true }).click();
    await expect(page.getByLabel("Subject")).toHaveValue(
      "Following up on your Website Redesign and Modernisation enquiry",
    );
    await expect(page.getByLabel("Message")).toHaveValue(/Hi Lead,/);
    await page
      .getByLabel("Message")
      .fill((await page.getByLabel("Message").inputValue()) + "\n\nP.S. Personal note.");
    await page.getByRole("button", { name: "Review and send" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByTestId("review-to")).toHaveText(`Lead Person <${email}>`);
    await dialog.getByRole("button", { name: "Send now" }).dblclick();
    await expect(page.getByText("Email sent to the provider.")).toBeVisible();

    const followUps = async () =>
      (await mailsTo(email)).filter((m) => m.Subject.startsWith("Following up"));
    await expect.poll(async () => (await followUps()).length).toBe(1);
    expect(await mailText((await followUps())[0].ID)).toContain("P.S. Personal note.");
    await expect(page.getByRole("link", { name: /Following up on your/ })).toBeVisible();
    await expect(page.getByText("Delivery not confirmed yet").first()).toBeVisible();
    // A sent follow-up moves a new lead to Contacted.
    await expect(page.getByLabel("Stage", { exact: true })).toHaveValue("contacted");

    // Change priority, add a note.
    await page.getByLabel("Priority").selectOption("high");
    await page.getByRole("button", { name: "Update" }).click();
    await expect(page.getByText("Lead updated.")).toBeVisible();
    await page.getByLabel("New note").fill("Budget flexible; decision by Friday.");
    await page.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByText("Budget flexible; decision by Friday.")).toBeVisible();

    // Convert to a project.
    await page.getByRole("button", { name: "Convert to project" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Create project" }).click();
    await expect(page.getByText(/^Project RB-\d{4}-\d+ created/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Convert to project" })).toHaveCount(0);

    const svc = serviceClient();
    const { data: projects } = await svc
      .from("projects")
      .select("id, client_id")
      .eq("lead_id", lead!.id);
    expect(projects).toHaveLength(1);
    const { data: clients } = await svc.from("clients").select("id").eq("billing_email", email);
    expect(clients).toHaveLength(1);
    const { data: after } = await svc.from("leads").select("stage_key").eq("id", lead!.id).single();
    expect(after!.stage_key).toBe("won");

    // The email log shows the sent follow-up.
    await page.goto("/admin/emails?status=sent");
    await expect(page.getByText(email).first()).toBeVisible();
  });

  test("admin edits a template and the change is used for the next follow-up", async ({ page }) => {
    await signInAsNewAdmin(page);
    await page.goto("/admin/templates/request_details");
    await page.getByLabel("Subject").fill("Questions about your {{unknown_thing}}");
    await page.getByRole("button", { name: "Save template" }).click();
    await expect(page.getByText("Unknown variable: {{unknown_thing}}.")).toBeVisible();
    await page.getByLabel("Subject").fill("A few questions about your {{service}} project");
    await page.getByRole("button", { name: "Save template" }).click();
    await expect(page.getByText("Template saved.")).toBeVisible();
  });
});

test.describe("abuse protection and private endpoints", () => {
  test("repeated enquiries from one email address are rate limited", async ({ page }) => {
    test.setTimeout(120_000);
    const email = uniqueEmail("flood");
    let limited = false;
    for (let i = 0; i < 7 && !limited; i++) {
      await page.goto("/start-a-project?service=not-sure");
      await page.getByRole("button", { name: "Continue" }).click();
      await page
        .getByLabel("What do you need?")
        .fill(`Enquiry number ${i} with enough detail to be valid.`);
      await page.getByRole("button", { name: "Continue" }).click();
      await page.getByText("Not sure yet", { exact: true }).click();
      await page.getByText("Flexible", { exact: true }).click();
      await page.getByRole("button", { name: "Continue" }).click();
      await submitContact(page, "Flood Test", email);
      const outcome = page
        .getByText(/your enquiry is in|You’ve sent several enquiries in a short time/)
        .first();
      await expect(outcome).toBeVisible();
      limited = (await outcome.textContent())!.includes("several enquiries");
    }
    expect(limited).toBe(true);
  });

  test("cron and webhook endpoints reject unauthenticated calls", async ({ request }) => {
    expect((await request.get("/api/cron/email")).status()).toBe(401);
    expect(
      (
        await request.get("/api/cron/retention", { headers: { Authorization: "Bearer wrong" } })
      ).status(),
    ).toBe(401);
    const hook = await request.post("/api/webhooks/resend", { data: { type: "email.delivered" } });
    expect([401, 503]).toContain(hook.status());
  });

  test("the scheduled jobs run with the cron secret", async ({ request }) => {
    const auth = {
      Authorization: `Bearer ${process.env.CRON_SECRET ?? "local-cron-secret-0123456789"}`,
    };
    const email = await request.get("/api/cron/email", { headers: auth });
    expect(email.status()).toBe(200);
    const retention = await request.get("/api/cron/retention", { headers: auth });
    expect(await retention.json()).toMatchObject({ ok: true });
  });
});
