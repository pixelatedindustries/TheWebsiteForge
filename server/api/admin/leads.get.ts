import { desc } from "drizzle-orm";

/** GET /api/admin/leads — all contact-form leads, newest first. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb();
  const rows = await db
    .select()
    .from(schema.leads)
    .orderBy(desc(schema.leads.createdAt));
  return { leads: rows };
});
