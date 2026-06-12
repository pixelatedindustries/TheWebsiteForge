/**
 * Lightweight per-IP rate limiting for abuse-prone public endpoints
 * (issues.md #5). Uses a fixed-window counter in module memory.
 *
 * NOTE: this is per-instance. On a single Node deployment it is effective; if
 * you scale to multiple instances or serverless, back it with a shared store
 * (e.g. Redis) so the window is global. The map is pruned lazily to avoid
 * unbounded growth.
 */

interface Rule {
  /** Max requests allowed within the window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/** Route prefix → limit. Matched by `pathname.startsWith(prefix)`. */
const RULES: Record<string, Rule> = {
  "/api/contact": { max: 10, windowMs: 60 * 60 * 1000 }, // 10 / hour
  "/api/checkout/create": { max: 30, windowMs: 60 * 60 * 1000 }, // 30 / hour
};

interface Counter {
  count: number;
  resetAt: number;
}

const hits = new Map<string, Counter>();
let lastPrune = 0;

function prune(now: number): void {
  // Sweep expired entries at most once a minute.
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [key, c] of hits) {
    if (c.resetAt <= now) hits.delete(key);
  }
}

export default defineEventHandler((event) => {
  // Only POSTs to the configured endpoints are limited.
  if (event.method !== "POST") return;

  const pathname = getRequestURL(event).pathname;
  const prefix = Object.keys(RULES).find((p) => pathname.startsWith(p));
  if (!prefix) return;

  const rule = RULES[prefix]!;
  const now = Date.now();
  prune(now);

  const ip =
    getRequestIP(event, { xForwardedFor: true }) ||
    getRequestHeader(event, "x-real-ip") ||
    "unknown";
  const key = `${prefix}:${ip}`;

  let counter = hits.get(key);
  if (!counter || counter.resetAt <= now) {
    counter = { count: 0, resetAt: now + rule.windowMs };
    hits.set(key, counter);
  }
  counter.count += 1;

  const remaining = Math.max(0, rule.max - counter.count);
  setResponseHeader(event, "X-RateLimit-Limit", String(rule.max));
  setResponseHeader(event, "X-RateLimit-Remaining", String(remaining));

  if (counter.count > rule.max) {
    const retryAfter = Math.ceil((counter.resetAt - now) / 1000);
    setResponseHeader(event, "Retry-After", retryAfter);
    throw createError({
      statusCode: 429,
      statusMessage: "Too many requests. Please try again later.",
    });
  }
});
