import { desc, eq } from "drizzle-orm";

/**
 * GET /api/account/billing (WebForgePlan2 §4.5)
 *
 * The signed-in customer's one-off invoices (website builds) and their sites.
 * Recurring billing now lives in the wallet (see /api/account/wallet); this
 * endpoint covers the one-off side. Filtered strictly by the verified identity.
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
  const [invoices, sites] = await Promise.all([
    db
      .select()
      .from(schema.invoices)
      .where(eq(schema.invoices.customerId, customer.id))
      .orderBy(desc(schema.invoices.issuedAt)),
    db
      .select()
      .from(schema.sites)
      .where(eq(schema.sites.customerId, customer.id))
      .orderBy(desc(schema.sites.createdAt)),
  ]);

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      company: customer.company,
    },
    invoices,
    sites,
  };
});
