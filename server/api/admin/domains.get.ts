import { asc } from "drizzle-orm";

/**
 * GET /api/admin/domains — domains with customer name and days-to-expiry,
 * soonest expiry first so lapses are easy to spot.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb();

  const [domainRows, customerRows] = await Promise.all([
    db.select().from(schema.domains).orderBy(asc(schema.domains.expiresAt)),
    db.select().from(schema.customers),
  ]);

  const nameById = new Map(customerRows.map((c) => [c.id, c.name]));
  const now = Date.now();

  const domains = domainRows.map((d) => ({
    ...d,
    customerName: nameById.get(d.customerId) ?? "—",
    daysToExpiry: d.expiresAt
      ? Math.ceil(
          (new Date(d.expiresAt).getTime() - now) / (24 * 60 * 60 * 1000),
        )
      : null,
  }));

  return { domains };
});
