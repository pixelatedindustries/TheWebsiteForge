CREATE TYPE "public"."site_billing_status" AS ENUM('current', 'grace', 'suspended');--> statement-breakpoint
ALTER TYPE "public"."invoice_type" ADD VALUE 'database' BEFORE 'domain';--> statement-breakpoint
ALTER TYPE "public"."recurring_kind" ADD VALUE 'domain';--> statement-breakpoint
ALTER TYPE "public"."wallet_txn_type" ADD VALUE 'build' BEFORE 'hosting';--> statement-breakpoint
ALTER TYPE "public"."wallet_txn_type" ADD VALUE 'domain' BEFORE 'feature';--> statement-breakpoint
ALTER TABLE "change_requests" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "change_requests" ADD COLUMN "approved_by" text;--> statement-breakpoint
ALTER TABLE "change_requests" ADD COLUMN "invoice_id" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "recurring_charge_id" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "domain_id" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "change_request_id" uuid;--> statement-breakpoint
ALTER TABLE "recurring_charges" ADD COLUMN "domain_id" uuid;--> statement-breakpoint
ALTER TABLE "recurring_charges" ADD COLUMN "last_charged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recurring_charges" ADD COLUMN "failure_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "billing_status" "site_billing_status" DEFAULT 'current' NOT NULL;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_recurring_charge_id_recurring_charges_id_fk" FOREIGN KEY ("recurring_charge_id") REFERENCES "public"."recurring_charges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_change_request_id_change_requests_id_fk" FOREIGN KEY ("change_request_id") REFERENCES "public"."change_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_charges" ADD CONSTRAINT "recurring_charges_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoices_recurring_charge_id_idx" ON "invoices" USING btree ("recurring_charge_id");