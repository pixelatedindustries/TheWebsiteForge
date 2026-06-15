import { and, eq } from "drizzle-orm";

interface Payload {
  projectId?: string;
  customerNotes?: string;
  actionId?: string;
}

export default defineEventHandler(async (event) => {
  const identity = await requireCustomer(event);
  const customer = await resolveCustomer(identity);
  const body = await readBody<Payload>(event);
  if (!customer || !body?.projectId) {
    throw createError({ statusCode: 422, statusMessage: "Project required." });
  }

  const db = useDb();
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(
      and(
        eq(schema.projects.id, body.projectId),
        eq(schema.projects.customerId, customer.id),
      ),
    )
    .limit(1);
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: "Project not found." });
  }

  if (typeof body.customerNotes === "string") {
    await db
      .update(schema.projects)
      .set({ customerNotes: body.customerNotes.trim(), updatedAt: new Date() })
      .where(eq(schema.projects.id, project.id));
  }

  if (body.actionId) {
    const [action] = await db
      .update(schema.projectActions)
      .set({ status: "completed", completedAt: new Date() })
      .where(
        and(
          eq(schema.projectActions.id, body.actionId),
          eq(schema.projectActions.projectId, project.id),
        ),
      )
      .returning();
    if (action) {
      await db.insert(schema.projectActivity).values({
        projectId: project.id,
        type: "action",
        title: `Completed: ${action.title}`,
      });
    }
  }

  return { ok: true };
});
