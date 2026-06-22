import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";

/**
 * GET /api/admin/billing — invoices (filterable) + active wallet recurring
 * charges, with customer names. Supports filtering by status / type / customer /
 * date range / free-text search, plus pagination (returns a total count).
 *
 * The legacy Paystack `subscriptions` table is no longer surfaced here — the app
 * is on the wallet model, so recurring revenue is `recurring_charges`.
 */
const INVOICE_STATUSES = ["open", "paid", "failed", "refunded"];
const INVOICE_TYPES = [
  "build",
  "hosting",
  "database",
  "domain",
  "care",
  "feature",
];

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb();
  const { limit, offset } = getPagination(event);
  const q = getQuery(event);

  const status = typeof q.status === "string" ? q.status : "";
  const type = typeof q.type === "string" ? q.type : "";
  const customerId = typeof q.customerId === "string" ? q.customerId : "";
  const search = typeof q.q === "string" ? q.q.trim() : "";
  const from = typeof q.from === "string" ? q.from : "";
  const to = typeof q.to === "string" ? q.to : "";

  const conditions = [];
  if (status && INVOICE_STATUSES.includes(status)) {
    conditions.push(eq(schema.invoices.status, status as never));
  }
  if (type && INVOICE_TYPES.includes(type)) {
    conditions.push(eq(schema.invoices.type, type as never));
  }
  if (customerId) {
    conditions.push(eq(schema.invoices.customerId, customerId));
  }
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) {
      conditions.push(gte(schema.invoices.issuedAt, d));
    }
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      conditions.push(lte(schema.invoices.issuedAt, d));
    }
  }
  if (search) {
    const like = `%${search}%`;
    conditions.push(
      or(
        ilike(schema.customers.name, like),
        ilike(schema.customers.email, like),
      )!,
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [invoiceRows, totalRow, recurringRows, customerRows] =
    await Promise.all([
      db
        .select({
          invoice: schema.invoices,
          customerName: schema.customers.name,
        })
        .from(schema.invoices)
        .leftJoin(
          schema.customers,
          eq(schema.invoices.customerId, schema.customers.id),
        )
        .where(where)
        .orderBy(desc(schema.invoices.issuedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.invoices)
        .leftJoin(
          schema.customers,
          eq(schema.invoices.customerId, schema.customers.id),
        )
        .where(where),
      db
        .select()
        .from(schema.recurringCharges)
        .orderBy(desc(schema.recurringCharges.createdAt)),
      db.select().from(schema.customers),
    ]);

  const nameById = new Map(customerRows.map((c) => [c.id, c.name]));

  const invoices = invoiceRows.map((row) => ({
    ...row.invoice,
    customerName: row.customerName ?? "—",
  }));

  const recurring = recurringRows.map((r) => ({
    ...r,
    customerName: nameById.get(r.customerId) ?? "—",
  }));

  return {
    invoices,
    recurring,
    pagination: { limit, offset, total: totalRow[0]?.count ?? 0 },
  };
});
