import { expect, test } from "@playwright/test";

test.describe("start a project form", () => {
  test("validates each step before continuing", async ({ page }) => {
    await page.goto("/start-a-project");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Please check the highlighted field.")).toBeVisible();
    await expect(page.getByText("Choose the option closest")).toBeVisible();

    await page.getByText("Fix a problem").click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Tell me about the project" })).toBeFocused();

    // Bug fixes require urgency and a website address.
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Let me know how urgent this is.")).toBeVisible();
    await expect(page.getByText("Please enter the address of the website involved.")).toBeVisible();
  });

  test("preselects the service from the URL and shows conditional fields", async ({ page }) => {
    await page.goto("/start-a-project?service=woocommerce-development");
    await expect(page.getByRole("radio", { name: "WooCommerce store" })).toBeChecked();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("group", { name: "Where is your store at?" })).toBeVisible();
    await expect(page.getByRole("group", { name: "How urgent is it?" })).toHaveCount(0);
  });

  test("full journey reports honestly when storage is not configured", async ({ page }) => {
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
    await page.getByLabel("Email address").fill("test@example.com");
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByText("Please confirm I can contact you")).toBeVisible();

    await page.getByRole("checkbox").check();
    // Ensure the minimum fill time has passed so the submission is not treated as a bot.
    await page.waitForTimeout(4_200);
    await page.getByRole("button", { name: "Send enquiry" }).click();
    // No database is configured in this phase: the form must not claim success.
    await expect(
      page.getByRole("alert").filter({ hasText: "aren’t being accepted" }),
    ).toContainText("have not been sent");
    await expect(page.getByText("your enquiry is in")).toHaveCount(0);
  });
});
