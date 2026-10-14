import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

// Admin and portal journeys are stateful and slower; run them on one mobile
// and one desktop viewport rather than all four.
const privateFlows = /(admin|portal|crm)\.spec\.ts/;

// Some sandboxes ship a pre-installed Chromium that does not match the
// Playwright version; point at it with PLAYWRIGHT_CHROMIUM_PATH.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;
const launchOptions = executablePath ? { executablePath } : {};

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "retain-on-failure", launchOptions },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], launchOptions } },
    {
      name: "tablet",
      testIgnore: privateFlows,
      use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 }, launchOptions },
    },
    {
      name: "laptop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 820 }, launchOptions },
    },
    {
      name: "desktop",
      testIgnore: privateFlows,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 }, launchOptions },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm start --port ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
