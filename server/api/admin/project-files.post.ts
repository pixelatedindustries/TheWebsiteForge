import { isValidHttpUrl } from "~~/shared/validation";

interface Payload {
  projectId?: string;
  name?: string;
  url?: string;
}

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event);
    const body = await readBody<Payload>(event);
    const name = body?.name?.trim() ?? "";
    const url = body?.url?.trim() ?? "";
    if (!body?.projectId || name.length < 2 || !isValidHttpUrl(url)) {
      throw createError({
        statusCode: 422,
        statusMessage:
          "Project, deliverable name, and a valid link are required.",
      });
    }
    const projectId = body.projectId;

    // File row and its activity entry must land together — wrap both writes in a
    // single transaction so a failure can't leave a deliverable with no audit
    // trail (or vice versa).
    const file = await useDb().transaction(async (tx) => {
      const [inserted] = await tx
        .insert(schema.projectFiles)
        .values({ projectId, kind: "deliverable", name, url })
        .returning();
      await tx.insert(schema.projectActivity).values({
        projectId,
        type: "file",
        title: `Studio added deliverable: ${name}`,
      });
      return inserted;
    });

    await writeAudit(admin.email, "project.file.create", projectId);
    return { file };
  } catch (err) {
    toSafeError(err, "admin/project-files", "Could not save deliverable.");
  }
});
