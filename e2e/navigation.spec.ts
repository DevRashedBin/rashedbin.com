import { expect, test } from "@playwright/test";

test("primary navigation reaches services and the enquiry page", async ({ page }) => {
  await page.goto("/");
  // The desktop navigation appears at the lg breakpoint (1024px).
  const usesMobileMenu = (page.viewportSize()?.width ?? 0) < 1024;
  if (usesMobileMenu) {
    await page.getByRole("button", { name: "Open menu" }).click();
    const mobileNav = page.getByRole("navigation", { name: "Mobile" });
    await expect(mobileNav).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(mobileNav).toBeHidden();
    await page.getByRole("button", { name: "Open menu" }).click();
    await mobileNav.getByRole("link", { name: "Technical SEO" }).click();
  } else {
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Services" })
      .click();
    await expect(page).toHaveURL(/\/services$/);
    await page
      .getByRole("link", { name: /Technical SEO/ })
      .first()
      .click();
  }
  await expect(page).toHaveURL(/\/services\/technical-seo$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("understand");

  await page.getByRole("link", { name: "Request an SEO review" }).first().click();
  await expect(page).toHaveURL(/\/start-a-project\?service=technical-seo/);
});

test("service switcher tabs are keyboard operable", async ({ page }) => {
  await page.goto("/");
  const tabs = page.getByRole("tablist", { name: "Services" }).getByRole("tab");
  await tabs.first().focus();
  await page.keyboard.press("ArrowDown");
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel").filter({ visible: true })).toContainText(
    "Website Redesign",
  );
  await page.keyboard.press("End");
  await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
});

test("FAQ accordions open", async ({ page }) => {
  await page.goto("/services/website-performance-optimisation");
  const q = page.getByText("What are Core Web Vitals?");
  await q.click();
  await expect(page.getByText(/responsiveness \(Interaction to Next Paint\)/)).toBeVisible();
});

test("before/after comparison responds to keyboard", async ({ page }) => {
  await page.goto("/services/website-redesign");
  const slider = page.getByLabel("Compare before and after redesign");
  // A key press that lands before hydration is reset by React; retry until interactive.
  await expect(async () => {
    await slider.focus();
    await page.keyboard.press("End");
    await expect(slider).toHaveValue("100", { timeout: 500 });
  }).toPass({ timeout: 10_000 });
});
