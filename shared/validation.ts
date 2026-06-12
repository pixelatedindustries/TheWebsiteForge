/**
 * Shared input validators used by both the Vue app and the Nitro server so the
 * rules can't drift between client-side hints and server-side enforcement.
 */

/**
 * Pragmatic email check. Intentionally not a full RFC 5322 parser (those reject
 * many valid addresses and accept many invalid ones); this guards the common
 * mistakes and — crucially — rejects whitespace, so a value that passes can
 * never carry CR/LF into an email header. Final deliverability is verified at
 * send time by the mail provider.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string | null | undefined): boolean {
  const email = (value ?? "").trim();
  if (email.length > 254) return false;
  return EMAIL_RE.test(email);
}
