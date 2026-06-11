import { and, eq, lte } from "drizzle-orm";
import { useDb, schema } from "../../utils/db";
import { debitWallet } from "../../utils/wallet";
import { sendEmail, getSupportEmail } from "../../utils/email";
import { lowBalanceEmail, suspensionEmail } from "../../utils/email-templates";

/**
 * Scheduled task: debit due recurring charges from customer wallets
 * (WebForgePlan2 §4.4). Configured in nuxt.config.ts to run daily at 06:00.
 *
 * For each active charge whose `next_charge_at` is due:
 *  - If the wallet covers it → debit, advance the date one month, clear any
 *    low-balance flag.
 *  - If not → start (or continue) a grace window. On first miss, email a
 *    low-balance warning. After GRACE_DAYS still unpaid, suspend the site and
 *    pause the charge.
 *
 * Idempotency: we only debit charges that are due, and advancing
 * `next_charge_at` in the same pass prevents a same-day re-run from
 * double-charging.
 */

const GRACE_DAYS = 7;

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function topupUrl(): string | null {
  const base = process.env.NUXT_PUBLIC_SITE_URL;
  return base ? `${base.replace(/\/$/, "")}/account` : null;
}

export default defineTask({
  meta: {
    name: "billing:charge-recurring",
    description: "Debit due recurring charges from customer wallets.",
  },
  async run() {
    const db = useDb();
    const now = new Date();

    const due = await db
      .select()
      .from(schema.recurringCharges)
      .where(
        and(
          eq(schema.recurringCharges.status, "active"),
          lte(schema.recurringCharges.nextChargeAt, now),
        ),
      );

    let charged = 0;
    let lowBalance = 0;
    let suspended = 0;

    for (const rc of due) {
      const [customer] = await db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.id, rc.customerId))
        .limit(1);
      if (!customer) continue;

      const result = await debitWallet({
        customerId: rc.customerId,
        type: rc.kind, // "hosting" | "database"
        amountCents: rc.amountCents,
        description: rc.label,
        siteId: rc.siteId,
        createdBy: "system",
      });

      if (result.ok) {
        // Charged successfully — schedule next month, clear any grace flag.
        await db
          .update(schema.recurringCharges)
          .set({
            nextChargeAt: addMonths(rc.nextChargeAt, 1),
            lowBalanceNotifiedAt: null,
          })
          .where(eq(schema.recurringCharges.id, rc.id));
        charged++;
        continue;
      }

      // Insufficient balance.
      if (!rc.lowBalanceNotifiedAt) {
        // First miss → open the grace window and warn.
        await db
          .update(schema.recurringCharges)
          .set({ lowBalanceNotifiedAt: now })
          .where(eq(schema.recurringCharges.id, rc.id));
        lowBalance++;
        if (customer.email) {
          const mail = lowBalanceEmail({
            name: customer.name,
            balanceCents: result.balanceAfterCents,
            serviceLabel: rc.label,
            chargeCents: rc.amountCents,
            graceDays: GRACE_DAYS,
            topupUrl: topupUrl(),
          });
          void sendEmail({
            to: customer.email,
            replyTo: getSupportEmail(),
            ...mail,
          });
        }
        continue;
      }

      // Already in grace — has it expired?
      const graceMs = GRACE_DAYS * 24 * 60 * 60 * 1000;
      const graceExpired =
        now.getTime() - new Date(rc.lowBalanceNotifiedAt).getTime() >= graceMs;

      if (graceExpired) {
        // Suspend the linked site (if any) and pause the charge.
        let siteName: string | null = null;
        if (rc.siteId) {
          const [site] = await db
            .select()
            .from(schema.sites)
            .where(eq(schema.sites.id, rc.siteId))
            .limit(1);
          siteName = site?.name ?? null;
          await db
            .update(schema.sites)
            .set({ status: "suspended" })
            .where(eq(schema.sites.id, rc.siteId));
        }
        await db
          .update(schema.recurringCharges)
          .set({ status: "paused" })
          .where(eq(schema.recurringCharges.id, rc.id));
        suspended++;
        if (customer.email) {
          const mail = suspensionEmail({
            name: customer.name,
            siteName,
            topupUrl: topupUrl(),
          });
          void sendEmail({
            to: customer.email,
            replyTo: getSupportEmail(),
            ...mail,
          });
        }
      }
      // else: still within grace — wait for a future run.
    }

    const summary = `charged=${charged} lowBalance=${lowBalance} suspended=${suspended} due=${due.length}`;
    console.info(`[billing:charge-recurring] ${summary}`);
    return { result: summary };
  },
});
