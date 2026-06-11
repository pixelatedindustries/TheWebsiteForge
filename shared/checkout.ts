export interface CheckoutResponse {
  reference: string;
  authorizationUrl: string;
  accessCode: string;
  usdCents: number;
  zarCents: number;
  walletAppliedCents?: number;
  publicKey: string;
}

export interface BuildCheckout {
  purpose: "build";
  planKey: string;
  email?: string;
  name?: string;
  siteId?: string;
  useWalletFirst?: boolean;
}

export interface TopupCheckout {
  purpose: "topup";
  amountUsdCents: number;
}

export interface CheckoutPayload {
  purpose?: "build" | "topup";
  planKey?: string;
  amountUsdCents?: number;
  email?: string;
  name?: string;
  siteId?: string;
  useWalletFirst?: boolean;
}
