import { desc } from "drizzle-orm";

/**
 * GET /api/admin/billing — subscriptions and invoices with customer names,
 * for the billing overview (active/past-due/canceled, paid/open/failed).
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb();

  const [subRows, invoiceRows, customerRows] = await Promise.all([
    db.select().from(schema.subscriptions).orderBy(desc(schema.subscriptions.createdAt)),
    db.select().from(schema.invoices).orderBy(desc(schema.invoices.issuedAt)),
    db.select().from(schema.customers),
  ]);

  const nameById = new Map(customerRows.map((c) => [c.id, c.name]));

  const subscriptions = subRows.map((s) => ({
    ...s,
    customerName: nameById.get(s.customerId) ?? "—",
  }));
  const invoices = invoiceRows.map((i) => ({
    ...i,
    customerName: nameById.get(i.customerId) ?? "—",
  }));

  return { subscriptions, invoices };
});
