/**
 * Admin request DTOs + domain status enums (business domain).
 *
 * Shapes for request bodies the admin dashboard sends to `/api/admin/*`, plus
 * the lifecycle status unions those endpoints validate against.
 */
import type { RecurringKind } from "../../shared/billing";

/** Body of POST /api/admin/customers — create a customer or convert a won lead. */
export interface CustomerPayload {
  name?: string;
  email?: string;
  company?: string;
  /** When converting a won lead, link + mark it. */
  leadId?: string;
}

/** Body of POST /api/admin/wallet — manual credit/debit of a customer's wallet. */
export interface WalletAdjustPayload {
  customerId?: string;
  direction?: "credit" | "debit";
  /** USD cents (positive). */
  amountUsdCents?: number;
  type?: string;
  description?: string;
  /** Allow a debit to push the balance negative (admin override). */
  force?: boolean;
}

/** Body of POST /api/admin/recurring — attach a monthly charge to a customer. */
export interface RecurringPayload {
  customerId?: string;
  siteId?: string;
  /** A recurring catalogue key (e.g. "hosting_dynamic") — fills kind/label/amount. */
  planKey?: string;
  /** Or specify manually: */
  kind?: RecurringKind;
  label?: string;
  amountUsdCents?: number;
  /** ISO date for the first charge; defaults to now (charges on next run). */
  nextChargeAt?: string;
}

/** Recurring-charge lifecycle states (single source of truth for runtime + types). */
export const RECURRING_STATUSES = ["active", "paused", "canceled"] as const;
export type RecurringChargeStatus = (typeof RECURRING_STATUSES)[number];

/** Body of PATCH /api/admin/recurring — pause / resume / cancel a charge. */
export interface RecurringPatchPayload {
  id?: string;
  status?: RecurringChargeStatus;
}

/** Site lifecycle states (single source of truth for runtime + types). */
export const SITE_STATUSES = [
  "draft",
  "live",
  "suspended",
  "offboarded",
] as const;
export type SiteStatus = (typeof SITE_STATUSES)[number];

/** Body of PATCH /api/admin/sites — change a site's lifecycle status. */
export interface SitePatchPayload {
  id?: string;
  status?: SiteStatus;
}
