/** GET /api/admin/me — returns the signed-in admin's identity (auth probe). */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  return { email: admin.email, name: admin.name ?? null };
});
