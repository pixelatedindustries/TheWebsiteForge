import { and, eq, desc } from "drizzle-orm";

/**
 * GET /api/account/wallet (WebForgePlan2 §4.5)
 *
 * The signed-in customer's wallet balance, active recurring services, and a
 * "runway" estimate (how long the balance lasts at the current monthly burn).
 * All amounts are USD cents. Filtered strictly by the verified identity.
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

  const db = useDb();
  const recurring = await db
    .select()
    .from(schema.recurringCharges)
    .where(
      and(
        eq(schema.recurringCharges.customerId, customer.id),
        eq(schema.recurringCharges.status, "active"),
      ),
    )
    .orderBy(desc(schema.recurringCharges.createdAt));

  const monthlyBurnCents = recurring.reduce((sum, r) => sum + r.amountCents, 0);
  const balanceCents = customer.walletBalanceCents ?? 0;
  const runwayMonths =
    monthlyBurnCents > 0 ? balanceCents / monthlyBurnCents : null;

  return {
    currency: "USD",
    balanceCents,
    monthlyBurnCents,
    runwayMonths, // null when there are no recurring charges
    recurring: recurring.map((r) => ({
      id: r.id,
      kind: r.kind,
      label: r.label,
      amountCents: r.amountCents,
      interval: r.interval,
      nextChargeAt: r.nextChargeAt,
    })),
  };
});
