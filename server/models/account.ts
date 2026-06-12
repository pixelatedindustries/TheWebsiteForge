/**
 * Customer-account request DTOs (business domain).
 *
 * Shapes for request bodies the customer portal POSTs to `/api/account/*`.
 */

/** Body of POST /api/account/change-request (WebForgePlan2 §4.5). */
export interface ChangeRequestPayload {
  title?: string;
  details?: string;
  siteId?: string;
}
