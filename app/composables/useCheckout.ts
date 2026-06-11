import type { FetchOptions } from "ofetch";
import { storeToRefs } from "pinia";
import { useCheckoutStore } from "~/stores/checkout";
import type {
  BuildCheckout,
  CheckoutResponse,
  TopupCheckout,
} from "~~/shared/checkout";

/**
 * Client checkout helper. Calls /api/checkout/create and redirects the browser
 * to Paystack's hosted page (which redirects back to /checkout/success). Builds
 * may be bought signed-out (email supplied); top-ups require sign-in (the token
 * is attached so the server knows whose wallet to credit).
 */
export function useCheckout() {
  const { user, getToken } = useAuth();
  const checkoutStore = useCheckoutStore();
  const { loading, error } = storeToRefs(checkoutStore);

  async function startCheckout(
    body: BuildCheckout | TopupCheckout,
  ): Promise<void> {
    checkoutStore.setLoading(true);
    checkoutStore.setError(null);
    try {
      const opts: FetchOptions = { method: "POST", body };
      // Attach the bearer token when signed in (required for top-ups).
      const token = user.value ? await getToken() : null;
      if (token) {
        opts.headers = { Authorization: `Bearer ${token}` };
      }
      const res = await $fetch<CheckoutResponse>(
        "/api/checkout/create",
        opts as never,
      );
      if (res?.authorizationUrl) {
        window.location.href = res.authorizationUrl;
      } else {
        throw new Error("No checkout URL returned.");
      }
    } catch (e) {
      const err = e as {
        data?: { statusMessage?: string };
        statusMessage?: string;
      };
      checkoutStore.setError(
        err?.data?.statusMessage ||
          err?.statusMessage ||
          "Could not start checkout.",
      );
      checkoutStore.setLoading(false);
    }
  }

  return { startCheckout, loading, error };
}
