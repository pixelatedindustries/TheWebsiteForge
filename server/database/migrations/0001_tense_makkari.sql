ALTER TABLE "subscriptions" ALTER COLUMN "provider" SET DEFAULT 'paystack';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "paystack_customer_code" text;