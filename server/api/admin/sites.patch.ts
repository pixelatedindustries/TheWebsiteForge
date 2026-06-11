import { eq } from "drizzle-orm";

const STATUSES = ["draft", "live", "suspended", "offboarded"] as const;
type SiteStatus = (typeof STATUSES)[number];

interface PatchPayload {
  id?: string;
  status?: SiteStatus;
}

/**
 * PATCH /api/admin/sites — change a site's lifecycle status
 * (draft / live / suspended / offboarded). Suspension is also applied
 * automatically by the recurring-billing task when a wallet runs dry.
 */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const body = await readBody<PatchPayload>(event);

  if (!body?.id || !body?.status || !STATUSES.includes(body.status)) {
    throw createError({
      statusCode: 422,
      statusMessage: "A valid `id` and `status` are required.",
    });
  }

  const db = useDb();
  const [row] = await db
    .update(schema.sites)
    .set({ status: body.status })
    .where(eq(schema.sites.id, body.id))
    .returning();

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Site not found." });
  }

  await writeAudit(admin.email, "site.status", `${body.id} → ${body.status}`);
  return { ok: true, site: row };
});
