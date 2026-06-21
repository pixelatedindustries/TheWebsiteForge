import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Boots the Nuxt dev server (which runs without secrets — the env
 * validator only warns in dev and Firebase no-ops when unconfigured), so the
 * static marketing pages render for smoke testing.
 *
 * Flows that need real Paystack keys, Firebase auth, and a seeded database
 * (checkout/payments, account dashboard, admin) live behind `test.skip` in
 * `tests/e2e/payments.spec.ts` until a staging environment is wired up.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
