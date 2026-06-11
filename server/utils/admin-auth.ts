import type { H3Event } from "h3";
import { verifyIdToken } from "./firebase-admin";

export interface AdminIdentity {
  email: string;
  uid: string;
  name?: string;
}

/** Parsed, lower-cased ADMIN_EMAILS allowlist from the environment. */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/**
 * Verifies the Bearer ID token on the request and confirms the email is in the
 * ADMIN_EMAILS allowlist. Throws 401/403 otherwise. Returns the admin identity.
 */
export async function requireAdmin(event: H3Event): Promise<AdminIdentity> {
  const header = getHeader(event, "authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Missing bearer token." });
  }

  let decoded;
  try {
    decoded = await verifyIdToken(token);
  } catch {
    throw createError({ statusCode: 401, statusMessage: "Invalid or expired token." });
  }

  if (!decoded.email) {
    throw createError({ statusCode: 403, statusMessage: "No email on account." });
  }
  if (!isAdminEmail(decoded.email)) {
    throw createError({ statusCode: 403, statusMessage: "Not authorized for admin." });
  }

  return {
    email: decoded.email,
    uid: decoded.uid,
    name: typeof decoded.name === "string" ? decoded.name : undefined,
  };
}
