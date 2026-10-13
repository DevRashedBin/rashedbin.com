import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  "/",
  "/services",
  "/services/website-design-development",
  "/services/website-redesign",
  "/services/wordpress-elementor-development",
  "/services/website-bug-fixes",
  "/services/technical-seo",
  "/services/website-security-maintenance",
  "/services/website-performance-optimisation",
  "/services/woocommerce-development",
  "/about",
  "/start-a-project",
  "/privacy",
  "/terms",
];

for (const path of pages) {
  test.describe(path, () => {
    test("renders with one h1, a canonical URL and no horizontal overflow", async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\//);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{50,}/);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("has no serious accessibility violations", async ({ page }) => {
      // Evaluate the settled state: scroll-driven reveals are mid-animation otherwise.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      const serious = results.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? ""),
      );
      expect(
        serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
      ).toEqual([]);
    });
  });
}

test("unknown pages return a 404 page", async ({ page }) => {
  const response = await page.goto("/services/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("doesn");
});

test("titles are unique across public pages", async ({ page }) => {
  const titles = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    titles.add(await page.title());
  }
  expect(titles.size).toBe(pages.length);
});

test("preview deployments are not indexable", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /");
});

test("sitemap lists services but no private routes", async ({ request }) => {
  const body = await (await request.get("/sitemap.xml")).text();
  expect(body).toContain("/services/technical-seo");
  expect(body).not.toMatch(/\/(admin|portal|api)/);
});

test("security headers are present", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
});
