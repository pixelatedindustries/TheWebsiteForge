import { eq } from "drizzle-orm";

interface CustomerPayload {
  name?: string;
  email?: string;
  company?: string;
  /** When converting a won lead, link + mark it. */
  leadId?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/admin/customers (WebForgePlan2 §5)
 *
 * Create a customer, or convert a won lead into one. If a customer with the
 * email already exists we reuse it (idempotent). When `leadId` is given, the
 * lead is linked to the customer and marked `won`.
 */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const body = await readBody<CustomerPayload>(event);

  const name = body?.name?.trim() ?? "";
  const email = body?.email?.trim().toLowerCase() ?? "";
  const company = body?.company?.trim() || null;

  if (name.length < 2 || !EMAIL_RE.test(email)) {
    throw createError({
      statusCode: 422,
      statusMessage: "A valid name and email are required.",
    });
  }

  const db = useDb();

  // Reuse an existing customer with this email, else create one.
  let customer = (
    await db.select().from(schema.customers).where(eq(schema.customers.email, email)).limit(1)
  )[0];
  let created = false;
  if (!customer) {
    [customer] = await db
      .insert(schema.customers)
      .values({ name, email, company })
      .returning();
    created = true;
  }
  if (!customer) {
    throw createError({ statusCode: 500, statusMessage: "Could not create customer." });
  }

  // Convert the lead if supplied.
  if (body?.leadId) {
    await db
      .update(schema.leads)
      .set({ status: "won", customerId: customer.id })
      .where(eq(schema.leads.id, body.leadId));
  }

  await writeAudit(
    admin.email,
    created ? "customer.create" : "customer.link",
    `customer:${customer.id}${body?.leadId ? ` lead:${body.leadId}` : ""}`,
  );

  return { ok: true, customer, created };
});
