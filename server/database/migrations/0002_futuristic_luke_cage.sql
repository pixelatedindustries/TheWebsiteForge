CREATE TYPE "public"."change_request_status" AS ENUM('open', 'quoted', 'approved', 'done', 'declined');--> statement-breakpoint
CREATE TYPE "public"."recurring_kind" AS ENUM('hosting', 'database');--> statement-breakpoint
CREATE TYPE "public"."recurring_status" AS ENUM('active', 'paused', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."wallet_txn_type" AS ENUM('topup', 'hosting', 'database', 'feature', 'change', 'refund', 'adjustment');--> statement-breakpoint
CREATE TABLE "change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"site_id" uuid,
	"title" text NOT NULL,
	"details" text NOT NULL,
	"status" "change_request_status" DEFAULT 'open' NOT NULL,
	"quoted_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"site_id" uuid,
	"kind" "recurring_kind" NOT NULL,
	"plan_key" text,
	"label" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"interval" "billing_interval" DEFAULT 'month' NOT NULL,
	"status" "recurring_status" DEFAULT 'active' NOT NULL,
	"low_balance_notified_at" timestamp with time zone,
	"next_charge_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"type" "wallet_txn_type" NOT NULL,
	"amount_cents" integer NOT NULL,
	"balance_after_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"charged_zar_cents" integer,
	"fx_rate" text,
	"description" text NOT NULL,
	"reference" text,
	"site_id" uuid,
	"created_by" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "wallet_balance_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_charges" ADD CONSTRAINT "recurring_charges_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_charges" ADD CONSTRAINT "recurring_charges_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;