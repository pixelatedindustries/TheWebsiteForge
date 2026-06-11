/**
 * GET /api/admin/overview — headline KPIs for the admin dashboard.
 * Values are computed in JS from the catalogue (volumes are small).
 * All money values are returned in integer cents (USD unless noted).
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb();

  const [subs, invs, siteRows, leadRows, domainRows, customerRows] =
    await Promise.all([
      db.select().from(schema.subscriptions),
      db.select().from(schema.invoices),
      db.select().from(schema.sites),
      db.select().from(schema.leads),
      db.select().from(schema.domains),
      db.select().from(schema.customers),
    ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const monthlyCents = (amount: number, interval: string) =>
    interval === "year" ? Math.round(amount / 12) : amount;

  // MRR from active subscriptions.
  const mrrCents = subs
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + monthlyCents(s.amountCents, s.interval), 0);

  const paid = invs.filter((i) => i.status === "paid" && i.paidAt);
  const revenueThisMonthCents = paid
    .filter((i) => new Date(i.paidAt!) >= startOfMonth)
    .reduce((sum, i) => sum + i.amountCents, 0);
  const revenueYtdCents = paid
    .filter((i) => new Date(i.paidAt!) >= startOfYear)
    .reduce((sum, i) => sum + i.amountCents, 0);

  // Revenue over the last 6 months.
  const months: { label: string; cents: number; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en", { month: "short" }),
      cents: 0,
    });
  }
  for (const i of paid) {
    const d = new Date(i.paidAt!);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.cents += i.amountCents;
  }

  // Sales split by service type (paid invoices, all time).
  const salesByType: Record<string, number> = {};
  for (const i of paid) {
    salesByType[i.type] = (salesByType[i.type] ?? 0) + i.amountCents;
  }

  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const domainsExpiringSoon = domainRows.filter(
    (d) => d.expiresAt && new Date(d.expiresAt) <= in30Days,
  ).length;

  return {
    mrrCents,
    revenueThisMonthCents,
    revenueYtdCents,
    activeSites: siteRows.filter((s) => s.status === "live").length,
    suspendedSites: siteRows.filter((s) => s.status === "suspended").length,
    activeSubscriptions: subs.filter((s) => s.status === "active").length,
    canceledSubscriptions: subs.filter((s) => s.status === "canceled").length,
    newBuildsThisMonth: invs.filter(
      (i) => i.type === "build" && new Date(i.issuedAt) >= startOfMonth,
    ).length,
    openInvoices: invs.filter((i) => i.status === "open").length,
    openInvoicesCents: invs
      .filter((i) => i.status === "open")
      .reduce((sum, i) => sum + i.amountCents, 0),
    failedInvoices: invs.filter((i) => i.status === "failed").length,
    domainsExpiringSoon,
    newLeads: leadRows.filter((l) => l.status === "new").length,
    totalCustomers: customerRows.length,
    revenueByMonth: months.map(({ label, cents }) => ({ label, cents })),
    salesByType,
  };
});
