import { test, expect } from "@playwright/test";
import { MarketingPage } from "./pages/MarketingPage";

/**
 * Smoke coverage for the public, no-auth, no-DB marketing pages. These render
 * from compiled-in content (`shared/site.ts`, `shared/billing.ts`), so they're
 * deterministic without any backend.
 */
test.describe("marketing pages render", () => {
  test("pricing page shows the build catalogue", async ({ page }) => {
    const marketing = new MarketingPage(page);
    await marketing.goto("/pricing");

    // Build package labels come straight from shared/billing.ts.
    await expect(
      page.getByText("Starter", { exact: false }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("Professional", { exact: false }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("Business", { exact: false }).first(),
    ).toBeVisible();
    await expect(marketing.footer).toBeVisible();
  });

  test("about page shows the studio principles", async ({ page }) => {
    const marketing = new MarketingPage(page);
    await marketing.goto("/about");

    await expect(page.getByText("Fast by default.")).toBeVisible();
    await expect(page.getByText("You own the work.")).toBeVisible();
  });

  test("showcase page renders its heading and filters", async ({ page }) => {
    const marketing = new MarketingPage(page);
    await marketing.goto("/showcase");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The "All" category filter is always present even with zero projects.
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
  });

  test("global nav links to the main routes", async ({ page }) => {
    const marketing = new MarketingPage(page);
    await marketing.goto("/about");

    await expect(marketing.pricingNavLink).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Showcase" }).first(),
    ).toBeVisible();
  });

  test("legal pages are reachable and prerendered", async ({ page }) => {
    for (const path of ["/terms", "/refund-policy", "/hosting-agreement"]) {
      const res = await page.goto(path);
      expect(res?.ok(), `${path} should respond 2xx`).toBeTruthy();
      await expect(page.getByRole("heading").first()).toBeVisible();
    }
  });
});
