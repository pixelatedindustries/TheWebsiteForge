import { eq } from "drizzle-orm";

const CREDIT_TYPES = new Set(["topup", "refund", "adjustment"]);
const DEBIT_TYPES = new Set([
  "hosting",
  "database",
  "feature",
  "change",
  "adjustment",
]);

interface WalletAdjustPayload {
  customerId?: string;
  direction?: "credit" | "debit";
  /** USD cents (positive). */
  amountUsdCents?: number;
  type?: string;
  description?: string;
  /** Allow a debit to push the balance negative (admin override). */
  force?: boolean;
}

/**
 * POST /api/admin/wallet (WebForgePlan2 §5)
 *
 * Manually credit or debit a customer's wallet — record an EFT top-up, bill a
 * feature/change ad-hoc, issue a refund, or make a goodwill adjustment. Writes
 * an audit row. All amounts are USD cents.
 */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const body = await readBody<WalletAdjustPayload>(event);

  const customerId = body?.customerId;
  const direction = body?.direction;
  const amount = Math.round(body?.amountUsdCents ?? 0);
  const type = body?.type ?? "adjustment";
  const description = body?.description?.trim() || "Admin adjustment";

  if (!customerId || (direction !== "credit" && direction !== "debit")) {
    throw createError({
      statusCode: 422,
      statusMessage:
        "`customerId` and a `direction` of credit/debit are required.",
    });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw createError({
      statusCode: 422,
      statusMessage: "A positive amount is required.",
    });
  }
  const allowed = direction === "credit" ? CREDIT_TYPES : DEBIT_TYPES;
  if (!allowed.has(type)) {
    throw createError({
      statusCode: 422,
      statusMessage: `Invalid type "${type}" for a ${direction}.`,
    });
  }

  const result =
    direction === "credit"
      ? await creditWallet({
          customerId,
          type: type as never,
          amountCents: amount,
          description,
          createdBy: admin.email,
        })
      : await debitWallet({
          customerId,
          type: type as never,
          amountCents: amount,
          description,
          createdBy: admin.email,
          allowNegative: body?.force === true,
        });

  if (!result.ok) {
    throw createError({
      statusCode: 409,
      statusMessage: `Insufficient balance (short ${((result.shortfallCents ?? 0) / 100).toFixed(2)} USD). Use force to override.`,
    });
  }

  await writeAudit(
    admin.email,
    `wallet.${direction}`,
    `customer:${customerId} ${type} ${amount}c — ${description}`,
  );

  return { ok: true, balanceAfterCents: result.balanceAfterCents };
});
