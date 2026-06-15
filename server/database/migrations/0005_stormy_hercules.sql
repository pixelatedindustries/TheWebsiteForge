CREATE TYPE "public"."project_action_status" AS ENUM('open', 'completed');--> statement-breakpoint
CREATE TYPE "public"."project_file_kind" AS ENUM('customer_upload', 'deliverable');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('awaiting_payment', 'brief_received', 'design', 'build', 'review', 'launch', 'live', 'paused', 'canceled');--> statement-breakpoint
CREATE TABLE "checkout_briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"plan_key" text NOT NULL,
	"answers" jsonb NOT NULL,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"details" text,
	"status" "project_action_status" DEFAULT 'open' NOT NULL,
	"due_at" date,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"kind" "project_file_kind" NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"invoice_id" uuid,
	"site_id" uuid,
	"brief_id" uuid,
	"name" text NOT NULL,
	"plan_key" text NOT NULL,
	"status" "project_status" DEFAULT 'awaiting_payment' NOT NULL,
	"progress" integer DEFAULT 5 NOT NULL,
	"estimated_launch_at" date,
	"brief" jsonb NOT NULL,
	"customer_notes" text,
	"latest_update" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_actions" ADD CONSTRAINT "project_actions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activity" ADD CONSTRAINT "project_activity_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_brief_id_checkout_briefs_id_fk" FOREIGN KEY ("brief_id") REFERENCES "public"."checkout_briefs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkout_briefs_email_idx" ON "checkout_briefs" USING btree ("email");--> statement-breakpoint
CREATE INDEX "project_actions_project_id_idx" ON "project_actions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_activity_project_id_idx" ON "project_activity" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_files_project_id_idx" ON "project_files" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "projects_customer_id_idx" ON "projects" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_invoice_id_uq" ON "projects" USING btree ("invoice_id") WHERE "projects"."invoice_id" is not null;