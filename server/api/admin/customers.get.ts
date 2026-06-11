import { desc } from "drizzle-orm";

/**
 * GET /api/admin/customers — customers with derived site count and MRR.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb();

  const [customerRows, siteRows, subs] = await Promise.all([
    db.select().from(schema.customers).orderBy(desc(schema.customers.createdAt)),
    db.select().from(schema.sites),
    db.select().from(schema.subscriptions),
  ]);

  const monthlyCents = (amount: number, interval: string) =>
    interval === "year" ? Math.round(amount / 12) : amount;

  const customers = customerRows.map((c) => {
    const siteCount = siteRows.filter((s) => s.customerId === c.id).length;
    const mrrCents = subs
      .filter((s) => s.customerId === c.id && s.status === "active")
      .reduce((sum, s) => sum + monthlyCents(s.amountCents, s.interval), 0);
    return { ...c, siteCount, mrrCents };
  });

  return { customers };
});
