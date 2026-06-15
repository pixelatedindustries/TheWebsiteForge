import { and, eq } from "drizzle-orm";

interface Payload {
  projectId?: string;
  name?: string;
  url?: string;
}

export default defineEventHandler(async (event) => {
  const identity = await requireCustomer(event);
  const customer = await resolveCustomer(identity);
  const body = await readBody<Payload>(event);
  const name = body?.name?.trim() ?? "";
  const url = body?.url?.trim() ?? "";
  if (
    !customer ||
    !body?.projectId ||
    name.length < 2 ||
    !/^https?:\/\//.test(url)
  ) {
    throw createError({
      statusCode: 422,
      statusMessage: "Project, file name, and a valid link are required.",
    });
  }
  const db = useDb();
  const [project] = await db
    .select({ id: schema.projects.id })
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
  const [file] = await db
    .insert(schema.projectFiles)
    .values({ projectId: project.id, kind: "customer_upload", name, url })
    .returning();
  await db.insert(schema.projectActivity).values({
    projectId: project.id,
    type: "file",
    title: `Customer added file: ${name}`,
  });
  return { file };
});
