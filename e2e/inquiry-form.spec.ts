import { serviceClient } from "./fixtures";
import { expect, test } from "@playwright/test";

test.describe("start a project form", () => {
  test("validates each step before continuing", async ({ page }) => {
    await page.goto("/start-a-project");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Please check the highlighted field.")).toBeVisible();
    await expect(page.getByText("Choose the option closest")).toBeVisible();

    await page.getByRole("main").getByText("Bug Fixes", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Tell me about the project" })).toBeFocused();

    // Bug fixes require urgency and a website address.
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Let me know how urgent this is.")).toBeVisible();
    await expect(page.getByText("Please enter the address of the website involved.")).toBeVisible();
  });

  test("preselects the service from the URL and shows conditional fields", async ({ page }) => {
    await page.goto("/start-a-project?service=woocommerce-development");
    await expect(page.getByRole("radio", { name: "WooCommerce", exact: true })).toBeChecked();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("group", { name: "Where is your store at?" })).toBeVisible();
    await expect(page.getByRole("group", { name: "How urgent is it?" })).toHaveCount(0);
  });

  test("full journey stores the enquiry and confirms it", async ({ page }) => {
    const email = `journey-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
    await page.goto("/start-a-project?service=website-design-development");
    await page.getByRole("button", { name: "Continue" }).click();
    await page
      .getByLabel("What do you need?")
      .fill("A new website for my accountancy practice with a booking form.");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByText("GBP", { exact: true }).click();
    await expect(page.getByRole("group", { name: "Approximate budget (GBP)" })).toBeVisible();
    await page.getByText("1,500 – 3,000").click();
    await page.getByText("1–3 months").click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByLabel("Your name").fill("Test Person");
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByText("Please confirm I can contact you")).toBeVisible();

    await page.getByRole("checkbox").check();
    // Ensure the minimum fill time has passed so the submission is not treated as a bot.
    await page.waitForTimeout(4_200);
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByRole("heading", { name: /your enquiry is in/ })).toBeVisible();

    const { data } = await serviceClient()
      .from("leads")
      .select("stage_key, service_slug, details")
      .eq("email", email);
    expect(data).toHaveLength(1);
    expect(data![0]).toMatchObject({
      stage_key: "new",
      service_slug: "website-design-development",
      details: { currency: "GBP", budget: "b3", timeline: "1-3-months" },
    });
  });
});
