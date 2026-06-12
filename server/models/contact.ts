/**
 * Public contact/lead request DTO (business domain).
 */

/** Body of POST /api/contact. */
export interface ContactPayload {
  name?: string;
  email?: string;
  company?: string;
  budget?: string;
  message?: string;
  /** honeypot — must stay empty */
  website?: string;
}
