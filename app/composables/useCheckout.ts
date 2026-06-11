import type { FetchOptions } from "ofetch";

interface CheckoutResponse {
  reference: string;
  authorizationUrl: string;
  accessCode: string;
  usdCents: number;
  zarCents: number;
  walletAppliedCents?: number;
  publicKey: string;
}

interface BuildCheckout {
  purpose: "build";
  planKey: string;
  email?: string;
  name?: string;
  siteId?: string;
  useWalletFirst?: boolean;
}

interface TopupCheckout {
  purpose: "topup";
  amountUsdCents: number;
}

/**
 * Client checkout helper. Calls /api/checkout/create and redirects the browser
 * to Paystack's hosted page (which redirects back to /checkout/success). Builds
 * may be bought signed-out (email supplied); top-ups require sign-in (the token
 * is attached so the server knows whose wallet to credit).
 */
export function useCheckout() {
  const { user, getToken } = useAuth();
  const loading = useState<boolean>("checkout-loading", () => false);
  const error = ref<string | null>(null);

  async function startCheckout(
    body: BuildCheckout | TopupCheckout,
  ): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const opts: FetchOptions = { method: "POST", body };
      // Attach the bearer token when signed in (required for top-ups).
      const token = user.value ? await getToken() : null;
      if (token) {
        opts.headers = { Authorization: `Bearer ${token}` };
      }
      const res = await $fetch<CheckoutResponse>("/api/checkout/create", opts as never);
      if (res?.authorizationUrl) {
        window.location.href = res.authorizationUrl;
      } else {
        throw new Error("No checkout URL returned.");
      }
    } catch (e) {
      const err = e as { data?: { statusMessage?: string }; statusMessage?: string };
      error.value =
        err?.data?.statusMessage || err?.statusMessage || "Could not start checkout.";
      loading.value = false;
    }
  }

  return { startCheckout, loading, error };
}
