import { desc } from "drizzle-orm";

/**
 * GET /api/admin/customers — customers with derived site count and MRR.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb();
  const { limit, offset } = getPagination(event);

  const [customerRows, siteRows, recurring] = await Promise.all([
    db
      .select()
      .from(schema.customers)
      .orderBy(desc(schema.customers.createdAt))
      .limit(limit)
      .offset(offset),
    db.select().from(schema.sites),
    db.select().from(schema.recurringCharges),
  ]);

  const monthlyCents = (amount: number, interval: string) =>
    interval === "year" ? Math.round(amount / 12) : amount;

  const customers = customerRows.map((c) => {
    const siteCount = siteRows.filter((s) => s.customerId === c.id).length;
    const mrrCents = recurring
      .filter((r) => r.customerId === c.id && r.status === "active")
      .reduce((sum, r) => sum + monthlyCents(r.amountCents, r.interval), 0);
    return { ...c, siteCount, mrrCents };
  });

  return { customers, pagination: { limit, offset } };
});
