CREATE INDEX "change_requests_customer_id_idx" ON "change_requests" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "domains_customer_id_idx" ON "domains" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "domains_site_id_idx" ON "domains" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "invoices_customer_id_idx" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invoices_provider_invoice_id_idx" ON "invoices" USING btree ("provider_invoice_id");--> statement-breakpoint
CREATE INDEX "leads_customer_id_idx" ON "leads" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "recurring_charges_customer_id_idx" ON "recurring_charges" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "recurring_charges_next_charge_at_idx" ON "recurring_charges" USING btree ("next_charge_at");--> statement-breakpoint
CREATE UNIQUE INDEX "recurring_charges_active_uq" ON "recurring_charges" USING btree ("customer_id","site_id","kind") WHERE "recurring_charges"."status" = 'active';--> statement-breakpoint
CREATE INDEX "sites_customer_id_idx" ON "sites" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "subscriptions_customer_id_idx" ON "subscriptions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "subscriptions_provider_sub_id_idx" ON "subscriptions" USING btree ("provider_sub_id");--> statement-breakpoint
CREATE INDEX "wallet_txn_customer_id_idx" ON "wallet_transactions" USING btree ("customer_id");