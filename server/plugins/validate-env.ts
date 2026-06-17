/**
 * Startup configuration check (S8).
 *
 * Validates that the secrets the app depends on are present when the server
 * boots, so a misconfiguration surfaces immediately at deploy time instead of
 * as a 500 on the first webhook / sign-in. In production a missing required
 * secret throws (fail fast); in dev it only warns so local work isn't blocked.
 */
const REQUIRED = [
  "PAYSTACK_SECRET_KEY",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "DATABASE_URL",
] as const;

export default defineNitroPlugin(() => {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length === 0) return;

  const message = `[config] Missing required environment variables: ${missing.join(", ")}`;
  if (process.env.NODE_ENV === "production") {
    // Fail fast — don't start serving traffic in a broken security state.
    throw new Error(message);
  }
  console.warn(`${message} (dev: continuing, but related features will fail)`);
});
