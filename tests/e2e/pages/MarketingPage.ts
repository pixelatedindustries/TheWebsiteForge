import type { Page, Locator } from "@playwright/test";

/**
 * Page object for the public marketing pages, which all share the global
 * header (brand + nav) and footer. The app uses semantic markup rather than
 * data-testid hooks, so locators target roles and stable copy.
 */
export class MarketingPage {
  readonly page: Page;
  readonly footer: Locator;
  readonly pricingNavLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.footer = page.getByText("All rights reserved");
    this.pricingNavLink = page.getByRole("link", { name: "Pricing" }).first();
  }

  async goto(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState("domcontentloaded");
  }
}
