import { eq } from "drizzle-orm";

const STATUSES = [
  "awaiting_payment",
  "brief_received",
  "design",
  "build",
  "review",
  "launch",
  "live",
  "paused",
  "canceled",
] as const;

interface Payload {
  id?: string;
  status?: (typeof STATUSES)[number];
  progress?: number;
  estimatedLaunchAt?: string | null;
  latestUpdate?: string;
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const body = await readBody<Payload>(event);
  if (!body?.id || !body.status || !STATUSES.includes(body.status)) {
    throw createError({
      statusCode: 422,
      statusMessage: "Project and valid status are required.",
    });
  }

  const progress = Math.max(0, Math.min(100, Math.round(body.progress ?? 0)));
  const [project] = await useDb()
    .update(schema.projects)
    .set({
      status: body.status,
      progress,
      estimatedLaunchAt: body.estimatedLaunchAt || null,
      latestUpdate: body.latestUpdate?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.id, body.id))
    .returning();
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: "Project not found." });
  }

  await useDb()
    .insert(schema.projectActivity)
    .values({
      projectId: project.id,
      type: "update",
      title: `Project moved to ${body.status.replaceAll("_", " ")}`,
      details: body.latestUpdate?.trim() || null,
    });
  await writeAudit(admin.email, "project.update", project.id);
  return { project };
});
