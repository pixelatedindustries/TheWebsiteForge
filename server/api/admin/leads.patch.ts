import { eq } from "drizzle-orm";

const STATUSES = ["new", "contacted", "won", "lost"] as const;
type LeadStatus = (typeof STATUSES)[number];

/** PATCH /api/admin/leads — update a lead's pipeline status. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody<{ id?: string; status?: LeadStatus }>(event);

  if (!body?.id || !body?.status || !STATUSES.includes(body.status)) {
    throw createError({
      statusCode: 422,
      statusMessage: "A valid `id` and `status` are required.",
    });
  }

  const db = useDb();
  const [row] = await db
    .update(schema.leads)
    .set({ status: body.status })
    .where(eq(schema.leads.id, body.id))
    .returning();

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Lead not found." });
  }
  return { lead: row };
});
