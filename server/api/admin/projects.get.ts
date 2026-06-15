import { desc, inArray } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb();
  const projects = await db
    .select()
    .from(schema.projects)
    .orderBy(desc(schema.projects.updatedAt));
  const customerIds = [
    ...new Set(projects.map((project) => project.customerId)),
  ];
  const projectIds = projects.map((project) => project.id);
  const [customers, actions] = await Promise.all([
    customerIds.length
      ? db
          .select()
          .from(schema.customers)
          .where(inArray(schema.customers.id, customerIds))
      : [],
    projectIds.length
      ? db
          .select()
          .from(schema.projectActions)
          .where(inArray(schema.projectActions.projectId, projectIds))
      : [],
  ]);
  const customerById = new Map(
    customers.map((customer) => [customer.id, customer]),
  );

  return {
    projects: projects.map((project) => ({
      ...project,
      customerName: customerById.get(project.customerId)?.name ?? "—",
      customerEmail: customerById.get(project.customerId)?.email ?? "—",
      actions: actions.filter((action) => action.projectId === project.id),
    })),
  };
});
