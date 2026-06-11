import { eq, sql } from "drizzle-orm";

/**
 * Wallet ledger (WebForgePlan2 §4.2).
 *
 * The ONLY place that mutates a customer's prepaid balance, so the append-only
 * ledger (`wallet_transactions`) and the cached `customers.wallet_balance_cents`
 * can never drift. Every mutation happens inside a DB transaction.
 *
 * All amounts are **USD cents**. `credit` adds, `debit` subtracts. A debit
 * refuses to take the balance below zero unless `allowNegative` is set (admin
 * override).
 */

export type WalletTxnType =
  | "topup"
  | "hosting"
  | "database"
  | "feature"
  | "change"
  | "refund"
  | "adjustment";

export interface WalletMutationInput {
  customerId: string;
  type: WalletTxnType;
  /** Positive USD cents (direction is decided by credit vs debit). */
  amountCents: number;
  description: string;
  reference?: string | null;
  siteId?: string | null;
  /** Admin email, or "system" for the scheduled job. */
  createdBy?: string;
  /** Top-up audit trail. */
  chargedZarCents?: number | null;
  fxRate?: string | null;
}

export interface WalletResult {
  ok: boolean;
  balanceAfterCents: number;
  /** When a debit is declined for insufficient funds, how much was short. */
  shortfallCents?: number;
  transactionId?: string;
  /** True when a credit was rejected because the reference was already used. */
  duplicate?: boolean;
}

/** Current cached USD-cents balance for a customer. */
export async function getWalletBalance(customerId: string): Promise<number> {
  const db = useDb();
  const [row] = await db
    .select({ balance: schema.customers.walletBalanceCents })
    .from(schema.customers)
    .where(eq(schema.customers.id, customerId))
    .limit(1);
  return row?.balance ?? 0;
}

/**
 * Idempotency guard for top-ups: returns true if a wallet transaction with this
 * Paystack reference already exists (so webhook retries don't double-credit).
 */
export async function walletHasReference(reference: string): Promise<boolean> {
  const db = useDb();
  const [row] = await db
    .select({ id: schema.walletTransactions.id })
    .from(schema.walletTransactions)
    .where(eq(schema.walletTransactions.reference, reference))
    .limit(1);
  return !!row;
}

/** Add credit to a wallet (top-up, refund, goodwill adjustment). */
export async function creditWallet(
  input: WalletMutationInput,
): Promise<WalletResult> {
  try {
    return await applyDelta(input, Math.abs(Math.round(input.amountCents)));
  } catch (err) {
    // Unique-violation on `reference` means this top-up was already credited
    // (webhook + verify race). Treat as a no-op duplicate, not an error.
    if (isUniqueViolation(err)) {
      const balance = await getWalletBalance(input.customerId);
      return { ok: false, duplicate: true, balanceAfterCents: balance };
    }
    throw err;
  }
}

/** Detect a Postgres unique-constraint violation (SQLSTATE 23505). */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
}

/**
 * Debit a wallet (recurring charge, feature/change billing). Declines if it
 * would go negative, unless `allowNegative` is true.
 */
export async function debitWallet(
  input: WalletMutationInput & { allowNegative?: boolean },
): Promise<WalletResult> {
  const magnitude = Math.abs(Math.round(input.amountCents));
  return applyDelta(input, -magnitude, input.allowNegative ?? false);
}

/** Shared transactional balance mutation. `delta` is signed USD cents. */
async function applyDelta(
  input: WalletMutationInput,
  delta: number,
  allowNegative = true,
): Promise<WalletResult> {
  const db = useDb();

  return db.transaction(async (tx) => {
    // Lock the customer row for the duration of the transaction so concurrent
    // debits/credits can't race on the balance.
    const [customer] = await tx
      .select({ balance: schema.customers.walletBalanceCents })
      .from(schema.customers)
      .where(eq(schema.customers.id, input.customerId))
      .for("update")
      .limit(1);

    if (!customer) {
      throw createError({
        statusCode: 404,
        statusMessage: "Customer not found.",
      });
    }

    const current = customer.balance ?? 0;
    const next = current + delta;

    if (delta < 0 && next < 0 && !allowNegative) {
      return { ok: false, balanceAfterCents: current, shortfallCents: -next };
    }

    const [txn] = await tx
      .insert(schema.walletTransactions)
      .values({
        customerId: input.customerId,
        type: input.type,
        amountCents: delta,
        balanceAfterCents: next,
        currency: "USD",
        chargedZarCents: input.chargedZarCents ?? null,
        fxRate: input.fxRate ?? null,
        description: input.description,
        reference: input.reference ?? null,
        siteId: input.siteId ?? null,
        createdBy: input.createdBy ?? "system",
      })
      .returning({ id: schema.walletTransactions.id });

    await tx
      .update(schema.customers)
      .set({
        walletBalanceCents: sql`${schema.customers.walletBalanceCents} + ${delta}`,
      })
      .where(eq(schema.customers.id, input.customerId));

    return { ok: true, balanceAfterCents: next, transactionId: txn?.id };
  });
}
