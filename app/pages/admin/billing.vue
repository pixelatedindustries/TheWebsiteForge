<script setup lang="ts">
import type { Invoice, Recurring } from "~/models/admin";

definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Billing — Admin", robots: "noindex" });

const recStatus: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300",
  paused: "bg-amber-500/15 text-amber-300",
  canceled: "bg-slate-500/15 text-slate-400",
};
const invStatus: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-300",
  open: "bg-brand-500/15 text-brand-300",
  failed: "bg-rose-500/15 text-rose-300",
  refunded: "bg-slate-500/15 text-slate-400",
};

const { adminFetch } = useAuth();
const invoices = ref<Invoice[]>([]);
const recurring = ref<Recurring[]>([]);
const total = ref(0);
const pending = ref(true);
const error = ref<string | null>(null);
const busy = ref<string | null>(null);
const actionError = ref<string | null>(null);

const PAGE = 25;
const page = ref(0);
const filters = reactive({ q: "", status: "", type: "", from: "", to: "" });

const monthlyCents = (amount: number, interval?: string) =>
  interval === "year" ? Math.round(amount / 12) : amount;

const activeRecurring = computed(
  () => recurring.value.filter((r) => r.status === "active").length,
);
const recurringMrr = computed(() =>
  recurring.value
    .filter((r) => r.status === "active")
    .reduce((sum, r) => sum + monthlyCents(r.amountCents, r.interval), 0),
);
const maxPage = computed(() => Math.max(0, Math.ceil(total.value / PAGE) - 1));

function errMsg(e: unknown, fallback: string) {
  const err = e as { data?: { statusMessage?: string }; statusMessage?: string };
  return err?.data?.statusMessage || err?.statusMessage || fallback;
}

async function load() {
  pending.value = true;
  error.value = null;
  try {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE));
    params.set("offset", String(page.value * PAGE));
    if (filters.q) params.set("q", filters.q);
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    const res = await adminFetch<{
      invoices: Invoice[];
      recurring: Recurring[];
      pagination: { total: number };
    }>(`/api/admin/billing?${params.toString()}`);
    invoices.value = res.invoices;
    recurring.value = res.recurring;
    total.value = res.pagination.total;
  } catch (e) {
    error.value = errMsg(e, "Failed to load billing.");
  } finally {
    pending.value = false;
  }
}

function applyFilters() {
  page.value = 0;
  load();
}
function resetFilters() {
  filters.q = "";
  filters.status = "";
  filters.type = "";
  filters.from = "";
  filters.to = "";
  page.value = 0;
  load();
}
function go(delta: number) {
  page.value = Math.min(maxPage.value, Math.max(0, page.value + delta));
  load();
}

async function invoiceAction(inv: Invoice, action: string) {
  busy.value = inv.id;
  actionError.value = null;
  try {
    await adminFetch("/api/admin/invoice", {
      method: "PATCH",
      body: { id: inv.id, action },
    });
    await load();
  } catch (e) {
    actionError.value = errMsg(e, "Action failed.");
  } finally {
    busy.value = null;
  }
}

async function setRecurringStatus(r: Recurring, status: string) {
  busy.value = r.id;
  actionError.value = null;
  try {
    await adminFetch("/api/admin/recurring", {
      method: "PATCH",
      body: { id: r.id, status },
    });
    await load();
  } catch (e) {
    actionError.value = errMsg(e, "Could not update charge.");
  } finally {
    busy.value = null;
  }
}

onMounted(load);
</script>

<template>
  <div class="admin-page admin-page--billing">
    <h1 class="font-display text-2xl font-semibold text-white">Billing</h1>
    <p class="mt-1 text-sm text-slate-400">
      Wallet recurring charges and invoices.
    </p>

    <div v-if="!error" class="admin-summary">
      <div class="admin-summary-card">
        <span>Active recurring</span>
        <strong>{{ activeRecurring }}</strong>
      </div>
      <div class="admin-summary-card">
        <span>Recurring MRR</span>
        <strong>{{ formatCents(recurringMrr) }}</strong>
      </div>
      <div class="admin-summary-card">
        <span>Invoices (filtered)</span>
        <strong>{{ total }}</strong>
      </div>
      <div class="admin-summary-card">
        <span>Page</span>
        <strong>{{ page + 1 }} / {{ maxPage + 1 }}</strong>
      </div>
    </div>

    <p v-if="actionError" class="mt-4 text-sm text-rose-400">
      {{ actionError }}
    </p>
    <p v-if="error" class="mt-8 text-sm text-rose-400">{{ error }}</p>

    <div v-else class="mt-8 space-y-10">
      <!-- recurring charges -->
      <section>
        <h2 class="text-sm font-semibold text-white">Recurring charges</h2>
        <p v-if="!recurring.length" class="mt-3 text-sm text-slate-500">
          No recurring charges yet.
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
                  <th class="px-4 py-3 font-medium">Service</th>
                  <th class="px-4 py-3 font-medium">Amount</th>
                  <th class="px-4 py-3 font-medium">Next charge</th>
                  <th class="px-4 py-3 font-medium">Status</th>
                  <th class="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr v-for="r in recurring" :key="r.id">
                  <td class="px-4 py-3 text-slate-300">{{ r.customerName }}</td>
                  <td class="px-4 py-3 font-medium text-white">
                    {{ r.label }}
                  </td>
                  <td class="px-4 py-3 text-slate-300">
                    {{ formatCents(r.amountCents) }}/{{
                      r.interval === "year" ? "yr" : "mo"
                    }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-slate-400">
                    {{ formatDate(r.nextChargeAt) }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="
                        recStatus[r.status] || 'bg-slate-500/15 text-slate-400'
                      "
                    >
                      {{ titleCase(r.status) }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      v-if="r.status === 'active'"
                      type="button"
                      :disabled="busy === r.id"
                      class="text-xs text-amber-300 hover:underline disabled:opacity-50"
                      @click="setRecurringStatus(r, 'paused')"
                    >
                      Pause
                    </button>
                    <button
                      v-else-if="r.status === 'paused'"
                      type="button"
                      :disabled="busy === r.id"
                      class="text-xs text-emerald-300 hover:underline disabled:opacity-50"
                      @click="setRecurringStatus(r, 'active')"
                    >
                      Resume
                    </button>
                    <button
                      v-if="r.status !== 'canceled'"
                      type="button"
                      :disabled="busy === r.id"
                      class="ml-3 text-xs text-rose-300 hover:underline disabled:opacity-50"
                      @click="setRecurringStatus(r, 'canceled')"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- invoices -->
      <section>
        <h2 class="text-sm font-semibold text-white">Invoices</h2>

        <div class="mt-4 flex flex-wrap items-end gap-3">
          <input
            v-model="filters.q"
            type="text"
            placeholder="Search customer…"
            class="w-48 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
            @keyup.enter="applyFilters"
          >
          <select
            v-model="filters.status"
            class="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          >
            <option value="">Any status</option>
            <option value="open">Open</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed/Void</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            v-model="filters.type"
            class="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          >
            <option value="">Any type</option>
            <option value="build">Build</option>
            <option value="hosting">Hosting</option>
            <option value="database">Database</option>
            <option value="domain">Domain</option>
            <option value="feature">Feature</option>
          </select>
          <input
            v-model="filters.from"
            type="date"
            class="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          >
          <input
            v-model="filters.to"
            type="date"
            class="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          >
          <button
            type="button"
            class="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white"
            @click="applyFilters"
          >
            Filter
          </button>
          <button
            type="button"
            class="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
            @click="resetFilters"
          >
            Reset
          </button>
        </div>

        <p v-if="pending" class="mt-4 text-sm text-slate-500">Loading…</p>
        <p v-else-if="!invoices.length" class="mt-4 text-sm text-slate-500">
          No invoices match.
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
                  <th class="px-4 py-3 font-medium" />
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
                  <td class="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      v-if="i.status === 'open'"
                      type="button"
                      :disabled="busy === i.id"
                      class="text-xs text-emerald-300 hover:underline disabled:opacity-50"
                      @click="invoiceAction(i, 'mark_paid')"
                    >
                      Mark paid
                    </button>
                    <button
                      v-if="i.status === 'open'"
                      type="button"
                      :disabled="busy === i.id"
                      class="ml-3 text-xs text-slate-400 hover:underline disabled:opacity-50"
                      @click="invoiceAction(i, 'void')"
                    >
                      Void
                    </button>
                    <button
                      v-if="i.status === 'paid'"
                      type="button"
                      :disabled="busy === i.id"
                      class="text-xs text-rose-300 hover:underline disabled:opacity-50"
                      @click="invoiceAction(i, 'refund')"
                    >
                      Refund
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-end gap-3 text-sm">
          <button
            type="button"
            :disabled="page <= 0"
            class="rounded-lg border border-white/10 px-3 py-1.5 text-slate-300 disabled:opacity-40"
            @click="go(-1)"
          >
            Prev
          </button>
          <span class="text-slate-500">{{ page + 1 }} / {{ maxPage + 1 }}</span>
          <button
            type="button"
            :disabled="page >= maxPage"
            class="rounded-lg border border-white/10 px-3 py-1.5 text-slate-300 disabled:opacity-40"
            @click="go(1)"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
