import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaystackData, PaystackEvent } from "../../types/paystack";

/**
 * POST /api/webhooks/paystack
 *
 * Keeps our DB in sync with Paystack (see plan §5.3). Paystack signs every
 * request with an `x-paystack-signature` header that is the HMAC-SHA512 of the
 * **raw** request body using our secret key.
 *
 * The Website Forge runs the wallet model: all recurring billing is debited
 * from the prepaid wallet by the scheduled task (not Paystack card
 * subscriptions). So the only Paystack event we act on is `charge.success`
 * (wallet top-ups and one-off build payments). The legacy Paystack-native
 * subscription/invoice events are intentionally ignored (acknowledged with 200)
 * — see the deprecated `subscriptions` table.
 *
 * Security:
 *  - We read the RAW body so the signature check matches the exact bytes hashed.
 *  - We reject any request whose signature doesn't verify (401).
 *  - Handlers are idempotent: Paystack retries delivery.
 *
 * We always return 200 quickly once the signature is valid so Paystack stops
 * retrying; handler issues are logged, not surfaced as 500s.
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
      default:
        // Everything else (including legacy subscription.*/invoice.* events from
        // the retired card-subscription model) is acknowledged and ignored.
        console.info(`[paystack] ignoring event: ${type}`);
    }
  } catch (err) {
    // Log but still 200: a 500 just makes Paystack redeliver the same event.
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

/* ------------------------------- helpers ------------------------------- */

/** Constant-time compare of two hex-encoded strings. */
function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length === 0 || ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
