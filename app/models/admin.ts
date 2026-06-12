/**
 * Admin dashboard view-models (business domain).
 *
 * Read-only shapes returned by the `/api/admin/*` endpoints and rendered in the
 * admin pages. They mirror the API responses, not the raw DB rows.
 */

/** Row in the admin billing → subscriptions table. */
export interface Subscription {
  id: string;
  customerName: string;
  plan: string;
  provider: string;
  status: string;
  amountCents: number;
  currency: string;
  interval: string;
  currentPeriodEnd: string | null;
}

/** Row in the admin billing → invoices table. */
export interface Invoice {
  id: string;
  number: number;
  customerName: string;
  type: string;
  amountCents: number;
  currency: string;
  status: string;
  provider: string | null;
  issuedAt: string;
  paidAt: string | null;
}

/** Row in the admin customers list. */
export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string | null;
  country: string | null;
  siteCount: number;
  mrrCents: number;
  walletBalanceCents: number;
  createdAt: string;
}

/** A customer's recurring charge, shown in the admin customer drawer. */
export interface Recurring {
  id: string;
  kind: string;
  label: string;
  amountCents: number;
  status: string;
  nextChargeAt: string;
}

/** A wallet ledger entry, shown in the admin customer drawer. */
export interface Txn {
  id: string;
  type: string;
  amountCents: number;
  balanceAfterCents: number;
  description: string;
  createdAt: string;
}

/** Row in the admin domains table. */
export interface Domain {
  id: string;
  customerName: string;
  fqdn: string;
  registrar: string;
  autoRenew: boolean;
  annualCostCents: number | null;
  expiresAt: string | null;
  daysToExpiry: number | null;
}

/** Aggregate stats for the admin overview dashboard. */
export interface Overview {
  mrrCents: number;
  revenueThisMonthCents: number;
  revenueYtdCents: number;
  activeSites: number;
  suspendedSites: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  newBuildsThisMonth: number;
  openInvoices: number;
  openInvoicesCents: number;
  failedInvoices: number;
  domainsExpiringSoon: number;
  newLeads: number;
  totalCustomers: number;
  revenueByMonth: { label: string; cents: number }[];
  salesByType: Record<string, number>;
}

/** Row in the admin leads inbox. */
export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  budget: string | null;
  message: string | null;
  status: "new" | "contacted" | "won" | "lost";
  source: string;
  createdAt: string;
}

/** Row in the admin sites table. */
export interface Site {
  id: string;
  customerName: string;
  name: string;
  type: string;
  origin: string;
  status: string;
  dbHosting: string;
  repoUrl: string | null;
  deployUrl: string | null;
  createdAt: string;
}
