import { desc } from "drizzle-orm";

/** GET /api/admin/sites — sites with their customer name attached. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb();

  const [siteRows, customerRows] = await Promise.all([
    db.select().from(schema.sites).orderBy(desc(schema.sites.createdAt)),
    db.select().from(schema.customers),
  ]);

  const nameById = new Map(customerRows.map((c) => [c.id, c.name]));
  const sites = siteRows.map((s) => ({
    ...s,
    customerName: nameById.get(s.customerId) ?? "—",
  }));

  return { sites };
});
