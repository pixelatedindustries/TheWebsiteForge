/**
 * Database schema (Drizzle ORM) — see plan §5 "Proposed Data Model".
 * One PostgreSQL database powers leads, customers, sites, domains,
 * subscriptions, invoices, and admin auditing.
 */
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* ----------------------------- enums ----------------------------- */

export const leadStatus = pgEnum("lead_status", [
  "new",
  "contacted",
  "won",
  "lost",
]);

export const siteType = pgEnum("site_type", ["static", "dynamic", "app"]);
export const siteOrigin = pgEnum("site_origin", ["built", "brought"]);
export const siteStatus = pgEnum("site_status", [
  "draft",
  "live",
  "suspended",
  "offboarded",
]);

export const dbHosting = pgEnum("db_hosting", [
  "none",
  "self_hosted",
  "managed",
]);

export const subscriptionStatus = pgEnum("subscription_status", [
  "active",
  "past_due",
  "canceled",
]);
export const billingInterval = pgEnum("billing_interval", ["month", "year"]);

export const invoiceType = pgEnum("invoice_type", [
  "build",
  "hosting",
  "domain",
  "care",
  "feature",
]);
export const invoiceStatus = pgEnum("invoice_status", [
  "open",
  "paid",
  "failed",
  "refunded",
]);

export const adminRole = pgEnum("admin_role", ["owner", "admin", "support"]);

/** Wallet ledger entry kinds (WebForgePlan2 §4.2). Signed amount decides credit/debit. */
export const walletTxnType = pgEnum("wallet_txn_type", [
  "topup",
  "hosting",
  "database",
  "feature",
  "change",
  "refund",
  "adjustment",
]);

/** What a recurring monthly charge is for. */
export const recurringKind = pgEnum("recurring_kind", ["hosting", "database"]);
export const recurringStatus = pgEnum("recurring_status", [
  "active",
  "paused",
  "canceled",
]);

export const changeRequestStatus = pgEnum("change_request_status", [
  "open",
  "quoted",
  "approved",
  "done",
  "declined",
]);

/* ----------------------------- tables ---------------------------- */

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  firebaseUid: text("firebase_uid").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  company: text("company"),
  country: text("country"),
  notes: text("notes"),
  /** Paystack customer code (CUS_...), set on first checkout (plan §5.2). */
  paystackCustomerCode: text("paystack_customer_code"),
  /** Cached prepaid wallet balance in USD cents. The ledger is the source of
   * truth; this is a fast read kept in sync by server/utils/wallet.ts. */
  walletBalanceCents: integer("wallet_balance_cents").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  budget: text("budget"),
  message: text("message").notNull(),
  status: leadStatus("status").default("new").notNull(),
  source: text("source").default("contact_form").notNull(),
  customerId: uuid("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sites = pgTable("sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: siteType("type").notNull(),
  origin: siteOrigin("origin").notNull(),
  status: siteStatus("status").default("draft").notNull(),
  /** Which database option the customer chose for this site (plan §3.2.1). */
  dbHosting: dbHosting("db_hosting").default("none").notNull(),
  repoUrl: text("repo_url"),
  deployUrl: text("deploy_url"),
  /** Which VPS this site lives on, for capacity tracking. */
  vpsHost: text("vps_host"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const domains = pgTable("domains", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),
  fqdn: text("fqdn").notNull().unique(),
  registrar: text("registrar").default("cloudflare").notNull(),
  registeredAt: date("registered_at"),
  expiresAt: date("expires_at"),
  autoRenew: boolean("auto_renew").default(true).notNull(),
  /** Annual registrar cost in cents (USD), excluding our management fee. */
  annualCostCents: integer("annual_cost_cents"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),
  /** e.g. "hosting_dynamic", "care_basic", "db_medium". */
  plan: text("plan").notNull(),
  provider: text("provider").default("paystack").notNull(),
  providerSubId: text("provider_sub_id"),
  status: subscriptionStatus("status").default("active").notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").default("USD").notNull(),
  interval: billingInterval("interval").default("month").notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Human-friendly sequential invoice number. */
  number: serial("number").notNull(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),
  type: invoiceType("type").notNull(),
  amountCents: integer("amount_cents").notNull(),
  /** VAT in cents — 0 while not VAT-registered (plan §10.1). */
  vatCents: integer("vat_cents").default(0).notNull(),
  currency: text("currency").default("USD").notNull(),
  status: invoiceStatus("status").default("open").notNull(),
  provider: text("provider"),
  providerInvoiceId: text("provider_invoice_id"),
  issuedAt: timestamp("issued_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Admin roster. Authorization currently uses the ADMIN_EMAILS env allowlist
 * (plan §6); this table is kept so we can move to DB-managed admins later
 * without a schema change.
 */
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  firebaseUid: text("firebase_uid"),
  role: adminRole("role").default("admin").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminEmail: text("admin_email").notNull(),
  action: text("action").notNull(),
  target: text("target"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Wallet ledger (append-only) — the source of truth for every prepaid balance
 * movement. All amounts are signed USD cents: positive = credit, negative =
 * debit. `balance_after_cents` snapshots the balance immediately after the row.
 */
export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    type: walletTxnType("type").notNull(),
    /** Signed USD cents: + credit, - debit. */
    amountCents: integer("amount_cents").notNull(),
    /** USD-cents balance immediately after this entry. */
    balanceAfterCents: integer("balance_after_cents").notNull(),
    currency: text("currency").default("USD").notNull(),
    /** For top-ups: the actual ZAR amount Paystack charged (audit trail). */
    chargedZarCents: integer("charged_zar_cents"),
    /** For top-ups: the USD→ZAR rate used. */
    fxRate: text("fx_rate"),
    description: text("description").notNull(),
    /** Paystack reference for top-ups; null for internal debits. */
    reference: text("reference"),
    siteId: uuid("site_id").references(() => sites.id, {
      onDelete: "set null",
    }),
    /** Admin email, or "system" for the scheduled job. */
    createdBy: text("created_by").default("system").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    // One ledger row per Paystack reference (top-ups) — hard guard against
    // double-crediting when the webhook and the verify step race. Internal
    // debits have a null reference and are exempt (partial index).
    uniqueIndex("wallet_txn_reference_uq")
      .on(t.reference)
      .where(sql`${t.reference} is not null`),
  ],
);

/**
 * Recurring monthly charges debited from the wallet (hosting / database).
 * The scheduled task (server/tasks/billing/charge-recurring.ts) reads these.
 */
export const recurringCharges = pgTable("recurring_charges", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),
  kind: recurringKind("kind").notNull(),
  /** Catalogue key from shared/billing.ts (e.g. "hosting_dynamic"), optional. */
  planKey: text("plan_key"),
  label: text("label").notNull(),
  /** Monthly amount in USD cents. */
  amountCents: integer("amount_cents").notNull(),
  interval: billingInterval("interval").default("month").notNull(),
  status: recurringStatus("status").default("active").notNull(),
  /** When the low-balance grace window started (null = not in grace). */
  lowBalanceNotifiedAt: timestamp("low_balance_notified_at", {
    withTimezone: true,
  }),
  nextChargeAt: timestamp("next_charge_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Customer-submitted change requests (portal) — admin quotes + debits the wallet. */
export const changeRequests = pgTable("change_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  details: text("details").notNull(),
  status: changeRequestStatus("status").default("open").notNull(),
  /** Optional quoted amount in USD cents once an admin scopes it. */
  quotedCents: integer("quoted_cents"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* --------------------------- inferred types ---------------------- */

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type Domain = typeof domains.$inferSelect;
export type NewDomain = typeof domains.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type NewWalletTransaction = typeof walletTransactions.$inferInsert;
export type RecurringCharge = typeof recurringCharges.$inferSelect;
export type NewRecurringCharge = typeof recurringCharges.$inferInsert;
export type ChangeRequest = typeof changeRequests.$inferSelect;
export type NewChangeRequest = typeof changeRequests.$inferInsert;
