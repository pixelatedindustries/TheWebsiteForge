CREATE TYPE "public"."admin_role" AS ENUM('owner', 'admin', 'support');--> statement-breakpoint
CREATE TYPE "public"."billing_interval" AS ENUM('month', 'year');--> statement-breakpoint
CREATE TYPE "public"."db_hosting" AS ENUM('none', 'self_hosted', 'managed');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('open', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."invoice_type" AS ENUM('build', 'hosting', 'domain', 'care', 'feature');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."site_origin" AS ENUM('built', 'brought');--> statement-breakpoint
CREATE TYPE "public"."site_status" AS ENUM('draft', 'live', 'suspended', 'offboarded');--> statement-breakpoint
CREATE TYPE "public"."site_type" AS ENUM('static', 'dynamic', 'app');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'canceled');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"firebase_uid" text,
	"role" "admin_role" DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_email" text NOT NULL,
	"action" text NOT NULL,
	"target" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firebase_uid" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"country" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"site_id" uuid,
	"fqdn" text NOT NULL,
	"registrar" text DEFAULT 'cloudflare' NOT NULL,
	"registered_at" date,
	"expires_at" date,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"annual_cost_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "domains_fqdn_unique" UNIQUE("fqdn")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" serial NOT NULL,
	"customer_id" uuid NOT NULL,
	"site_id" uuid,
	"type" "invoice_type" NOT NULL,
	"amount_cents" integer NOT NULL,
	"vat_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "invoice_status" DEFAULT 'open' NOT NULL,
	"provider" text,
	"provider_invoice_id" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"budget" text,
	"message" text NOT NULL,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"source" text DEFAULT 'contact_form' NOT NULL,
	"customer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "site_type" NOT NULL,
	"origin" "site_origin" NOT NULL,
	"status" "site_status" DEFAULT 'draft' NOT NULL,
	"db_hosting" "db_hosting" DEFAULT 'none' NOT NULL,
	"repo_url" text,
	"deploy_url" text,
	"vps_host" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"site_id" uuid,
	"plan" text NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"provider_sub_id" text,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"interval" "billing_interval" DEFAULT 'month' NOT NULL,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;