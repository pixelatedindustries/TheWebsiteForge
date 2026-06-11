import { eq, desc } from "drizzle-orm";

/**
 * GET /api/admin/customer-billing?customerId= (WebForgePlan2 §5)
 *
 * Per-customer wallet detail for the admin "manage billing" panel: balance,
 * recurring charges, and the recent ledger. All amounts are USD cents.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const customerId = String(getQuery(event).customerId ?? "");
  if (!customerId) {
    throw createError({
      statusCode: 422,
      statusMessage: "`customerId` is required.",
    });
  }

  const db = useDb();
  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, customerId))
    .limit(1);
  if (!customer) {
    throw createError({
      statusCode: 404,
      statusMessage: "Customer not found.",
    });
  }

  const [recurring, transactions] = await Promise.all([
    db
      .select()
      .from(schema.recurringCharges)
      .where(eq(schema.recurringCharges.customerId, customerId))
      .orderBy(desc(schema.recurringCharges.createdAt)),
    db
      .select()
      .from(schema.walletTransactions)
      .where(eq(schema.walletTransactions.customerId, customerId))
      .orderBy(desc(schema.walletTransactions.createdAt))
      .limit(25),
  ]);

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      walletBalanceCents: customer.walletBalanceCents ?? 0,
    },
    recurring,
    transactions,
  };
});
