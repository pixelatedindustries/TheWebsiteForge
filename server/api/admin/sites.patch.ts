import { eq } from "drizzle-orm";
import {
  SITE_STATUSES,
  SITE_TYPES,
  DB_HOSTING_OPTIONS,
  SITE_BILLING_STATUSES,
  type SitePatchPayload,
} from "../../models/admin";

/**
 * PATCH /api/admin/sites — update a site's status and/or details.
 *
 * Status changes (draft / live / suspended / offboarded) are the common case;
 * suspension is also applied automatically by the recurring-billing task when a
 * wallet runs dry. Other editable fields (name, type, URLs, db hosting, billing
 * status) are applied when present.
 */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const body = await readBody<SitePatchPayload>(event);

  if (!body?.id) {
    throw createError({
      statusCode: 422,
      statusMessage: "An `id` is required.",
    });
  }

  const updates: Partial<typeof schema.sites.$inferInsert> = {};

  if (body.status !== undefined) {
    if (!SITE_STATUSES.includes(body.status)) {
      throw createError({ statusCode: 422, statusMessage: "Invalid status." });
    }
    updates.status = body.status;
  }
  if (body.billingStatus !== undefined) {
    if (!SITE_BILLING_STATUSES.includes(body.billingStatus)) {
      throw createError({
        statusCode: 422,
        statusMessage: "Invalid billing status.",
      });
    }
    updates.billingStatus = body.billingStatus;
  }
  if (body.type !== undefined) {
    if (!SITE_TYPES.includes(body.type)) {
      throw createError({ statusCode: 422, statusMessage: "Invalid type." });
    }
    updates.type = body.type;
  }
  if (body.dbHosting !== undefined) {
    if (!DB_HOSTING_OPTIONS.includes(body.dbHosting)) {
      throw createError({
        statusCode: 422,
        statusMessage: "Invalid database hosting option.",
      });
    }
    updates.dbHosting = body.dbHosting;
  }
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (name.length < 2) {
      throw createError({ statusCode: 422, statusMessage: "Name too short." });
    }
    updates.name = name;
  }
  if (body.repoUrl !== undefined)
    updates.repoUrl = body.repoUrl?.trim() || null;
  if (body.deployUrl !== undefined)
    updates.deployUrl = body.deployUrl?.trim() || null;
  if (body.vpsHost !== undefined)
    updates.vpsHost = body.vpsHost?.trim() || null;

  if (Object.keys(updates).length === 0) {
    throw createError({
      statusCode: 422,
      statusMessage: "No valid fields to update.",
    });
  }

  const db = useDb();
  const [row] = await db
    .update(schema.sites)
    .set(updates)
    .where(eq(schema.sites.id, body.id))
    .returning();

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Site not found." });
  }

  await writeAudit(
    admin.email,
    "site.update",
    `${body.id} ${Object.keys(updates).join(",")}`,
  );
  return { ok: true, site: row };
});
