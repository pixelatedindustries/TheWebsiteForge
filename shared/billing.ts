/**
 * Billing catalogue (WebForgePlan2 §4 — wallet model).
 *
 * Imported by both the Vue app (via `~~/shared/billing`) and the Nitro server
 * routes (relative path), so the catalogue lives in one place.
 *
 * CURRENCY (Option A — display USD, charge ZAR):
 *  - Every amount here is in **USD cents** (integer minor units). USD is the
 *    display currency and the wallet's denomination.
 *  - Paystack actually charges the **ZAR** equivalent at checkout, converted by
 *    `server/utils/fx.ts` using the `USD_TO_ZAR` rate. The customer sees the ZAR
 *    amount before paying.
 *
 * TWO product shapes:
 *  - **One-off builds** (`buildPackages`) — paid from available wallet credit
 *    first, with any remainder charged through Paystack. Recorded as a one-off
 *    `invoices` row.
 *  - **Recurring services** (`recurringServices`) — hosting + database, debited
 *    monthly from the customer's prepaid wallet. Care plans are intentionally
 *    removed; baseline upkeep is bundled into hosting (WebForgePlan2 §3.3).
 */

/** What the wallet, prices, and the public site are denominated in. */
export const WALLET_CURRENCY = "USD" as const;
/** What Paystack actually charges a South African account in (see fx.ts). */
export const CHARGE_CURRENCY = "ZAR" as const;

/** Minimum top-up and quick presets, in USD cents. */
export const MIN_TOPUP_USD_CENTS = 5_000; // $50
/** Maximum single top-up, in USD cents — guards against fat-finger/abuse. */
export const MAX_TOPUP_USD_CENTS = 1_000_000; // $10,000
export const TOPUP_PRESETS_USD_CENTS = [5_000, 15_000, 30_000, 60_000]; // $50/$150/$300/$600

export type BillingInterval = "month" | "year";
export type InvoiceType = "build" | "hosting" | "domain" | "feature";
export type RecurringKind = "hosting" | "database";

/* ----------------------------- one-off builds ----------------------------- */

export interface BuildPackage {
  key: string;
  label: string;
  /** One-off price in USD cents. */
  amountUsdCents: number;
  blurb: string;
}

/** Build packages (one-off). Wallet credit is applied before Paystack. */
export const buildPackages: Record<string, BuildPackage> = {
  build_starter: {
    key: "build_starter",
    label: "Starter",
    amountUsdCents: 24_900, // $249
    blurb: "A clean, fast site to launch a new brand, offer, or service.",
  },
  build_professional: {
    key: "build_professional",
    label: "Professional",
    amountUsdCents: 39_900, // $399
    blurb: "A polished multi-page website for a growing business.",
  },
  build_business: {
    key: "build_business",
    label: "Business",
    amountUsdCents: 69_900, // $699
    blurb: "A complete business website with deeper content and integrations.",
  },
};

export function getBuildPackage(key: string): BuildPackage | undefined {
  return buildPackages[key];
}

/* --------------------------- recurring services --------------------------- */

/**
 * Upper bound for a single manually-entered recurring charge, in USD cents.
 * Guards against an admin fat-finger (e.g. $999,999/mo) that the scheduled
 * debit job would otherwise keep applying every month.
 */
export const MAX_RECURRING_MONTHLY_USD_CENTS = 100_000_00; // $100,000 / month

export interface RecurringService {
  key: string;
  kind: RecurringKind;
  label: string;
  /** Monthly price in USD cents (debited from the wallet). */
  amountUsdCents: number;
}

/**
 * Recurring monthly services, debited from the prepaid wallet. Hosting includes
 * baseline upkeep (security/dependency updates, backups, monitoring, minor
 * tweaks). Databases come in self-hosted (our infra) or managed-cloud
 * (self-hosted + 50% handling) variants.
 */
export const recurringServices: Record<string, RecurringService> = {
  hosting_static: {
    key: "hosting_static",
    kind: "hosting",
    label: "Static Hosting",
    amountUsdCents: 1_500,
  }, // $15
  hosting_dynamic: {
    key: "hosting_dynamic",
    kind: "hosting",
    label: "Dynamic Hosting",
    amountUsdCents: 4_500,
  }, // $45
  hosting_app: {
    key: "hosting_app",
    kind: "hosting",
    label: "App Hosting",
    amountUsdCents: 12_000,
  }, // $120

  db_self_small: {
    key: "db_self_small",
    kind: "database",
    label: "Database — Small (self-hosted)",
    amountUsdCents: 1_000,
  }, // $10
  db_self_medium: {
    key: "db_self_medium",
    kind: "database",
    label: "Database — Medium (self-hosted)",
    amountUsdCents: 2_500,
  }, // $25
  db_self_large: {
    key: "db_self_large",
    kind: "database",
    label: "Database — Large (self-hosted)",
    amountUsdCents: 6_000,
  }, // $60

  db_managed_small: {
    key: "db_managed_small",
    kind: "database",
    label: "Database — Small (managed)",
    amountUsdCents: 1_500,
  }, // $15
  db_managed_medium: {
    key: "db_managed_medium",
    kind: "database",
    label: "Database — Medium (managed)",
    amountUsdCents: 3_750,
  }, // $37.50
  db_managed_large: {
    key: "db_managed_large",
    kind: "database",
    label: "Database — Large (managed)",
    amountUsdCents: 9_000,
  }, // $90
};

export function getRecurringService(key: string): RecurringService | undefined {
  return recurringServices[key];
}

/* ------------------------------ formatting ------------------------------ */

/** Format USD cents as "$249" (whole) or "$37.50". Safe on client + server. */
export function formatUsdCents(cents: number): string {
  const major = cents / 100;
  const whole = Number.isInteger(major);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major);
}

/** Estimate the ZAR charge for a USD-cents amount at a given rate (display only). */
export function estimateZar(usdCents: number, usdToZar: number): string {
  const zar = Math.ceil((usdCents / 100) * usdToZar);
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(zar);
}
