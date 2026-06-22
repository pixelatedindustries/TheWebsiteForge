import { and, eq } from "drizzle-orm";
import { MAX_RECURRING_MONTHLY_USD_CENTS } from "../../../shared/billing";
import type { DomainCreatePayload } from "../../models/admin";

/**
 * POST /api/admin/domains — register/track a domain for a customer.
 *
 * If `autoRenew` is on and an annual cost + expiry are given, a yearly
 * recurring charge (kind=domain, interval=year) is created in the same
 * transaction so the billing task drains the renewal from the wallet and
 * advances the expiry. Domain recurring charges use a null siteId (so multiple
 * domains per customer don't collide on the active-charge unique index) and
 * link back to the domain via domainId.
 */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const body = await readBody<DomainCreatePayload>(event);

  const customerId = body?.customerId;
  const fqdn = body?.fqdn?.trim().toLowerCase();
  if (!customerId || !fqdn || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(fqdn)) {
    throw createError({
      statusCode: 422,
      statusMessage: "`customerId` and a valid `fqdn` are required.",
    });
  }

  const db = useDb();

  const [customer] = await db
    .select({ id: schema.customers.id })
    .from(schema.customers)
    .where(eq(schema.customers.id, customerId))
    .limit(1);
  if (!customer) {
    throw createError({ statusCode: 404, statusMessage: "Customer not found." });
  }

  // A supplied siteId must belong to this customer.
  let siteId: string | null = null;
  if (body.siteId) {
    const [site] = await db
      .select({ id: schema.sites.id })
      .from(schema.sites)
      .where(
        and(
          eq(schema.sites.id, body.siteId),
          eq(schema.sites.customerId, customerId),
        ),
      )
      .limit(1);
    if (!site) {
      throw createError({
        statusCode: 422,
        statusMessage: "That site doesn't belong to this customer.",
      });
    }
    siteId = site.id;
  }

  const annualCostCents =
    body.annualCostUsdCents != null
      ? Math.round(body.annualCostUsdCents)
      : null;
  if (
    annualCostCents != null &&
    (!Number.isFinite(annualCostCents) ||
      annualCostCents < 0 ||
      annualCostCents > MAX_RECURRING_MONTHLY_USD_CENTS)
  ) {
    throw createError({
      statusCode: 422,
      statusMessage: "Invalid annual cost.",
    });
  }

  const autoRenew = body.autoRenew ?? true;
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    throw createError({ statusCode: 422, statusMessage: "Invalid expiry date." });
  }
  const registeredAt = body.registeredAt ? new Date(body.registeredAt) : null;
  if (registeredAt && Number.isNaN(registeredAt.getTime())) {
    throw createError({
      statusCode: 422,
      statusMessage: "Invalid registration date.",
    });
  }

  // dates are stored as `date` columns — use ISO yyyy-mm-dd strings.
  const isoDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

  try {
    const result = await db.transaction(async (tx) => {
      const [domain] = await tx
        .insert(schema.domains)
        .values({
          customerId,
          siteId,
          fqdn,
          registrar: body.registrar?.trim() || "cloudflare",
          registeredAt: isoDate(registeredAt),
          expiresAt: isoDate(expiresAt),
          autoRenew,
          annualCostCents,
        })
        .returning();

      // Wire the yearly renewal charge when we have everything needed.
      if (domain && autoRenew && annualCostCents && annualCostCents > 0 && expiresAt) {
        await tx.insert(schema.recurringCharges).values({
          customerId,
          siteId: null,
          domainId: domain.id,
          kind: "domain",
          label: `${fqdn} renewal`,
          amountCents: annualCostCents,
          interval: "year",
          nextChargeAt: expiresAt,
        });
      }

      return domain;
    });

    await writeAudit(admin.email, "domain.create", `${result?.id} ${fqdn}`);
    return { ok: true, domain: result };
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw createError({
        statusCode: 409,
        statusMessage: "That domain is already registered.",
      });
    }
    throw err;
  }
});
