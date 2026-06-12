import { eq } from "drizzle-orm";
import {
  RECURRING_STATUSES,
  type RecurringPatchPayload,
} from "../../models/admin";

/**
 * PATCH /api/admin/recurring — pause, resume, or cancel a recurring charge.
 * Resuming (active) clears any low-balance grace flag so it gets a clean run.
 */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const body = await readBody<RecurringPatchPayload>(event);

  if (!body?.id || !body?.status || !RECURRING_STATUSES.includes(body.status)) {
    throw createError({
      statusCode: 422,
      statusMessage:
        "A valid `id` and `status` (active/paused/canceled) are required.",
    });
  }

  const db = useDb();
  const [row] = await db
    .update(schema.recurringCharges)
    .set({
      status: body.status,
      ...(body.status === "active" ? { lowBalanceNotifiedAt: null } : {}),
    })
    .where(eq(schema.recurringCharges.id, body.id))
    .returning();

  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: "Recurring charge not found.",
    });
  }

  await writeAudit(
    admin.email,
    "recurring.status",
    `${body.id} → ${body.status}`,
  );
  return { ok: true, recurringCharge: row };
});
