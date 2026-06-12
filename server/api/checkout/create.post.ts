import { and, eq } from "drizzle-orm";
import {
  getBuildPackage,
  MIN_TOPUP_USD_CENTS,
  MAX_TOPUP_USD_CENTS,
  WALLET_CURRENCY,
  CHARGE_CURRENCY,
} from "../../../shared/billing";
import type { CheckoutPayload } from "../../../shared/checkout";
import { isValidEmail } from "../../../shared/validation";

/**
 * POST /api/checkout/create (WebForgePlan2 §4.3 / §4.6)
 *
 * Starts a Paystack hosted-checkout transaction. Prices are USD; a South
 * African Paystack account charges ZAR, so we convert USD→ZAR here and charge
 * that (the UI shows the ZAR amount before the customer confirms).
 *
 *  - purpose "build" → one-off website package. Records a pending `invoices`
 *    row keyed by the reference; the webhook marks it paid.
 *  - purpose "topup" → adds prepaid wallet credit. The webhook credits the
 *    wallet (in USD) once the ZAR charge succeeds.
 *
 * Returns `{ reference, authorizationUrl, accessCode, usdCents, zarCents }`.
 * Redirect the browser to `authorizationUrl` (hosted page) — on return we
 * verify before granting value (never trust the redirect alone).
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<CheckoutPayload>(event);
  const purpose = body?.purpose === "topup" ? "topup" : "build";

  // Resolve the buyer: prefer the signed-in customer, else the supplied email.
  const identity = await getOptionalCustomer(event);
  const email = (identity?.email || body?.email || "").trim().toLowerCase();
  const name = identity?.name || body?.name?.trim() || email;
  if (!isValidEmail(email)) {
    throw createError({
      statusCode: 422,
      statusMessage: "A valid email is required to check out.",
    });
  }

  // Determine USD amount + a human label per purpose.
  let usdCents: number;
  let label: string;
  let buildKey: string | null = null;
  let walletApplyCents = 0;

  if (purpose === "topup") {
    usdCents = Math.round(body?.amountUsdCents ?? 0);
    if (!Number.isFinite(usdCents) || usdCents < MIN_TOPUP_USD_CENTS) {
      throw createError({
        statusCode: 422,
        statusMessage: `Minimum top-up is $${(MIN_TOPUP_USD_CENTS / 100).toFixed(0)}.`,
      });
    }
    if (usdCents > MAX_TOPUP_USD_CENTS) {
      throw createError({
        statusCode: 422,
        statusMessage: `Maximum top-up is $${(MAX_TOPUP_USD_CENTS / 100).toLocaleString("en-US")}.`,
      });
    }
    label = "Wallet top-up";
  } else {
    const pkg = getBuildPackage(body?.planKey ?? "");
    if (!pkg) {
      throw createError({
        statusCode: 422,
        statusMessage: "Unknown build package.",
      });
    }
    usdCents = pkg.amountUsdCents;
    label = `${pkg.label} website build`;
    buildKey = pkg.key;
  }

  const db = useDb();

  // Upsert the customer by email so we have an owner for the invoice/wallet.
  let customer = (
    await db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.email, email))
      .limit(1)
  )[0];
  if (!customer) {
    try {
      [customer] = await db
        .insert(schema.customers)
        .values({ name, email, firebaseUid: identity?.uid ?? null })
        .returning();
    } catch (err) {
      // A concurrent checkout for the same new email can win the insert race
      // (unique email constraint). Reuse the row it created instead of 500ing.
      if (!isUniqueViolation(err)) throw err;
      [customer] = await db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.email, email))
        .limit(1);
    }
  } else if (identity?.uid && !customer.firebaseUid) {
    await db
      .update(schema.customers)
      .set({ firebaseUid: identity.uid })
      .where(eq(schema.customers.id, customer.id));
  }
  if (!customer) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not resolve customer.",
    });
  }

  // If a siteId is supplied, it must belong to the resolved customer — never
  // trust a client-supplied siteId, or it could be attached to another
  // customer's invoice/wallet debit (horizontal privilege escalation).
  let siteId: string | null = null;
  if (body?.siteId) {
    const [site] = await db
      .select({ id: schema.sites.id })
      .from(schema.sites)
      .where(
        and(
          eq(schema.sites.id, body.siteId),
          eq(schema.sites.customerId, customer.id),
        ),
      )
      .limit(1);
    if (!site) {
      throw createError({
        statusCode: 403,
        statusMessage: "That site doesn't belong to your account.",
      });
    }
    siteId = site.id;
  }

  // Build checkout can apply prepaid wallet funds first for signed-in customers.
  if (purpose === "build" && body?.useWalletFirst && identity?.uid) {
    walletApplyCents = Math.max(
      0,
      Math.min(usdCents, Math.round(customer.walletBalanceCents ?? 0)),
    );
  }

  const chargeUsdCents = Math.max(0, usdCents - walletApplyCents);

  // Convert USD → ZAR for the actual Paystack charge.
  const zarCents = usdCentsToZarCents(chargeUsdCents);
  const fxRate = String(getUsdToZarRate());

  const reference = generateReference(
    purpose === "topup" ? "twf_topup" : "twf_build",
  );
  const config = useRuntimeConfig(event);
  const siteUrl =
    (config.public?.siteUrl as string) ||
    process.env.NUXT_PUBLIC_SITE_URL ||
    getRequestURL(event).origin;
  const callbackUrl = `${siteUrl.replace(/\/$/, "")}/checkout/success?reference=${reference}`;

  // For a build, create the invoice keyed by the reference.
  // - full wallet cover: paid immediately (no Paystack redirect)
  // - otherwise: open until webhook/verify fulfillment marks it paid
  if (purpose === "build") {
    const now = new Date();
    const fullyCoveredByWallet = chargeUsdCents === 0;

    if (fullyCoveredByWallet && walletApplyCents > 0) {
      // Debit the wallet and record the paid invoice in ONE transaction so a
      // failed invoice insert rolls back the debit — we never take money
      // without a matching order record.
      await db.transaction(async (tx) => {
        const debit = await debitWallet({
          customerId: customer.id,
          type: "adjustment",
          amountCents: walletApplyCents,
          description: `${label} (wallet payment)`,
          reference,
          siteId,
          createdBy: "system",
          allowNegative: false,
          tx,
        });

        if (!debit.ok) {
          throw createError({
            statusCode: 409,
            statusMessage:
              "Wallet balance changed. Please refresh and try again.",
          });
        }

        await tx.insert(schema.invoices).values({
          customerId: customer.id,
          siteId,
          type: "build",
          amountCents: usdCents,
          currency: WALLET_CURRENCY,
          status: "paid",
          provider: "wallet",
          providerInvoiceId: reference,
          paidAt: now,
        });
      });
    } else {
      // Not wallet-covered: record an open invoice for Paystack to settle.
      await db.insert(schema.invoices).values({
        customerId: customer.id,
        siteId,
        type: "build",
        amountCents: usdCents,
        currency: WALLET_CURRENCY,
        status: fullyCoveredByWallet ? "paid" : "open",
        provider: fullyCoveredByWallet ? "wallet" : "paystack",
        providerInvoiceId: reference,
        paidAt: fullyCoveredByWallet ? now : null,
      });
    }

    // Wallet-only build purchase: no external checkout needed.
    if (fullyCoveredByWallet) {
      return {
        reference,
        authorizationUrl: `${siteUrl.replace(/\/$/, "")}/checkout/success?reference=${reference}`,
        accessCode: "",
        usdCents,
        zarCents: 0,
        walletAppliedCents: walletApplyCents,
        publicKey: config.public?.paystackPublicKey || "",
      };
    }
  }

  const result = await initializeTransaction({
    email,
    amountCents: zarCents,
    reference,
    callbackUrl,
    currency: CHARGE_CURRENCY,
    metadata: {
      purpose,
      planKey: buildKey,
      customerId: customer.id,
      siteId,
      usdCents,
      walletApplyCents,
      fxRate,
      label,
    },
  });

  return {
    reference: result.reference,
    authorizationUrl: result.authorization_url,
    accessCode: result.access_code,
    usdCents,
    zarCents,
    walletAppliedCents: walletApplyCents,
    publicKey: config.public?.paystackPublicKey || "",
  };
});
