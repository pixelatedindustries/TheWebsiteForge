import { desc } from "drizzle-orm";

/** GET /api/admin/leads — contact-form leads, newest first (paginated/capped). */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb();
  const { limit, offset } = getPagination(event);
  const rows = await db
    .select()
    .from(schema.leads)
    .orderBy(desc(schema.leads.createdAt))
    .limit(limit)
    .offset(offset);
  return { leads: rows, pagination: { limit, offset } };
});
