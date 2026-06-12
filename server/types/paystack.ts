/**
 * Paystack webhook payload shapes (technical / third-party transport).
 *
 * These mirror the JSON Paystack POSTs to `/api/webhooks/paystack`. They are
 * intentionally loose (most fields optional) because the exact set depends on
 * the `event` type and Paystack may add fields over time.
 */

export interface PaystackCustomer {
  email?: string;
  first_name?: string;
  last_name?: string;
  customer_code?: string;
}

export interface PaystackPlan {
  name?: string;
  plan_code?: string;
  amount?: number;
  interval?: string;
  currency?: string;
}

export interface PaystackData {
  reference?: string;
  amount?: number;
  currency?: string;
  status?: string;
  paid?: boolean;
  paid_at?: string;
  invoice_code?: string;
  subscription_code?: string;
  next_payment_date?: string;
  customer?: PaystackCustomer;
  plan?: PaystackPlan;
  metadata?: {
    purpose?: string;
    customerId?: string;
    usdCents?: number | string;
    fxRate?: number | string;
    planKey?: string | null;
    siteId?: string | null;
    label?: string;
    [key: string]: unknown;
  };
  subscription?: {
    subscription_code?: string;
    next_payment_date?: string;
  };
}

export interface PaystackEvent {
  event: string;
  data: PaystackData;
}
