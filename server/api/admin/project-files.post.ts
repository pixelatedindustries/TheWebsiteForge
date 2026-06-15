interface Payload {
  projectId?: string;
  name?: string;
  url?: string;
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const body = await readBody<Payload>(event);
  const name = body?.name?.trim() ?? "";
  const url = body?.url?.trim() ?? "";
  if (!body?.projectId || name.length < 2 || !/^https?:\/\//.test(url)) {
    throw createError({
      statusCode: 422,
      statusMessage:
        "Project, deliverable name, and a valid link are required.",
    });
  }
  const [file] = await useDb()
    .insert(schema.projectFiles)
    .values({
      projectId: body.projectId,
      kind: "deliverable",
      name,
      url,
    })
    .returning();
  await useDb()
    .insert(schema.projectActivity)
    .values({
      projectId: body.projectId,
      type: "file",
      title: `Studio added deliverable: ${name}`,
    });
  await writeAudit(admin.email, "project.file.create", body.projectId);
  return { file };
});
