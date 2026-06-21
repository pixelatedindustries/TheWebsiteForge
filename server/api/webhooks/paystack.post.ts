import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type {
  PaystackCustomer,
  PaystackData,
  PaystackEvent,
} from "../../types/paystack";

/**
 * POST /api/webhooks/paystack
 *
 * The single source of truth that keeps our DB in sync with Paystack
 * (see plan §5.3). Paystack sends one webhook URL per mode (test/live) and
 * signs every request with an `x-paystack-signature` header that is the
 * HMAC-SHA512 of the **raw** request body using our secret key — there is no
 * separate signing secret like Stripe's `whsec_`.
 *
 * Security:
 *  - We read the RAW body (not parsed JSON) so the signature check matches the
 *    exact bytes Paystack hashed.
 *  - We reject any request whose signature doesn't verify against
 *    PAYSTACK_SECRET_KEY (401), so spoofed events can't mutate the DB.
 *  - Handlers are idempotent: Paystack retries delivery, so re-processing the
 *    same event must not double-charge or duplicate rows.
 *
 * We always return 200 quickly once the signature is valid so Paystack stops
 * retrying; individual handler issues are logged, not surfaced as 500s (a 500
 * just makes Paystack retry the same failing event).
 *
 * NOTE: customers are matched by email here, which works against the current
 * schema. When you add the `customers.paystackCustomerCode` column (plan §10,
 * Phase 2), prefer matching on that code and fall back to email.
 */
export default defineEventHandler(async (event) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    // Misconfiguration — fail loudly so it's caught in dev, never silently.
    throw createError({
      statusCode: 500,
      statusMessage:
        "PAYSTACK_SECRET_KEY is not set. Add it to .env (see plan §3.1).",
    });
  }

  // 1) Read the RAW body — required for an exact signature match.
  const raw = await readRawBody(event, "utf8");
  if (!raw) {
    throw createError({
      statusCode: 400,
      statusMessage: "Empty webhook body.",
    });
  }

  // 2) Verify the x-paystack-signature header (HMAC-SHA512 of the raw body).
  const signature = getHeader(event, "x-paystack-signature");
  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  if (!signature || !safeEqualHex(signature, expected)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid Paystack signature.",
    });
  }

  // 3) Signature is valid — now it's safe to parse and act on the payload.
  let payload: PaystackEvent;
  try {
    payload = JSON.parse(raw) as PaystackEvent;
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "Malformed JSON body.",
    });
  }

  const type = payload.event;
  const data = payload.data ?? {};

  try {
    switch (type) {
      case "charge.success":
        await handleChargeSuccess(data);
        break;
      case "subscription.create":
        await handleSubscriptionCreate(data);
        break;
      case "invoice.create":
      case "invoice.update":
        await handleInvoiceUpsert(data);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(data);
        break;
      case "subscription.disable":
      case "subscription.not_renew":
        await handleSubscriptionDisable(data);
        break;
      default:
        // Unhandled event types are fine — acknowledge so Paystack stops retrying.
        console.info(`[paystack] ignoring unhandled event: ${type}`);
    }
  } catch (err) {
    // Log but still 200: a 500 just makes Paystack redeliver the same event.
    // Investigate logged failures and replay from the Paystack dashboard if needed.
    console.error(`[paystack] handler for "${type}" failed:`, err);
  }

  return { received: true };
});

/* --------------------------- event handlers --------------------------- */

/**
 * `charge.success` — a payment cleared (top-up or one-off build). Delegates to
 * the shared idempotent fulfillment helper, which re-verifies with Paystack and
 * then credits the wallet (top-up) or marks the invoice paid (build). The same
 * helper runs from the checkout-verify step, so either path completes the order.
 */
async function handleChargeSuccess(data: PaystackData) {
  const reference = data.reference;
  if (!reference) return;
  await finalizeByReference(reference);
}

/**
 * `subscription.create` — Paystack created a subscription after a successful
 * recurring checkout. Upsert the customer (by email) and create/activate the
 * matching `subscriptions` row. Idempotent on the subscription_code.
 */
async function handleSubscriptionCreate(data: PaystackData) {
  const subCode = data.subscription_code;
  if (!subCode) return;

  const db = useDb();
  const email = data.customer?.email;
  if (!email) {
    console.warn(
      `[paystack] subscription.create ${subCode} had no customer email.`,
    );
    return;
  }

  const customer = await upsertCustomerByEmail(db, {
    email,
    name: fullName(data.customer) || email,
  });

  // Persist the Paystack customer code for manage-card / future lookups.
  const customerCode = data.customer?.customer_code;
  if (customerCode && !customer.paystackCustomerCode) {
    await db
      .update(schema.customers)
      .set({ paystackCustomerCode: customerCode })
      .where(eq(schema.customers.id, customer.id));
  }

  // Idempotent: if we already recorded this subscription, just refresh it.
  const [existing] = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.providerSubId, subCode))
    .limit(1);

  const values = {
    customerId: customer.id,
    plan: data.plan?.plan_code ?? data.plan?.name ?? "unknown",
    provider: "paystack",
    providerSubId: subCode,
    status: "active" as const,
    amountCents: safeAmountCents(data.amount ?? data.plan?.amount),
    currency: data.plan?.currency ?? "ZAR",
    interval: mapInterval(data.plan?.interval),
    currentPeriodEnd: parseDate(data.next_payment_date),
  };

  if (existing) {
    await db
      .update(schema.subscriptions)
      .set(values)
      .where(eq(schema.subscriptions.id, existing.id));
  } else {
    await db.insert(schema.subscriptions).values(values);
  }
}

/**
 * `invoice.create` / `invoice.update` — a recurring subscription invoice was
 * raised or changed. Record/refresh the matching `invoices` row and keep the
 * parent subscription's status + period end in sync. Matched on the Paystack
 * invoice code; idempotent.
 */
async function handleInvoiceUpsert(data: PaystackData) {
  const invoiceCode = data.invoice_code ?? data.reference;
  const email = data.customer?.email;
  if (!invoiceCode || !email) return;

  const db = useDb();
  const customer = await upsertCustomerByEmail(db, {
    email,
    name: fullName(data.customer) || email,
  });

  const paid = data.status === "success" || data.paid === true;
  const [existing] = await db
    .select()
    .from(schema.invoices)
    .where(eq(schema.invoices.providerInvoiceId, invoiceCode))
    .limit(1);

  // Don't downgrade an already-paid invoice back to open (and skip the
  // subscription refresh too — matches prior behaviour).
  if (existing && existing.status === "paid" && !paid) return;

  const values = {
    customerId: customer.id,
    type: "hosting" as const,
    amountCents: safeAmountCents(data.amount),
    currency: data.currency ?? "ZAR",
    status: (paid ? "paid" : "open") as "paid" | "open",
    provider: "paystack",
    providerInvoiceId: invoiceCode,
    paidAt: paid ? (parseDate(data.paid_at) ?? new Date()) : null,
  };

  const subCode = data.subscription?.subscription_code;
  const nextPaymentDate = data.subscription?.next_payment_date;

  // Invoice upsert + subscription renewal refresh commit together: the webhook
  // returns 200 (no Paystack retry), so a partial failure here would otherwise
  // leave the invoice and its subscription permanently out of sync.
  await db.transaction(async (tx) => {
    if (existing) {
      await tx
        .update(schema.invoices)
        .set(values)
        .where(eq(schema.invoices.id, existing.id));
    } else {
      await tx.insert(schema.invoices).values(values);
    }

    if (subCode && nextPaymentDate) {
      await tx
        .update(schema.subscriptions)
        .set({
          status: "active",
          currentPeriodEnd: parseDate(nextPaymentDate),
        })
        .where(eq(schema.subscriptions.providerSubId, subCode));
    }
  });
}

/**
 * `invoice.payment_failed` — a recurring charge bounced. Flag the subscription
 * `past_due` and record the failed invoice so dunning can chase it.
 */
async function handleInvoicePaymentFailed(data: PaystackData) {
  const db = useDb();
  const subCode = data.subscription?.subscription_code;
  const invoiceCode = data.invoice_code ?? data.reference;

  // Flag subscription past_due and the invoice failed in one transaction so a
  // partial write can't leave a "past_due sub with no failed invoice" state.
  await db.transaction(async (tx) => {
    if (subCode) {
      await tx
        .update(schema.subscriptions)
        .set({ status: "past_due" })
        .where(eq(schema.subscriptions.providerSubId, subCode));
    }

    if (invoiceCode) {
      const [existing] = await tx
        .select()
        .from(schema.invoices)
        .where(eq(schema.invoices.providerInvoiceId, invoiceCode))
        .limit(1);
      if (existing && existing.status !== "paid") {
        await tx
          .update(schema.invoices)
          .set({ status: "failed" })
          .where(eq(schema.invoices.id, existing.id));
      }
    }
  });

  // Send the dunning ("update your card") email (Phase 1).
  const email = data.customer?.email;
  if (email) {
    let manageUrl: string | null = null;
    if (subCode) {
      try {
        const { link } = await getSubscriptionManageLink(subCode);
        manageUrl = link;
      } catch (err) {
        console.warn(
          `[paystack] could not get manage link for ${subCode}:`,
          err,
        );
      }
    }
    const dunning = paymentFailedEmail({
      name: fullName(data.customer),
      manageUrl,
    });
    void sendEmail({ to: email, ...dunning });
  }
}

/**
 * `subscription.disable` / `subscription.not_renew` — the subscription was
 * cancelled or will not renew. Mark it `canceled`. Idempotent.
 */
async function handleSubscriptionDisable(data: PaystackData) {
  const subCode = data.subscription_code;
  if (!subCode) return;

  const db = useDb();
  await db
    .update(schema.subscriptions)
    .set({ status: "canceled" })
    .where(
      and(
        eq(schema.subscriptions.providerSubId, subCode),
        eq(schema.subscriptions.provider, "paystack"),
      ),
    );
}

/* ------------------------------- helpers ------------------------------- */

/** Find a customer by email, creating a minimal row if none exists. */
async function upsertCustomerByEmail(
  db: ReturnType<typeof useDb>,
  input: { email: string; name: string },
) {
  const [existing] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.email, input.email))
    .limit(1);
  if (existing) return existing;

  // Atomic insert-or-fetch: concurrent webhook retries for the same new email
  // would otherwise race the check-then-insert and the loser would throw a
  // unique-constraint error. ON CONFLICT makes this a no-op upsert.
  const [upserted] = await db
    .insert(schema.customers)
    .values({ name: input.name, email: input.email })
    .onConflictDoUpdate({
      target: schema.customers.email,
      set: { email: input.email },
    })
    .returning();
  if (!upserted) {
    throw new Error(`Failed to create customer for ${input.email}`);
  }
  return upserted;
}

/** Constant-time compare of two hex-encoded strings. */
function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length === 0 || ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function fullName(customer?: PaystackCustomer): string {
  if (!customer) return "";
  return [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
}

/** Map Paystack's plan interval to our `billing_interval` enum. */
function mapInterval(interval?: string): "month" | "year" {
  return interval === "annually" || interval === "yearly" ? "year" : "month";
}

/**
 * Coerce a Paystack amount (minor currency units) to a safe non-negative
 * integer. Guards against missing/malformed payload fields (`undefined`,
 * `"abc"`, negatives) becoming NaN or bad data in the DB.
 */
function safeAmountCents(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : 0;
}

/** Parse a Paystack date string into a Date, or null if absent/invalid. */
function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
