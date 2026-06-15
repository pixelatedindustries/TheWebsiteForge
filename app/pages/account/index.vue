<script setup lang="ts">
import {
  TOPUP_PRESETS_USD_CENTS,
  MIN_TOPUP_USD_CENTS,
  formatUsdCents,
  estimateZar,
} from "~~/shared/billing";
import type { Invoice, Site, Txn, WalletData } from "~/types/account";

/**
 * Customer portal (WebForgePlan2 §4.5): wallet balance + runway, add funds,
 * transaction ledger, recurring services, sites, one-off invoices, and a
 * change-request form. Any signed-in customer (not gated by ADMIN_EMAILS).
 */
const { user, ready, configured, signInWithGoogle, signOut, authFetch } =
  useAuth();
const {
  startCheckout,
  loading: topupLoading,
  error: topupError,
} = useCheckout();
const { balanceCents, refresh: refreshWalletBalance } = useWalletBalance();

const config = useRuntimeConfig();
const rate = Number(config.public.usdToZar) || 17;

const wallet = ref<WalletData | null>(null);
const txns = ref<Txn[]>([]);
const invoices = ref<Invoice[]>([]);
const sites = ref<Site[]>([]);
const pending = ref(true);
const loadError = ref<string | null>(null);

const presets = TOPUP_PRESETS_USD_CENTS;
const customAmount = ref<number | null>(null);
const minTopupUsd = MIN_TOPUP_USD_CENTS / 100;

const crTitle = ref("");
const crDetails = ref("");
const crSiteId = ref("");
const crBusy = ref(false);
const crMessage = ref<string | null>(null);

const runwayLabel = computed(() => {
  const m = wallet.value?.runwayMonths;
  if (m == null) return "No recurring services yet";
  if (m < 1) return "Less than a month left — top up soon";
  return `~${Math.floor(m)} month${Math.floor(m) === 1 ? "" : "s"} of runway`;
});

async function load() {
  if (!user.value) return;
  pending.value = true;
  loadError.value = null;
  try {
    const [w, t, b] = await Promise.all([
      authFetch<WalletData>("/api/account/wallet"),
      authFetch<{ transactions: Txn[] }>("/api/account/transactions"),
      authFetch<{ invoices: Invoice[]; sites: Site[] }>("/api/account/billing"),
    ]);
    wallet.value = w;
    balanceCents.value = w.balanceCents;
    txns.value = t.transactions;
    invoices.value = b.invoices;
    sites.value = b.sites;
  } catch (e) {
    const err = e as {
      data?: { statusMessage?: string };
      statusMessage?: string;
    };
    loadError.value =
      err?.data?.statusMessage ||
      err?.statusMessage ||
      "Failed to load your account.";
  } finally {
    pending.value = false;
  }
}

function topup(cents: number) {
  void refreshWalletBalance();
  void startCheckout({ purpose: "topup", amountUsdCents: cents });
}
function topupCustom() {
  const cents = Math.round((customAmount.value ?? 0) * 100);
  if (cents < MIN_TOPUP_USD_CENTS) return;
  void refreshWalletBalance();
  void startCheckout({ purpose: "topup", amountUsdCents: cents });
}

async function submitChangeRequest() {
  if (crTitle.value.trim().length < 3 || crDetails.value.trim().length < 10)
    return;
  crBusy.value = true;
  crMessage.value = null;
  try {
    await authFetch("/api/account/change-request", {
      method: "POST",
      body: {
        title: crTitle.value.trim(),
        details: crDetails.value.trim(),
        siteId: crSiteId.value || undefined,
      },
    });
    crTitle.value = "";
    crDetails.value = "";
    crSiteId.value = "";
    crMessage.value =
      "Thanks! We've received your request and will be in touch with a quote.";
  } catch (e) {
    const err = e as {
      data?: { statusMessage?: string };
      statusMessage?: string;
    };
    crMessage.value =
      err?.data?.statusMessage || err?.statusMessage || "Could not submit.";
  } finally {
    crBusy.value = false;
  }
}

const txnSign = (c: number) => (c >= 0 ? "+" : "−");
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
const statusClass = (s: string) =>
  ({
    paid: "bg-white/15 text-white",
    open: "bg-brand-500/15 text-brand-300",
    failed: "bg-white/5 text-slate-300 ring-1 ring-white/30",
    refunded: "bg-slate-500/15 text-slate-400",
    live: "bg-white/15 text-white",
    suspended: "bg-slate-500/20 text-slate-300",
    draft: "bg-slate-500/15 text-slate-400",
    offboarded: "bg-slate-500/15 text-slate-400",
  })[s] || "bg-slate-500/15 text-slate-400";

if (import.meta.client) {
  watch(
    [ready, () => user.value?.uid],
    () => {
      if (ready.value && user.value) load();
    },
    { immediate: true },
  );
}

useSeoMeta({ title: "My account — TheWebsiteForge", robots: "noindex" });
</script>

<template>
  <div class="px-4 pt-36 pb-24 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl">
      <!-- loading auth -->
      <div
        v-if="!ready"
        class="glass rounded-2xl p-10 text-center text-slate-400"
      >
        Loading…
      </div>

      <!-- not configured -->
      <div v-else-if="!configured" class="glass rounded-2xl p-10 text-center">
        <h1 class="font-display text-2xl font-bold text-white">
          Sign-in unavailable
        </h1>
        <p class="mt-3 text-slate-400">Authentication isn't configured yet.</p>
      </div>

      <!-- signed out -->
      <div v-else-if="!user" v-motion="reveal(0)" class="mx-auto max-w-md">
        <div class="glass-strong rounded-2xl p-8 text-center">
          <h1 class="font-display text-3xl font-bold text-white">
            Your account
          </h1>
          <p class="mt-3 text-slate-400">
            Sign in to manage your wallet, top up credit, view invoices, and
            request changes.
          </p>
          <button
            type="button"
            class="btn-gradient mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white"
            @click="signInWithGoogle"
          >
            Continue with Google
          </button>
        </div>
      </div>

      <!-- signed in -->
      <div v-else>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 class="font-display text-3xl font-bold text-white">
              My account
            </h1>
            <p class="mt-1 text-sm text-slate-400">{{ user.email }}</p>
          </div>
          <button
            type="button"
            class="glass rounded-lg px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            @click="signOut"
          >
            Sign out
          </button>
        </div>

        <p v-if="loadError" class="mt-8 text-sm text-white">
          {{ loadError }}
        </p>
        <p v-else-if="pending" class="mt-8 text-sm text-slate-500">
          Loading your account…
        </p>

        <div v-else class="mt-8 grid gap-6 lg:grid-cols-3">
          <!-- wallet + add funds -->
          <div class="lg:col-span-2 space-y-6">
            <div class="glass-strong gradient-border rounded-2xl p-6">
              <p class="text-sm text-slate-400">Wallet balance</p>
              <p class="mt-1 font-display text-4xl font-bold text-white">
                {{ formatUsdCents(wallet?.balanceCents ?? 0) }}
              </p>
              <p class="mt-1 text-sm text-slate-400">
                {{ runwayLabel }}
                <span
                  v-if="wallet && wallet.monthlyBurnCents > 0"
                  class="text-slate-500"
                >
                  · {{ formatUsdCents(wallet.monthlyBurnCents) }}/mo
                </span>
              </p>

              <div class="mt-6">
                <p class="mb-2 text-sm font-medium text-slate-300">Add funds</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="p in presets"
                    :key="p"
                    type="button"
                    :disabled="topupLoading"
                    class="glass rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                    @click="topup(p)"
                  >
                    {{ formatUsdCents(p) }}
                  </button>
                </div>
                <div class="mt-3 flex items-center gap-2">
                  <div class="relative flex-1">
                    <span
                      class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      >$</span
                    >
                    <input
                      v-model.number="customAmount"
                      type="number"
                      :min="minTopupUsd"
                      :placeholder="`Custom (min $${minTopupUsd})`"
                      class="w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pl-7 pr-3 text-white outline-none transition focus:border-brand-400/60"
                    />
                  </div>
                  <button
                    type="button"
                    :disabled="
                      topupLoading || (customAmount ?? 0) < minTopupUsd
                    "
                    class="btn-gradient rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    @click="topupCustom"
                  >
                    Add
                  </button>
                </div>
                <p class="mt-2 text-xs text-slate-500">
                  Charged in ZAR (≈
                  {{ estimateZar(MIN_TOPUP_USD_CENTS, rate) }} per ${{
                    minTopupUsd
                  }}). Credit never expires.
                </p>
                <p v-if="topupError" class="mt-2 text-sm text-white">
                  {{ topupError }}
                </p>
              </div>
            </div>

            <!-- transactions -->
            <div class="glass rounded-2xl p-6">
              <h2 class="text-sm font-semibold text-white">
                Transaction history
              </h2>
              <p v-if="!txns.length" class="mt-3 text-sm text-slate-500">
                No transactions yet. Add funds to get started.
              </p>
              <table v-else class="mt-4 w-full text-left text-sm">
                <thead>
                  <tr class="border-b border-white/10 text-slate-400">
                    <th class="py-2 font-medium">Date</th>
                    <th class="py-2 font-medium">Description</th>
                    <th class="py-2 text-right font-medium">Amount</th>
                    <th class="py-2 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="t in txns"
                    :key="t.id"
                    class="border-b border-white/5 last:border-0"
                  >
                    <td class="py-2.5 text-slate-400">
                      {{ fmtDate(t.createdAt) }}
                    </td>
                    <td class="py-2.5 text-slate-200">{{ t.description }}</td>
                    <td
                      class="py-2.5 text-right font-medium"
                      :class="
                        t.amountCents >= 0
                          ? 'text-white'
                          : 'text-slate-200'
                      "
                    >
                      {{ txnSign(t.amountCents)
                      }}{{ formatUsdCents(Math.abs(t.amountCents)) }}
                    </td>
                    <td class="py-2.5 text-right text-slate-400">
                      {{ formatUsdCents(t.balanceAfterCents) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- invoices (one-off builds) -->
            <div class="glass rounded-2xl p-6">
              <h2 class="text-sm font-semibold text-white">Invoices</h2>
              <p v-if="!invoices.length" class="mt-3 text-sm text-slate-500">
                No invoices yet.
              </p>
              <table v-else class="mt-4 w-full text-left text-sm">
                <thead>
                  <tr class="border-b border-white/10 text-slate-400">
                    <th class="py-2 font-medium">#</th>
                    <th class="py-2 font-medium">Type</th>
                    <th class="py-2 text-right font-medium">Amount</th>
                    <th class="py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="i in invoices"
                    :key="i.id"
                    class="border-b border-white/5 last:border-0"
                  >
                    <td class="py-2.5 text-slate-400">{{ i.number }}</td>
                    <td class="py-2.5 capitalize text-slate-200">
                      {{ i.type }}
                    </td>
                    <td class="py-2.5 text-right text-slate-200">
                      {{ formatUsdCents(i.amountCents) }}
                    </td>
                    <td class="py-2.5 text-right">
                      <span
                        class="rounded-full px-2 py-0.5 text-xs font-semibold"
                        :class="statusClass(i.status)"
                      >
                        {{ i.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- right column: services, sites, change request -->
          <div class="space-y-6">
            <div class="glass rounded-2xl p-6">
              <h2 class="text-sm font-semibold text-white">
                Recurring services
              </h2>
              <p
                v-if="!wallet?.recurring.length"
                class="mt-3 text-sm text-slate-500"
              >
                None yet. We'll set these up when your site goes live.
              </p>
              <ul v-else class="mt-4 space-y-3">
                <li
                  v-for="r in wallet.recurring"
                  :key="r.id"
                  class="flex items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <p class="font-medium text-white">{{ r.label }}</p>
                    <p class="text-xs text-slate-500">
                      Next: {{ fmtDate(r.nextChargeAt) }}
                    </p>
                  </div>
                  <span class="whitespace-nowrap font-semibold text-brand-300">
                    {{ formatUsdCents(r.amountCents) }}/mo
                  </span>
                </li>
              </ul>
            </div>

            <div class="glass rounded-2xl p-6">
              <h2 class="text-sm font-semibold text-white">Your sites</h2>
              <p v-if="!sites.length" class="mt-3 text-sm text-slate-500">
                No sites yet.
              </p>
              <ul v-else class="mt-4 space-y-2">
                <li
                  v-for="s in sites"
                  :key="s.id"
                  class="flex items-center justify-between gap-3 text-sm"
                >
                  <span class="text-slate-200">{{ s.name }}</span>
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-semibold"
                    :class="statusClass(s.status)"
                  >
                    {{ s.status }}
                  </span>
                </li>
              </ul>
            </div>

            <div class="glass rounded-2xl p-6">
              <h2 class="text-sm font-semibold text-white">Request a change</h2>
              <p class="mt-1 text-xs text-slate-500">
                Need an update or new feature? Tell us and we'll quote it from
                your wallet.
              </p>
              <div class="mt-4 space-y-3">
                <input
                  v-model="crTitle"
                  type="text"
                  placeholder="Short title"
                  class="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-400/60"
                />
                <select
                  v-if="sites.length"
                  v-model="crSiteId"
                  class="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-400/60"
                >
                  <option value="">Which site? (optional)</option>
                  <option v-for="s in sites" :key="s.id" :value="s.id">
                    {{ s.name }}
                  </option>
                </select>
                <textarea
                  v-model="crDetails"
                  rows="3"
                  placeholder="Describe what you'd like…"
                  class="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-400/60"
                />
                <button
                  type="button"
                  :disabled="crBusy"
                  class="btn-gradient inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  @click="submitChangeRequest"
                >
                  {{ crBusy ? "Sending…" : "Submit request" }}
                </button>
                <p v-if="crMessage" class="text-xs text-brand-300">
                  {{ crMessage }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
