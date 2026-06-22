import { eq } from "drizzle-orm";
import { MAX_RECURRING_MONTHLY_USD_CENTS } from "../../../shared/billing";
import {
  CHANGE_REQUEST_ADMIN_STATUSES,
  type ChangeRequestPatchPayload,
} from "../../models/admin";

/**
 * PATCH /api/admin/change-requests — quote, decline, or mark a request done.
 *
 * Quoting sets the amount the customer will approve + pay from their wallet
 * (the customer endpoint does the actual debit on approval).
 */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const body = await readBody<ChangeRequestPatchPayload>(event);

  if (!body?.id || !body?.status) {
    throw createError({
      statusCode: 422,
      statusMessage: "An `id` and `status` are required.",
    });
  }
  if (!CHANGE_REQUEST_ADMIN_STATUSES.includes(body.status)) {
    throw createError({ statusCode: 422, statusMessage: "Invalid status." });
  }

  const updates: Partial<typeof schema.changeRequests.$inferInsert> = {
    status: body.status,
  };

  if (body.status === "quoted") {
    const cents = Math.round(body.quotedUsdCents ?? 0);
    if (
      !Number.isFinite(cents) ||
      cents <= 0 ||
      cents > MAX_RECURRING_MONTHLY_USD_CENTS
    ) {
      throw createError({
        statusCode: 422,
        statusMessage: "A valid quote amount is required to quote a request.",
      });
    }
    updates.quotedCents = cents;
  }

  const db = useDb();
  const [row] = await db
    .update(schema.changeRequests)
    .set(updates)
    .where(eq(schema.changeRequests.id, body.id))
    .returning();

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Request not found." });
  }

  await writeAudit(
    admin.email,
    `change_request.${body.status}`,
    `${body.id}${updates.quotedCents ? ` ${updates.quotedCents}c` : ""}`,
  );
  return { ok: true, request: row };
});
