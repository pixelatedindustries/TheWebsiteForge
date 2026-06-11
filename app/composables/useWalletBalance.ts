import type { AuthUser } from "~/types/auth";
import type { WalletSnapshot } from "~/types/wallet";

/**
 * Shared wallet balance state for signed-in customers.
 *
 * Keeps a lightweight, globally-available balance so surfaces like the header
 * can always show current funds without duplicating fetch logic.
 */
export function useWalletBalance() {
  const { ready, user, authFetch } = useAuth();
  const balanceCents = useState<number | null>(
    "wallet-balance-cents",
    () => null,
  );
  const loading = useState<boolean>("wallet-balance-loading", () => false);

  async function refresh(force = false): Promise<void> {
    if (!ready.value || !user.value) {
      balanceCents.value = null;
      return;
    }
    if (loading.value && !force) return;

    loading.value = true;
    try {
      const res = await authFetch<WalletSnapshot>("/api/account/wallet");
      balanceCents.value = Number(res.balanceCents ?? 0);
    } catch {
      // Keep the existing value on transient failures to avoid visual flicker.
    } finally {
      loading.value = false;
    }
  }

  if (import.meta.client) {
    watch(
      [ready, () => (user.value as AuthUser | null)?.uid],
      () => {
        void refresh(true);
      },
      { immediate: true },
    );
  }

  return { balanceCents, loading, refresh };
}
