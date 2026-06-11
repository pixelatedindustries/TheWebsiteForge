import { eq } from "drizzle-orm";

/**
 * Shared payment fulfillment (WebForgePlan2 §4.3/§4.6).
 *
 * The single place that turns a *successful* Paystack transaction into value:
 *  - top-up  → credit the customer's wallet (USD), email a receipt
 *  - build   → mark the matching one-off invoice paid, email a receipt
 *
 * Called from BOTH the webhook (`charge.success`) and the checkout-verify step
 * (the success page). Either path can fulfill, so a top-up still completes even
 * if the webhook is delayed or not configured. Idempotent on the Paystack
 * `reference` — running twice never double-credits (guarded by the
 * `wallet_transactions.reference` unique index + a pre-check, and by the
 * invoice's `paid` status for builds).
 *
 * Always re-verifies with Paystack first — never trusts a redirect or an
 * unverified event payload.
 */

export interface FinalizeResult {
  ok: boolean;
  status: string; // "success" | "failed" | "abandoned" | "verify_failed" | ...
  kind?: "topup" | "build";
  balanceAfterCents?: number;
}

export async function finalizeByReference(
  reference: string,
): Promise<FinalizeResult> {
  let verified;
  try {
    verified = await verifyTransaction(reference);
  } catch (err) {
    console.error(`[fulfillment] verify failed for ${reference}:`, err);
    return { ok: false, status: "verify_failed" };
  }

  if (verified.status !== "success") {
    return { ok: false, status: verified.status };
  }

  const meta = (verified.metadata ?? {}) as Record<string, unknown>;
  const purpose = typeof meta.purpose === "string" ? meta.purpose : undefined;

  if (purpose === "topup" || reference.startsWith("twf_topup")) {
    return finalizeTopup(reference, verified, meta);
  }
  return finalizeBuild(reference, verified, meta);
}

/* ------------------------------- top-up -------------------------------- */

async function finalizeTopup(
  reference: string,
  verified: {
    amount: number;
    customer?: { email?: string; customer_code?: string };
  },
  meta: Record<string, unknown>,
): Promise<FinalizeResult> {
  // Idempotency pre-check (the unique index is the hard guarantee).
  if (await walletHasReference(reference)) {
    return { ok: true, status: "success", kind: "topup" };
  }

  const customerId =
    typeof meta.customerId === "string" ? meta.customerId : undefined;
  const usdCents = Number(meta.usdCents ?? 0);
  if (!customerId || !Number.isFinite(usdCents) || usdCents <= 0) {
    console.warn(
      `[fulfillment] topup ${reference} missing customerId/usdCents metadata.`,
    );
    return { ok: false, status: "missing_metadata" };
  }

  const db = useDb();
  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, customerId))
    .limit(1);
  if (!customer) {
    console.warn(
      `[fulfillment] topup ${reference} for unknown customer ${customerId}.`,
    );
    return { ok: false, status: "unknown_customer" };
  }

  // Persist the Paystack customer code for future lookups.
  const customerCode = verified.customer?.customer_code;
  if (customerCode && !customer.paystackCustomerCode) {
    await db
      .update(schema.customers)
      .set({ paystackCustomerCode: customerCode })
      .where(eq(schema.customers.id, customer.id));
  }

  const result = await creditWallet({
    customerId,
    type: "topup",
    amountCents: usdCents,
    description: "Wallet top-up",
    reference,
    createdBy: "system",
    chargedZarCents: verified.amount,
    fxRate: meta.fxRate != null ? String(meta.fxRate) : null,
  });

  // A concurrent run (webhook + verify) may have credited first — treat the
  // duplicate as success without re-sending the receipt.
  if (!result.ok && result.duplicate) {
    return { ok: true, status: "success", kind: "topup" };
  }

  if (customer.email) {
    const mail = walletTopupEmail({
      name: customer.name,
      amountCents: usdCents,
      balanceAfterCents: result.balanceAfterCents,
      reference,
    });
    void sendEmail({ to: customer.email, replyTo: getSupportEmail(), ...mail });
  }

  return {
    ok: true,
    status: "success",
    kind: "topup",
    balanceAfterCents: result.balanceAfterCents,
  };
}

/* -------------------------------- build -------------------------------- */

async function finalizeBuild(
  reference: string,
  verified: { customer?: { email?: string; customer_code?: string } },
  meta: Record<string, unknown>,
): Promise<FinalizeResult> {
  const db = useDb();
  const [invoice] = await db
    .select()
    .from(schema.invoices)
    .where(eq(schema.invoices.providerInvoiceId, reference))
    .limit(1);

  if (!invoice) {
    console.info(`[fulfillment] no local invoice for build ref ${reference}.`);
    return { ok: false, status: "no_invoice" };
  }
  if (invoice.status === "paid") {
    return { ok: true, status: "success", kind: "build" };
  }

  const walletApplyCents = Math.max(0, Number(meta.walletApplyCents ?? 0));
  if (walletApplyCents > 0) {
    const walletResult = await debitWallet({
      customerId: invoice.customerId,
      type: "adjustment",
      amountCents: walletApplyCents,
      description: `Wallet applied to build payment (${reference})`,
      reference,
      siteId: invoice.siteId,
      createdBy: "system",
      allowNegative: false,
    });
    if (!walletResult.ok) {
      console.warn(
        `[fulfillment] wallet debit failed for build ${reference}; shortfall=${walletResult.shortfallCents ?? 0}`,
      );
      return { ok: false, status: "wallet_insufficient", kind: "build" };
    }
  }

  await db
    .update(schema.invoices)
    .set({ status: "paid", paidAt: new Date(), provider: "paystack" })
    .where(eq(schema.invoices.id, invoice.id));

  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, invoice.customerId))
    .limit(1);

  const customerCode = verified.customer?.customer_code;
  if (customer && customerCode && !customer.paystackCustomerCode) {
    await db
      .update(schema.customers)
      .set({ paystackCustomerCode: customerCode })
      .where(eq(schema.customers.id, customer.id));
  }

  const to = customer?.email || verified.customer?.email;
  if (to) {
    const receipt = receiptEmail({
      name: customer?.name,
      description: invoice.type === "build" ? "Website build" : invoice.type,
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      reference,
    });
    void sendEmail({ to, replyTo: getSupportEmail(), ...receipt });
  }

  return { ok: true, status: "success", kind: "build" };
}
