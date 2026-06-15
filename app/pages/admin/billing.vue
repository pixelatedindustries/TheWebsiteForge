<script setup lang="ts">
definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Billing — Admin", robots: "noindex" });

interface Subscription {
  id: string;
  customerName: string;
  plan: string;
  provider: string;
  status: string;
  amountCents: number;
  currency: string;
  interval: string;
  currentPeriodEnd: string | null;
}

interface Invoice {
  id: string;
  number: number;
  customerName: string;
  type: string;
  amountCents: number;
  currency: string;
  status: string;
  provider: string | null;
  issuedAt: string;
  paidAt: string | null;
}

const subStatus: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300",
  past_due: "bg-amber-500/15 text-amber-300",
  canceled: "bg-slate-500/15 text-slate-400",
  paused: "bg-slate-500/15 text-slate-400",
};
const invStatus: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-300",
  open: "bg-brand-500/15 text-brand-300",
  failed: "bg-rose-500/15 text-rose-300",
  void: "bg-slate-500/15 text-slate-400",
};

const { adminFetch } = useAuth();
const subscriptions = ref<Subscription[]>([]);
const invoices = ref<Invoice[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);
const activeSubscriptions = computed(
  () =>
    subscriptions.value.filter(
      (subscription) => subscription.status === "active",
    ).length,
);
const recurringRevenue = computed(() =>
  subscriptions.value
    .filter((subscription) => subscription.status === "active")
    .reduce((sum, subscription) => sum + subscription.amountCents, 0),
);
const openInvoices = computed(
  () => invoices.value.filter((invoice) => invoice.status === "open").length,
);
const paidRevenue = computed(() =>
  invoices.value
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amountCents, 0),
);

onMounted(async () => {
  try {
    const res = await adminFetch<{
      subscriptions: Subscription[];
      invoices: Invoice[];
    }>("/api/admin/billing");
    subscriptions.value = res.subscriptions;
    invoices.value = res.invoices;
  } catch (e) {
    const err = e as {
      data?: { statusMessage?: string };
      statusMessage?: string;
    };
    error.value =
      err?.data?.statusMessage ||
      err?.statusMessage ||
      "Failed to load billing.";
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <div class="admin-page admin-page--billing">
    <h1 class="font-display text-2xl font-semibold text-white">Billing</h1>
    <p class="mt-1 text-sm text-slate-400">
      Subscriptions and invoices across all providers.
    </p>

    <div v-if="!pending && !error" class="admin-summary">
      <div class="admin-summary-card">
        <span>Active subscriptions</span>
        <strong>{{ activeSubscriptions }}</strong>
      </div>
      <div class="admin-summary-card">
        <span>Recurring revenue</span>
        <strong>{{ formatCents(recurringRevenue) }}</strong>
      </div>
      <div class="admin-summary-card">
        <span>Open invoices</span>
        <strong>{{ openInvoices }}</strong>
      </div>
      <div class="admin-summary-card">
        <span>Paid revenue</span>
        <strong>{{ formatCents(paidRevenue) }}</strong>
      </div>
    </div>

    <p v-if="pending" class="mt-8 text-sm text-slate-500">Loading…</p>
    <p v-else-if="error" class="mt-8 text-sm text-rose-400">{{ error }}</p>

    <div v-else class="mt-8 space-y-10">
      <section>
        <h2 class="text-sm font-semibold text-white">Subscriptions</h2>
        <p v-if="!subscriptions.length" class="mt-3 text-sm text-slate-500">
          No subscriptions yet.
        </p>
        <div
          v-else
          class="glass gradient-border mt-4 overflow-hidden rounded-2xl"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead
                class="border-b border-white/10 text-xs uppercase text-slate-500"
              >
                <tr>
                  <th class="px-4 py-3 font-medium">Customer</th>
                  <th class="px-4 py-3 font-medium">Plan</th>
                  <th class="px-4 py-3 font-medium">Provider</th>
                  <th class="px-4 py-3 font-medium">Amount</th>
                  <th class="px-4 py-3 font-medium">Renews</th>
                  <th class="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr v-for="s in subscriptions" :key="s.id">
                  <td class="px-4 py-3 text-slate-300">{{ s.customerName }}</td>
                  <td class="px-4 py-3 font-medium text-white">{{ s.plan }}</td>
                  <td class="px-4 py-3 text-slate-300">
                    {{ titleCase(s.provider) }}
                  </td>
                  <td class="px-4 py-3 text-slate-300">
                    {{ formatCents(s.amountCents, s.currency) }}/{{
                      s.interval
                    }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-slate-400">
                    {{ formatDate(s.currentPeriodEnd) }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="
                        subStatus[s.status] || 'bg-slate-500/15 text-slate-400'
                      "
                    >
                      {{ titleCase(s.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-sm font-semibold text-white">Invoices</h2>
        <p v-if="!invoices.length" class="mt-3 text-sm text-slate-500">
          No invoices yet.
        </p>
        <div
          v-else
          class="glass gradient-border mt-4 overflow-hidden rounded-2xl"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead
                class="border-b border-white/10 text-xs uppercase text-slate-500"
              >
                <tr>
                  <th class="px-4 py-3 font-medium">#</th>
                  <th class="px-4 py-3 font-medium">Customer</th>
                  <th class="px-4 py-3 font-medium">Type</th>
                  <th class="px-4 py-3 font-medium">Amount</th>
                  <th class="px-4 py-3 font-medium">Issued</th>
                  <th class="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr v-for="i in invoices" :key="i.id">
                  <td class="px-4 py-3 text-slate-400">{{ i.number }}</td>
                  <td class="px-4 py-3 text-slate-300">{{ i.customerName }}</td>
                  <td class="px-4 py-3 text-slate-300">
                    {{ titleCase(i.type) }}
                  </td>
                  <td class="px-4 py-3 font-medium text-white">
                    {{ formatCents(i.amountCents, i.currency) }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-slate-400">
                    {{ formatDate(i.issuedAt) }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="
                        invStatus[i.status] || 'bg-slate-500/15 text-slate-400'
                      "
                    >
                      {{ titleCase(i.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
