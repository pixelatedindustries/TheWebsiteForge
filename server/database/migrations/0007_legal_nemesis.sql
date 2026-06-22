ALTER TYPE "public"."change_request_status" ADD VALUE 'canceled';--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'payment_received' BEFORE 'brief_received';