import type { H3Event } from "h3";

/**
 * Parse `?limit=&offset=` for admin list endpoints (issues3.md #2).
 *
 * Lists were previously unbounded — a large table could return a huge payload
 * and stall the request. We accept optional client paging but always enforce a
 * server-side hard cap so a single request can never pull the whole table.
 *
 * Defaults are deliberately generous (the admin UI filters client-side) but
 * bounded: `limit` defaults to 200 and is clamped to [1, 500]; `offset` to >= 0.
 */
export interface Pagination {
  limit: number;
  offset: number;
}

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

export function getPagination(event: H3Event): Pagination {
  const q = getQuery(event);

  const rawLimit = Number(q.limit);
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
      : DEFAULT_LIMIT;

  const rawOffset = Number(q.offset);
  const offset =
    Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0;

  return { limit, offset };
}
