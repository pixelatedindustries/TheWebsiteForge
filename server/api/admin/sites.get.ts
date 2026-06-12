import { desc } from "drizzle-orm";

/** GET /api/admin/sites — sites with their customer name attached (capped). */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb();
  const { limit, offset } = getPagination(event);

  const [siteRows, customerRows] = await Promise.all([
    db
      .select()
      .from(schema.sites)
      .orderBy(desc(schema.sites.createdAt))
      .limit(limit)
      .offset(offset),
    db.select().from(schema.customers),
  ]);

  const nameById = new Map(customerRows.map((c) => [c.id, c.name]));
  const sites = siteRows.map((s) => ({
    ...s,
    customerName: nameById.get(s.customerId) ?? "—",
  }));

  return { sites, pagination: { limit, offset } };
});
