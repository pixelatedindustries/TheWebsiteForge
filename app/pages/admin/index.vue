<script setup lang="ts">
definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Overview — Admin", robots: "noindex" });

interface Overview {
  mrrCents: number;
  revenueThisMonthCents: number;
  revenueYtdCents: number;
  activeSites: number;
  suspendedSites: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  newBuildsThisMonth: number;
  openInvoices: number;
  openInvoicesCents: number;
  failedInvoices: number;
  domainsExpiringSoon: number;
  newLeads: number;
  totalCustomers: number;
  revenueByMonth: { label: string; cents: number }[];
  salesByType: Record<string, number>;
}

const { adminFetch } = useAuth();
const data = ref<Overview | null>(null);
const pending = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    data.value = await adminFetch<Overview>("/api/admin/overview");
  } catch (e) {
    const err = e as { data?: { statusMessage?: string }; statusMessage?: string };
    error.value =
      err?.data?.statusMessage || err?.statusMessage || "Failed to load overview.";
  } finally {
    pending.value = false;
  }
});

const maxMonth = computed(() =>
  Math.max(1, ...(data.value?.revenueByMonth.map((m) => m.cents) ?? [1])),
);
const salesTypes = computed(() =>
  Object.entries(data.value?.salesByType ?? {}).sort((a, b) => b[1] - a[1]),
);
</script>

<template>
  <div>
    <h1 class="font-display text-2xl font-semibold text-white">Overview</h1>
    <p class="mt-1 text-sm text-slate-400">
      Business health at a glance.
    </p>

    <p v-if="pending" class="mt-8 text-sm text-slate-500">Loading…</p>
    <p v-else-if="error" class="mt-8 text-sm text-rose-400">{{ error }}</p>

    <div v-else-if="data" class="mt-8 space-y-8">
      <!-- KPI grid -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="glass gradient-border rounded-2xl p-5">
          <p class="text-xs uppercase tracking-wide text-slate-500">MRR</p>
          <p class="mt-2 font-display text-2xl font-semibold text-white">
            {{ formatCents(data.mrrCents) }}
          </p>
          <p class="mt-1 text-xs text-slate-500">
            {{ data.activeSubscriptions }} active subscriptions
          </p>
        </div>
        <div class="glass gradient-border rounded-2xl p-5">
          <p class="text-xs uppercase tracking-wide text-slate-500">
            Revenue this month
          </p>
          <p class="mt-2 font-display text-2xl font-semibold text-white">
            {{ formatCents(data.revenueThisMonthCents) }}
          </p>
          <p class="mt-1 text-xs text-slate-500">
            {{ formatCents(data.revenueYtdCents) }} YTD
          </p>
        </div>
        <div class="glass gradient-border rounded-2xl p-5">
          <p class="text-xs uppercase tracking-wide text-slate-500">
            Active sites
          </p>
          <p class="mt-2 font-display text-2xl font-semibold text-white">
            {{ data.activeSites }}
          </p>
          <p class="mt-1 text-xs text-slate-500">
            {{ data.suspendedSites }} suspended
          </p>
        </div>
        <div class="glass gradient-border rounded-2xl p-5">
          <p class="text-xs uppercase tracking-wide text-slate-500">
            New leads
          </p>
          <p class="mt-2 font-display text-2xl font-semibold text-white">
            {{ data.newLeads }}
          </p>
          <NuxtLink
            to="/admin/leads"
            class="mt-1 inline-block text-xs text-brand-400 hover:text-brand-300"
          >
            View pipeline →
          </NuxtLink>
        </div>
      </div>

      <!-- secondary stats -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="glass rounded-xl p-4">
          <p class="text-xs text-slate-500">New builds this month</p>
          <p class="mt-1 text-lg font-semibold text-white">
            {{ data.newBuildsThisMonth }}
          </p>
        </div>
        <div class="glass rounded-xl p-4">
          <p class="text-xs text-slate-500">Open invoices</p>
          <p class="mt-1 text-lg font-semibold text-white">
            {{ data.openInvoices }}
            <span class="text-sm font-normal text-slate-400">
              · {{ formatCents(data.openInvoicesCents) }}
            </span>
          </p>
        </div>
        <div class="glass rounded-xl p-4">
          <p class="text-xs text-slate-500">Failed invoices</p>
          <p
            class="mt-1 text-lg font-semibold"
            :class="data.failedInvoices > 0 ? 'text-rose-400' : 'text-white'"
          >
            {{ data.failedInvoices }}
          </p>
        </div>
        <div class="glass rounded-xl p-4">
          <p class="text-xs text-slate-500">Domains expiring (30d)</p>
          <p
            class="mt-1 text-lg font-semibold"
            :class="data.domainsExpiringSoon > 0 ? 'text-amber-400' : 'text-white'"
          >
            {{ data.domainsExpiringSoon }}
          </p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- revenue chart -->
        <div class="glass gradient-border rounded-2xl p-6">
          <h2 class="text-sm font-semibold text-white">
            Revenue · last 6 months
          </h2>
          <div class="mt-6 flex h-40 items-end gap-3">
            <div
              v-for="m in data.revenueByMonth"
              :key="m.label"
              class="flex flex-1 flex-col items-center gap-2"
            >
              <div class="flex w-full flex-1 items-end">
                <div
                  class="w-full rounded-t bg-linear-to-t from-brand-500/40 to-brand-400"
                  :style="{
                    height: `${Math.max(2, (m.cents / maxMonth) * 100)}%`,
                  }"
                  :title="formatCents(m.cents)"
                />
              </div>
              <span class="text-xs text-slate-500">{{ m.label }}</span>
            </div>
          </div>
        </div>

        <!-- sales by type -->
        <div class="glass gradient-border rounded-2xl p-6">
          <h2 class="text-sm font-semibold text-white">
            Sales by type · all time
          </h2>
          <div v-if="salesTypes.length" class="mt-5 space-y-3">
            <div v-for="[type, cents] in salesTypes" :key="type">
              <div class="flex justify-between text-xs">
                <span class="text-slate-300">{{ titleCase(type) }}</span>
                <span class="text-slate-400">{{ formatCents(cents) }}</span>
              </div>
              <div class="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  class="h-full rounded-full bg-linear-to-r from-brand-500 to-brand-400"
                  :style="{
                    width: `${(cents / (salesTypes[0]?.[1] || 1)) * 100}%`,
                  }"
                />
              </div>
            </div>
          </div>
          <p v-else class="mt-5 text-sm text-slate-500">No paid sales yet.</p>
        </div>
      </div>
    </div>
  </div>
</template>
