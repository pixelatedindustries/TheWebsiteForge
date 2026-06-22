import { desc } from "drizzle-orm";

/**
 * GET /api/admin/change-requests — customer change/feature requests with the
 * customer name attached, newest first. Admins quote these; the customer then
 * approves + pays from their wallet.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb();
  const { limit, offset } = getPagination(event);

  const [rows, customerRows] = await Promise.all([
    db
      .select()
      .from(schema.changeRequests)
      .orderBy(desc(schema.changeRequests.createdAt))
      .limit(limit)
      .offset(offset),
    db.select().from(schema.customers),
  ]);

  const byId = new Map(customerRows.map((c) => [c.id, c]));
  const requests = rows.map((r) => ({
    ...r,
    customerName: byId.get(r.customerId)?.name ?? "—",
    customerEmail: byId.get(r.customerId)?.email ?? "—",
  }));

  return { requests, pagination: { limit, offset } };
});
