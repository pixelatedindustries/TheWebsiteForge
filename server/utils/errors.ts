/**
 * Server-handler error sanitiser.
 *
 * h3 errors raised via `createError` already carry a deliberate statusCode and
 * client-safe message, so they pass through untouched. Anything else (a raw
 * Drizzle/pg error, a thrown string, an unexpected exception) is logged
 * server-side and replaced with a generic 500 so internal details — SQL,
 * connection strings, stack traces — never leak to the client.
 *
 * Returns `never`, so calling it inside a `catch` satisfies the type checker
 * that the path always throws.
 */
export function toSafeError(
  err: unknown,
  context: string,
  fallbackMessage = "Something went wrong. Please try again.",
): never {
  if (isError(err)) throw err;
  console.error(`[${context}] unexpected error:`, err);
  throw createError({ statusCode: 500, statusMessage: fallbackMessage });
}
