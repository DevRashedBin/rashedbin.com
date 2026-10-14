import { expect, test } from "@playwright/test";
import { createUser, serviceClient, signInAsNewAdmin, TEST_PASSWORD } from "./fixtures";

test.describe("access control", () => {
  test("signed-out visitors are sent to the admin login", async ({ page }) => {
    await page.goto("/admin/clients");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("a client account cannot sign in to the admin area", async ({ page }) => {
    const client = await createUser("e2e-client");
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(client.email);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("a wrong password gets the same generic message", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill("nobody@example.test");
    await page.getByLabel("Password").fill("Wrong-Password-1");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  });

  test("password alone does not unlock the dashboard; a wrong code is rejected", async ({
    page,
  }) => {
    const { email } = await signInAsNewAdmin(page);
    await page.context().clearCookies();
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/admin\/mfa$/);
    await page.goto("/admin/clients");
    await expect(page).toHaveURL(/\/admin\/mfa$/);
    await page.getByLabel("Verification code").fill("000000");
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page.getByText("That code didn't work")).toBeVisible();
  });

  test("private pages use a nonce CSP and are not indexable", async ({ page }) => {
    const res = await page.goto("/admin/login");
    const csp = res!.headers()["content-security-policy"];
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(res!.headers()["x-robots-tag"]).toContain("noindex");
    const nonce = csp.match(/'nonce-([^']+)'/)![1];
    const scripts = await page
      .locator("script")
      .evaluateAll((els) => els.map((e) => (e as HTMLScriptElement).nonce));
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.every((n) => n === nonce)).toBe(true);
  });
});

test("admin manages clients end to end", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (msg) => {
    if (/Content.Security.Policy/i.test(msg.text())) violations.push(msg.text());
  });
  await signInAsNewAdmin(page);
  const email = `acme-${Date.now()}@example.test`;

  await page.goto("/admin/clients/new");
  await page.getByRole("button", { name: "Create client" }).click();
  await expect(page.getByText("Enter a name for this client.")).toBeVisible();

  await page.getByLabel(/Client name/).fill("Acme Studio");
  await page.getByLabel(/Billing email/).fill("not-an-email");
  await page.getByLabel("Country code").fill("GB");
  await page.getByRole("button", { name: "Create client" }).click();
  await expect(page.getByText("Enter a valid billing email address.")).toBeVisible();
  // Typed values survive the failed submission.
  await expect(page.getByLabel(/Client name/)).toHaveValue("Acme Studio");

  // React resets the form just after the error renders; retry if that wipes the new value.
  await expect(async () => {
    await page.getByLabel(/Billing email/).fill(email);
    await page.getByRole("button", { name: "Create client" }).click();
    await expect(page.getByText("Client created.")).toBeVisible({ timeout: 3_000 });
  }).toPass();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Acme Studio");
  const clientUrl = page.url().split("?")[0];

  await page.getByLabel("Phone").filter({ visible: true }).fill("+44 20 7946 0000");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Client saved.")).toBeVisible();

  await page.getByLabel("New note").fill("Prefers email over calls.");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("Prefers email over calls.")).toBeVisible();

  // Duplicate billing email is rejected.
  await page.goto("/admin/clients/new");
  await page.getByLabel(/Client name/).fill("Acme Duplicate");
  await page.getByLabel(/Billing email/).fill(email.toUpperCase());
  await page.getByRole("button", { name: "Create client" }).click();
  await expect(page.getByText("An active client already uses this billing email.")).toBeVisible();

  // Search, then archive with confirmation.
  await page.goto(`/admin/clients?q=${encodeURIComponent("Acme Studio")}`);
  await expect(page.getByRole("link", { name: "Acme Studio" }).first()).toBeVisible();
  await page.goto(clientUrl);
  await page.getByRole("button", { name: "Archive client" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Archive" }).click();
  await expect(page.getByText("Archived — hidden from active lists.")).toBeVisible();

  await page.goto("/admin/audit?table=clients");
  await expect(page.getByRole("cell", { name: "UPDATE" }).first()).toBeVisible();

  expect(violations).toEqual([]);
});

test("admin edits website content and the public page updates", async ({ page }) => {
  await signInAsNewAdmin(page);
  const marker = `Updated ${Date.now()}`;
  const { data: before } = await serviceClient()
    .from("services")
    .select("summary")
    .eq("slug", "technical-seo")
    .single();

  await page.goto("/admin/content/services/technical-seo");
  await page.getByLabel("Summary (cards and lists)").fill(marker);
  await page.getByLabel("Page title").fill("");
  await page.getByRole("button", { name: "Save service" }).click();
  await expect(page.getByText("Meta title is required.")).toBeVisible();
  await expect(page.getByLabel("Summary (cards and lists)")).toHaveValue(marker);
  await page.getByLabel("Page title").fill("Technical & On-Page SEO Services");
  await page.getByRole("button", { name: "Save service" }).click();
  await expect(page.getByText("Saved and published.")).toBeVisible();

  // Content is revalidated in the background; it appears within moments.
  await expect(async () => {
    await page.goto("/services");
    await expect(page.getByRole("main").getByText(marker)).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });

  // Regression guard: client-side navigation to the edited page must work.
  await page
    .getByRole("main")
    .getByRole("link", { name: /Technical SEO/ })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("understand");

  // Restore through the UI so the public cache is refreshed too.
  await page.goto("/admin/content/services/technical-seo");
  await page.getByLabel("Summary (cards and lists)").fill(before!.summary);
  await page.getByRole("button", { name: "Save service" }).click();
  await expect(page.getByText("Saved and published.")).toBeVisible();
});

test("admin saves business settings with validation", async ({ page }) => {
  await signInAsNewAdmin(page);
  await page.goto("/admin/settings");
  await page.getByLabel("Invoice prefix").fill("in v!");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("1–10 letters or digits.").first()).toBeVisible();
  await page.getByLabel("Invoice prefix").fill("INV");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Settings saved.")).toBeVisible();
});
