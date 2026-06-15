interface Payload {
  projectId?: string;
  title?: string;
  details?: string;
  dueAt?: string | null;
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const body = await readBody<Payload>(event);
  const title = body?.title?.trim() ?? "";
  if (!body?.projectId || title.length < 3) {
    throw createError({
      statusCode: 422,
      statusMessage: "Project and action title are required.",
    });
  }
  const [action] = await useDb()
    .insert(schema.projectActions)
    .values({
      projectId: body.projectId,
      title,
      details: body.details?.trim() || null,
      dueAt: body.dueAt || null,
    })
    .returning();
  await writeAudit(admin.email, "project.action.create", body.projectId);
  return { action };
});
