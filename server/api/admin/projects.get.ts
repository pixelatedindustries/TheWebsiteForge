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
  const invoiceIds = projects
    .map((project) => project.invoiceId)
    .filter((id): id is string => Boolean(id));
  const [customers, actions, invoices] = await Promise.all([
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
    invoiceIds.length
      ? db
          .select({
            id: schema.invoices.id,
            status: schema.invoices.status,
            amountCents: schema.invoices.amountCents,
            currency: schema.invoices.currency,
            provider: schema.invoices.provider,
          })
          .from(schema.invoices)
          .where(inArray(schema.invoices.id, invoiceIds))
      : [],
  ]);
  const customerById = new Map(
    customers.map((customer) => [customer.id, customer]),
  );
  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));

  return {
    projects: projects.map((project) => {
      const invoice = project.invoiceId
        ? (invoiceById.get(project.invoiceId) ?? null)
        : null;
      const customer = customerById.get(project.customerId);
      return {
        ...project,
        customerName: customer?.name ?? "—",
        customerEmail: customer?.email ?? "—",
        customerCompany: customer?.company ?? null,
        paymentStatus: invoice?.status ?? null,
        paymentAmountCents: invoice?.amountCents ?? null,
        paymentCurrency: invoice?.currency ?? null,
        paymentProvider: invoice?.provider ?? null,
        actions: actions.filter((action) => action.projectId === project.id),
      };
    }),
  };
});
