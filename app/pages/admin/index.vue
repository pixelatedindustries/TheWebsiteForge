<script setup lang="ts">
definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Overview - Admin", robots: "noindex" });

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
    const err = e as {
      data?: { statusMessage?: string };
      statusMessage?: string;
    };
    error.value =
      err?.data?.statusMessage ||
      err?.statusMessage ||
      "Failed to load overview.";
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
const attentionCount = computed(() => {
  if (!data.value) return 0;
  return (
    data.value.failedInvoices +
    data.value.domainsExpiringSoon +
    data.value.suspendedSites
  );
});
const revenuePoints = computed(() => {
  const months = data.value?.revenueByMonth ?? [];
  if (!months.length) return "";
  const denominator = Math.max(1, months.length - 1);
  return months
    .map((month, index) => {
      const x = (index / denominator) * 100;
      const y = 88 - (month.cents / maxMonth.value) * 72;
      return `${x},${y}`;
    })
    .join(" ");
});
const revenueAreaPath = computed(() =>
  revenuePoints.value
    ? `M 0 100 L ${revenuePoints.value.replaceAll(",", " ")} L 100 100 Z`
    : "",
);
</script>

<template>
  <div class="mx-auto max-w-[1480px]">
    <div
      class="flex flex-col gap-6 border-b border-white/[0.07] pb-8 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-600"
        >
          Command center / 01
        </p>
        <h1
          class="mt-3 font-display text-4xl font-medium tracking-[-0.045em] text-white sm:text-5xl"
        >
          Business overview.
        </h1>
        <p class="mt-3 max-w-lg text-sm leading-6 text-zinc-500">
          A live view of revenue, delivery, and everything that needs your
          attention.
        </p>
      </div>
      <div class="flex gap-2">
        <NuxtLink
          to="/admin/leads"
          class="rounded-full border border-white/10 px-5 py-2.5 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
        >
          View pipeline
        </NuxtLink>
        <NuxtLink
          to="/admin/customers"
          class="rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200"
        >
          Manage clients
        </NuxtLink>
      </div>
    </div>

    <p v-if="pending" class="mt-8 text-sm text-zinc-500">Loading...</p>
    <p v-else-if="error" class="mt-8 text-sm text-rose-400">{{ error }}</p>

    <div v-else-if="data" class="mt-10 space-y-5">
      <div
        class="metric-grid grid overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.025] sm:grid-cols-2 xl:grid-cols-4"
      >
        <div class="metric-card">
          <div class="flex items-center justify-between">
            <p class="metric-label">Monthly recurring</p>
            <span class="status-dot bg-emerald-400" />
          </div>
          <p class="metric-value">{{ formatCents(data.mrrCents) }}</p>
          <p class="metric-meta">
            {{ data.activeSubscriptions }} active subscriptions
          </p>
          <span class="metric-index">01</span>
        </div>
        <div class="metric-card">
          <p class="metric-label">Revenue this month</p>
          <p class="metric-value">
            {{ formatCents(data.revenueThisMonthCents) }}
          </p>
          <p class="metric-meta">{{ formatCents(data.revenueYtdCents) }} YTD</p>
          <span class="metric-index">02</span>
        </div>
        <div class="metric-card">
          <p class="metric-label">Active sites</p>
          <p class="metric-value">{{ data.activeSites }}</p>
          <p class="metric-meta">{{ data.suspendedSites }} suspended</p>
          <span class="metric-index">03</span>
        </div>
        <div class="metric-card">
          <p class="metric-label">New leads</p>
          <p class="metric-value">{{ data.newLeads }}</p>
          <NuxtLink
            to="/admin/leads"
            class="metric-meta inline-block transition hover:text-white"
          >
            Open pipeline →
          </NuxtLink>
          <span class="metric-index">04</span>
        </div>
      </div>

      <div class="grid gap-5 xl:grid-cols-[1.6fr_0.8fr]">
        <section class="panel min-w-0">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="panel-kicker">Performance</p>
              <h2 class="panel-title">Revenue trajectory</h2>
            </div>
            <p class="text-right text-xs leading-5 text-zinc-600">
              Last six<br />months
            </p>
          </div>
          <div class="chart-stage mt-8">
            <svg
              class="h-full w-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-label="Revenue over the last six months"
            >
              <defs>
                <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#f4f4f5" stop-opacity=".18" />
                  <stop offset="100%" stop-color="#f4f4f5" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path :d="revenueAreaPath" fill="url(#revenue-fill)" />
              <polyline
                :points="revenuePoints"
                fill="none"
                stroke="#f4f4f5"
                stroke-width="1.2"
                vector-effect="non-scaling-stroke"
                class="chart-line"
              />
            </svg>
            <div class="absolute inset-x-0 bottom-0 flex justify-between">
              <span
                v-for="m in data.revenueByMonth"
                :key="m.label"
                class="text-[9px] uppercase tracking-wider text-zinc-700"
              >
                {{ m.label }}
              </span>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="panel-kicker">Watchlist</p>
              <h2 class="panel-title">Needs attention</h2>
            </div>
            <span
              class="rounded-full px-2.5 py-1 text-[10px] font-semibold"
              :class="
                attentionCount
                  ? 'bg-amber-400/10 text-amber-300'
                  : 'bg-emerald-400/10 text-emerald-300'
              "
            >
              {{ attentionCount || "Clear" }}
            </span>
          </div>

          <div class="mt-8 divide-y divide-white/[0.06]">
            <NuxtLink to="/admin/billing" class="watch-row">
              <span>Failed invoices</span>
              <strong
                :class="data.failedInvoices ? 'text-rose-300' : 'text-zinc-300'"
                >{{ data.failedInvoices }}</strong
              >
            </NuxtLink>
            <NuxtLink to="/admin/domains" class="watch-row">
              <span>Domains expiring in 30d</span>
              <strong
                :class="
                  data.domainsExpiringSoon ? 'text-amber-300' : 'text-zinc-300'
                "
                >{{ data.domainsExpiringSoon }}</strong
              >
            </NuxtLink>
            <NuxtLink to="/admin/sites" class="watch-row">
              <span>Suspended sites</span>
              <strong
                :class="
                  data.suspendedSites ? 'text-amber-300' : 'text-zinc-300'
                "
                >{{ data.suspendedSites }}</strong
              >
            </NuxtLink>
            <NuxtLink to="/admin/billing" class="watch-row">
              <span>Open invoices</span>
              <strong class="text-zinc-300">{{ data.openInvoices }}</strong>
            </NuxtLink>
          </div>
          <p class="mt-6 text-xs leading-5 text-zinc-600">
            {{ formatCents(data.openInvoicesCents) }} currently outstanding.
          </p>
        </section>
      </div>

      <div class="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <section class="panel">
          <p class="panel-kicker">Delivery</p>
          <h2 class="panel-title">Studio pulse</h2>
          <div
            class="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/[0.06]"
          >
            <div class="pulse-stat">
              <strong>{{ data.newBuildsThisMonth }}</strong>
              <span>New builds</span>
            </div>
            <div class="pulse-stat">
              <strong>{{ data.totalCustomers }}</strong>
              <span>Total clients</span>
            </div>
            <div class="pulse-stat">
              <strong>{{ data.activeSubscriptions }}</strong>
              <span>Subscriptions</span>
            </div>
            <div class="pulse-stat">
              <strong>{{ data.canceledSubscriptions }}</strong>
              <span>Cancelled</span>
            </div>
          </div>
        </section>

        <section class="panel">
          <p class="panel-kicker">Portfolio mix</p>
          <h2 class="panel-title">Sales by type</h2>
          <div v-if="salesTypes.length" class="mt-8 space-y-5">
            <div v-for="[type, cents] in salesTypes" :key="type">
              <div class="flex justify-between text-[11px]">
                <span class="font-medium text-zinc-300">{{
                  titleCase(type)
                }}</span>
                <span class="tabular-nums text-zinc-600">{{
                  formatCents(cents)
                }}</span>
              </div>
              <div class="mt-2 h-px overflow-hidden bg-white/[0.07]">
                <div
                  class="h-full bg-zinc-200"
                  :style="{
                    width: `${(cents / (salesTypes[0]?.[1] || 1)) * 100}%`,
                  }"
                />
              </div>
            </div>
          </div>
          <p v-else class="mt-5 text-sm text-zinc-500">No paid sales yet.</p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  position: relative;
  overflow: hidden;
  min-height: 11rem;
  padding: 1.5rem;
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  transition:
    background-color 300ms ease,
    transform 300ms ease;
}

.metric-card::before {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 20% 0%,
    rgba(255, 255, 255, 0.08),
    transparent 55%
  );
  content: "";
  opacity: 0;
  transition: opacity 300ms ease;
}

.metric-card:hover {
  background: rgba(255, 255, 255, 0.025);
  transform: translateY(-2px);
}

.metric-card:hover::before {
  opacity: 1;
}

.metric-index {
  position: absolute;
  right: 1rem;
  bottom: 0.8rem;
  font-family: monospace;
  font-size: 0.55rem;
  color: rgb(39 39 42);
}

.metric-label,
.panel-kicker {
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgb(82 82 91);
}

.metric-value {
  margin-top: 1.75rem;
  font-family: var(--font-display);
  font-size: clamp(2rem, 3vw, 2.75rem);
  line-height: 1;
  letter-spacing: -0.055em;
  color: white;
}

.metric-meta {
  margin-top: 0.75rem;
  font-size: 0.6875rem;
  color: rgb(82 82 91);
}

.status-dot {
  height: 0.375rem;
  width: 0.375rem;
  border-radius: 999px;
  box-shadow: 0 0 0.75rem currentColor;
}

.panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.022);
  padding: 1.5rem;
}

.panel::before {
  position: absolute;
  top: 0;
  left: 1.5rem;
  width: 2.5rem;
  height: 1px;
  background: rgba(255, 255, 255, 0.7);
  content: "";
}

.panel-title {
  margin-top: 0.6rem;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: -0.03em;
  color: white;
}

.chart-stage {
  position: relative;
  height: 15rem;
  padding-bottom: 1.5rem;
  background-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.055) 1px,
    transparent 1px
  );
  background-size: 100% 25%;
}

.chart-line {
  stroke-dasharray: 250;
  stroke-dashoffset: 250;
  animation: chart-draw 1.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.watch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 0;
  font-size: 0.75rem;
  color: rgb(113 113 122);
  transition: color 180ms ease;
}

.watch-row:hover {
  color: white;
}

.watch-row strong {
  font-size: 0.75rem;
  font-weight: 600;
}

.pulse-stat {
  display: flex;
  min-height: 7rem;
  flex-direction: column;
  justify-content: space-between;
  background: #0d0d0c;
  padding: 1rem;
  transition: background-color 200ms ease;
}

.pulse-stat:hover {
  background: #151514;
}

.pulse-stat strong {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 500;
  letter-spacing: -0.04em;
  color: white;
}

.pulse-stat span {
  font-size: 0.625rem;
  color: rgb(82 82 91);
}

@keyframes chart-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chart-line {
    animation: none;
  }

  .chart-line {
    stroke-dashoffset: 0;
  }
}
</style>
