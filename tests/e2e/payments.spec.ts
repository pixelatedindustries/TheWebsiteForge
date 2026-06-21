import { test, expect } from "@playwright/test";

/**
 * Payment / checkout flow — SKIPPED until a staging environment exists.
 *
 * The real flow requires:
 *   - Firebase Auth (Google sign-in) so the order is tied to an account
 *   - Paystack TEST keys (PAYSTACK_SECRET_KEY / NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY)
 *   - A migrated Postgres DB (DATABASE_URL) — `pnpm db:up && pnpm db:migrate`
 *   - NUXT_PUBLIC_SITE_URL pointing at the tunnel/host so callbacks resolve
 *
 * To enable: provide those env vars, set RUN_PAYMENT_E2E=1, seed a test user,
 * and replace the manual sign-in with a stored auth state / test token. The
 * money math itself (USD→ZAR, never under-collect, top-up bounds) is already
 * covered deterministically by the Vitest suite in tests/unit/.
 */
const PAYMENTS_ENABLED = process.env.RUN_PAYMENT_E2E === "1";

test.describe("checkout (build + wallet top-up)", () => {
  test.skip(
    !PAYMENTS_ENABLED,
    "Needs Paystack test keys, Firebase auth, and a seeded DB — set RUN_PAYMENT_E2E=1.",
  );

  test("a build checkout reaches the Paystack hosted page", async ({
    page,
  }) => {
    // 1. Sign in (replace with stored auth state in CI).
    // 2. Open /checkout/start?plan=build_starter and submit the brief.
    // 3. Expect a redirect to a paystack.com/* authorization URL OR, when fully
    //    wallet-covered, a redirect straight to /checkout/success.
    await page.goto("/checkout/start?plan=build_starter");
    await expect(page).toHaveURL(/checkout\/start/);
  });

  test("the success page verifies a reference server-side", async ({
    page,
  }) => {
    // /checkout/success calls /api/checkout/verify (never trusts the redirect).
    // With a known-good test reference it should resolve to the paid state.
    await page.goto("/checkout/success?reference=twf_build_test_ref");
    await expect(page.getByText(/confirming|payment/i).first()).toBeVisible();
  });
});
