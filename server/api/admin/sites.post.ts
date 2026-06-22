import { eq } from "drizzle-orm";
import {
  SITE_STATUSES,
  SITE_TYPES,
  SITE_ORIGINS,
  DB_HOSTING_OPTIONS,
  type SiteCreatePayload,
} from "../../models/admin";

/**
 * POST /api/admin/sites — create a site record.
 *
 * Builds are auto-provisioned as draft sites on payment (see fulfillment.ts);
 * this endpoint is for sites that exist outside that flow — chiefly "brought"
 * sites the customer already had, or manual entries.
 */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const body = await readBody<SiteCreatePayload>(event);

  const customerId = body?.customerId;
  const name = body?.name?.trim();
  const type = body?.type;
  const origin = body?.origin;

  if (!customerId || !name || name.length < 2) {
    throw createError({
      statusCode: 422,
      statusMessage: "`customerId` and a `name` are required.",
    });
  }
  if (!type || !SITE_TYPES.includes(type)) {
    throw createError({ statusCode: 422, statusMessage: "Invalid site type." });
  }
  if (!origin || !SITE_ORIGINS.includes(origin)) {
    throw createError({
      statusCode: 422,
      statusMessage: "Invalid site origin.",
    });
  }
  const status = body?.status ?? "draft";
  if (!SITE_STATUSES.includes(status)) {
    throw createError({ statusCode: 422, statusMessage: "Invalid status." });
  }
  const dbHostingValue = body?.dbHosting ?? "none";
  if (!DB_HOSTING_OPTIONS.includes(dbHostingValue)) {
    throw createError({
      statusCode: 422,
      statusMessage: "Invalid database hosting option.",
    });
  }

  const db = useDb();

  // Confirm the customer exists so an unknown id is a clean 404, not an FK error.
  const [customer] = await db
    .select({ id: schema.customers.id })
    .from(schema.customers)
    .where(eq(schema.customers.id, customerId))
    .limit(1);
  if (!customer) {
    throw createError({
      statusCode: 404,
      statusMessage: "Customer not found.",
    });
  }

  const [row] = await db
    .insert(schema.sites)
    .values({
      customerId,
      name,
      type,
      origin,
      status,
      dbHosting: dbHostingValue,
      repoUrl: body?.repoUrl?.trim() || null,
      deployUrl: body?.deployUrl?.trim() || null,
      vpsHost: body?.vpsHost?.trim() || null,
    })
    .returning();

  await writeAudit(admin.email, "site.create", `${row?.id} ${name}`);
  return { ok: true, site: row };
});
