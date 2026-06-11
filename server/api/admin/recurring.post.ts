import { getRecurringService, type RecurringKind } from "../../../shared/billing";

interface RecurringPayload {
  customerId?: string;
  siteId?: string;
  /** A recurring catalogue key (e.g. "hosting_dynamic") — fills kind/label/amount. */
  planKey?: string;
  /** Or specify manually: */
  kind?: RecurringKind;
  label?: string;
  amountUsdCents?: number;
  /** ISO date for the first charge; defaults to now (charges on next run). */
  nextChargeAt?: string;
}

/**
 * POST /api/admin/recurring (WebForgePlan2 §5)
 *
 * Attach a monthly recurring charge (hosting / database) to a customer — the
 * scheduled task debits it from their wallet. Either pass a catalogue `planKey`
 * or specify `kind` + `label` + `amountUsdCents` directly.
 */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const body = await readBody<RecurringPayload>(event);

  if (!body?.customerId) {
    throw createError({ statusCode: 422, statusMessage: "`customerId` is required." });
  }

  let kind: RecurringKind;
  let label: string;
  let amountCents: number;
  let planKey: string | null = null;

  if (body.planKey) {
    const svc = getRecurringService(body.planKey);
    if (!svc) {
      throw createError({ statusCode: 422, statusMessage: `Unknown service "${body.planKey}".` });
    }
    kind = svc.kind;
    label = svc.label;
    amountCents = svc.amountUsdCents;
    planKey = svc.key;
  } else {
    if (!body.kind || !body.label || !body.amountUsdCents) {
      throw createError({
        statusCode: 422,
        statusMessage: "Provide a planKey, or kind + label + amountUsdCents.",
      });
    }
    kind = body.kind;
    label = body.label.trim();
    amountCents = Math.round(body.amountUsdCents);
  }

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw createError({ statusCode: 422, statusMessage: "A positive amount is required." });
  }

  const nextChargeAt = body.nextChargeAt ? new Date(body.nextChargeAt) : new Date();
  if (Number.isNaN(nextChargeAt.getTime())) {
    throw createError({ statusCode: 422, statusMessage: "Invalid nextChargeAt date." });
  }

  const db = useDb();
  const [row] = await db
    .insert(schema.recurringCharges)
    .values({
      customerId: body.customerId,
      siteId: body.siteId ?? null,
      kind,
      planKey,
      label,
      amountCents,
      nextChargeAt,
    })
    .returning();

  await writeAudit(
    admin.email,
    "recurring.create",
    `customer:${body.customerId} ${label} ${amountCents}c/mo`,
  );

  return { ok: true, recurringCharge: row };
});
