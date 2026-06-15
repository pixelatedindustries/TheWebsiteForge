<script setup lang="ts">
import { buildPackages, formatUsdCents, estimateZar } from "~~/shared/billing";

/**
 * Build checkout intake (WebForgePlan2 §4.6). Collects name/email (prefilled if
 * signed in), shows the USD price + the ZAR amount that will actually be
 * charged, then starts Paystack checkout.
 */
const route = useRoute();
const { user, authFetch } = useAuth();
const { startCheckout, loading, error } = useCheckout();
const { balanceCents, refresh: refreshWallet } = useWalletBalance();

const planKey = computed(() => String(route.query.plan ?? ""));
const pkg = computed(() => buildPackages[planKey.value]);

const config = useRuntimeConfig();
const rate = Number(config.public.usdToZar) || 17;

const name = ref("");
const email = ref("");
const useWalletFirst = ref(true);

const walletBalanceCents = computed(() => Math.max(0, balanceCents.value ?? 0));
const walletAppliedCents = computed(() => {
  if (!pkg.value || !user.value || !useWalletFirst.value) return 0;
  return Math.min(pkg.value.amountUsdCents, walletBalanceCents.value);
});
const chargeUsdCents = computed(() => {
  if (!pkg.value) return 0;
  return Math.max(0, pkg.value.amountUsdCents - walletAppliedCents.value);
});

watchEffect(() => {
  if (user.value) {
    name.value ||= user.value.displayName ?? "";
    email.value ||= user.value.email ?? "";
    void refreshWallet();
  }
});

const emailValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value),
);
const canSubmit = computed(
  () => !!pkg.value && emailValid.value && !loading.value,
);

async function pay() {
  if (!pkg.value) return;
  await startCheckout({
    purpose: "build",
    planKey: planKey.value,
    name: name.value.trim() || undefined,
    email: email.value.trim() || undefined,
    useWalletFirst: !!user.value && useWalletFirst.value,
  });
}

useSeoMeta({ title: "Checkout — TheWebsiteForge", robots: "noindex" });
</script>

<template>
  <div class="px-4 pt-36 pb-24 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-lg">
      <div
        v-if="!pkg"
        v-motion="reveal(0)"
        class="glass rounded-2xl p-8 text-center"
      >
        <h1 class="font-display text-2xl font-bold text-white">
          Plan not found
        </h1>
        <p class="mt-3 text-slate-400">
          We couldn't find that package. Head back to pricing to choose one.
        </p>
        <NuxtLink
          to="/pricing"
          class="btn-gradient mt-6 inline-flex rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
        >
          View pricing
        </NuxtLink>
      </div>

      <div v-else v-motion="reveal(0)" class="glass-strong rounded-2xl p-8">
        <span
          class="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-300"
        >
          Website build
        </span>
        <h1 class="mt-4 font-display text-3xl font-bold text-white">
          {{ pkg.label }}
        </h1>
        <p class="mt-2 text-slate-400">{{ pkg.blurb }}</p>

        <div class="mt-6 flex items-baseline gap-2">
          <span class="font-display text-4xl font-bold text-white">
            {{ formatUsdCents(pkg.amountUsdCents) }}
          </span>
          <span class="text-sm text-slate-500">one-off</span>
        </div>
        <p class="mt-1 text-sm text-slate-400">
          Secure checkout charge
          <span class="font-semibold text-brand-300">
            {{ estimateZar(chargeUsdCents, rate) }}
          </span>
          (ZAR equivalent).
        </p>

        <div
          v-if="user"
          class="mt-4 rounded-xl border border-white/10 bg-black/20 p-4"
        >
          <label class="flex cursor-pointer items-start gap-3">
            <input
              v-model="useWalletFirst"
              type="checkbox"
              class="mt-0.5 h-4 w-4 rounded border-white/30 bg-black/40 text-brand-500 focus:ring-brand-500"
            />
            <span>
              <span class="block text-sm font-semibold text-white"
                >Use funds in my wallet first</span
              >
              <span class="mt-0.5 block text-xs text-slate-400">
                Available now: {{ formatUsdCents(walletBalanceCents) }}
              </span>
            </span>
          </label>

          <div v-if="useWalletFirst" class="mt-3 space-y-1 text-xs">
            <p class="flex items-center justify-between text-slate-300">
              <span>Wallet applied</span>
              <span class="font-semibold text-white"
                >-{{ formatUsdCents(walletAppliedCents) }}</span
              >
            </p>
            <p class="flex items-center justify-between text-slate-300">
              <span>Charge at checkout</span>
              <span class="font-semibold text-brand-300">{{
                formatUsdCents(chargeUsdCents)
              }}</span>
            </p>
            <p v-if="chargeUsdCents === 0" class="text-white">
              Your wallet fully covers this build. No Paystack charge will be
              needed.
            </p>
          </div>
        </div>

        <div class="mt-8 space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-300"
              >Your name</label
            >
            <input
              v-model="name"
              type="text"
              placeholder="Jane Doe"
              class="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-white outline-none transition focus:border-brand-400/60"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-300"
              >Email</label
            >
            <input
              v-model="email"
              type="email"
              placeholder="jane@company.com"
              class="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-white outline-none transition focus:border-brand-400/60"
            />
            <p class="mt-1 text-xs text-slate-500">
              Your receipt and project updates go here.
            </p>
          </div>
        </div>

        <p v-if="error" class="mt-4 text-sm text-white">{{ error }}</p>

        <button
          type="button"
          :disabled="!canSubmit"
          class="btn-gradient mt-6 inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          @click="pay"
        >
          {{
            loading
              ? "Starting checkout…"
              : chargeUsdCents === 0
                ? "Pay with wallet funds"
                : "Proceed to secure payment"
          }}
        </button>
        <p class="mt-3 text-center text-xs text-slate-500">
          Secure payment via Paystack. You'll be redirected to complete it.
        </p>
      </div>
    </div>
  </div>
</template>
