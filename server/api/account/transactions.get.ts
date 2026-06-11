import { eq, desc } from "drizzle-orm";

/**
 * GET /api/account/transactions?limit=&offset= (WebForgePlan2 §4.5)
 *
 * The signed-in customer's wallet ledger (most recent first), paged. Amounts
 * are signed USD cents (+ credit, − debit). Filtered by the verified identity.
 */
export default defineEventHandler(async (event) => {
  const identity = await requireCustomer(event);
  const customer = await resolveCustomer(identity, { createIfMissing: true });
  if (!customer) {
    throw createError({
      statusCode: 404,
      statusMessage: "No customer record.",
    });
  }

  const query = getQuery(event);
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
  const offset = Math.max(Number(query.offset) || 0, 0);

  const db = useDb();
  const rows = await db
    .select()
    .from(schema.walletTransactions)
    .where(eq(schema.walletTransactions.customerId, customer.id))
    .orderBy(desc(schema.walletTransactions.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    currency: "USD",
    transactions: rows.map((t) => ({
      id: t.id,
      type: t.type,
      amountCents: t.amountCents,
      balanceAfterCents: t.balanceAfterCents,
      description: t.description,
      reference: t.reference,
      createdAt: t.createdAt,
    })),
  };
});
