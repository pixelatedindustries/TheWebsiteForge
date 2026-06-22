<script setup lang="ts">
import type { Customer, Domain } from "~/models/admin";

definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Domains — Admin", robots: "noindex" });

const { adminFetch } = useAuth();
const domains = ref<Domain[]>([]);
const customers = ref<Customer[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);
const actionError = ref<string | null>(null);
const busy = ref<string | null>(null);

const expiringDomains = computed(
  () =>
    domains.value.filter(
      (domain) =>
        domain.daysToExpiry !== null &&
        domain.daysToExpiry >= 0 &&
        domain.daysToExpiry <= 30,
    ).length,
);
const autoRenewDomains = computed(
  () => domains.value.filter((domain) => domain.autoRenew).length,
);
const annualDomainCost = computed(() =>
  domains.value.reduce((sum, domain) => sum + (domain.annualCostCents ?? 0), 0),
);

function expiryClass(days: number | null): string {
  if (days === null) return "text-slate-400";
  if (days < 0) return "text-rose-400";
  if (days <= 30) return "text-amber-400";
  return "text-slate-300";
}

function errMsg(e: unknown, fallback: string) {
  const err = e as {
    data?: { statusMessage?: string };
    statusMessage?: string;
  };
  return err?.data?.statusMessage || err?.statusMessage || fallback;
}

// --- register form -----------------------------------------------------
const showForm = ref(false);
const formBusy = ref(false);
const formError = ref<string | null>(null);
const form = reactive({
  customerId: "",
  fqdn: "",
  registrar: "cloudflare",
  registeredAt: "",
  expiresAt: "",
  autoRenew: true,
  annualCostUsd: null as number | null,
});

async function load() {
  try {
    const [d, c] = await Promise.all([
      adminFetch<{ domains: Domain[] }>("/api/admin/domains"),
      adminFetch<{ customers: Customer[] }>("/api/admin/customers"),
    ]);
    domains.value = d.domains;
    customers.value = c.customers;
  } catch (e) {
    error.value = errMsg(e, "Failed to load domains.");
  } finally {
    pending.value = false;
  }
}

async function registerDomain() {
  if (!form.customerId || !form.fqdn.trim()) {
    formError.value = "Pick a customer and enter a domain.";
    return;
  }
  formBusy.value = true;
  formError.value = null;
  try {
    await adminFetch("/api/admin/domains", {
      method: "POST",
      body: {
        customerId: form.customerId,
        fqdn: form.fqdn.trim(),
        registrar: form.registrar.trim() || undefined,
        registeredAt: form.registeredAt || undefined,
        expiresAt: form.expiresAt || undefined,
        autoRenew: form.autoRenew,
        annualCostUsdCents:
          form.annualCostUsd != null
            ? Math.round(form.annualCostUsd * 100)
            : undefined,
      },
    });
    Object.assign(form, {
      customerId: "",
      fqdn: "",
      registrar: "cloudflare",
      registeredAt: "",
      expiresAt: "",
      autoRenew: true,
      annualCostUsd: null,
    });
    showForm.value = false;
    await load();
  } catch (e) {
    formError.value = errMsg(e, "Could not register the domain.");
  } finally {
    formBusy.value = false;
  }
}

/** Toggle auto-renew; the server creates/cancels the yearly renewal charge. */
async function toggleAutoRenew(domain: Domain) {
  const previous = domain.autoRenew;
  domain.autoRenew = !previous;
  busy.value = domain.id;
  actionError.value = null;
  try {
    await adminFetch("/api/admin/domains", {
      method: "PATCH",
      body: { id: domain.id, autoRenew: domain.autoRenew },
    });
  } catch (e) {
    domain.autoRenew = previous;
    actionError.value = errMsg(e, `Could not update "${domain.fqdn}".`);
  } finally {
    busy.value = null;
  }
}

onMounted(load);
</script>

<template>
  <div class="admin-page admin-page--domains">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold text-white">Domains</h1>
        <p class="mt-1 text-sm text-slate-400">
          Registrations and renewal dates. Auto-renew bills the annual cost to
          the customer's wallet each year.
        </p>
      </div>
      <button
        type="button"
        class="rounded-lg bg-brand-500/20 px-4 py-2 text-sm font-semibold text-brand-200 hover:bg-brand-500/30"
        @click="showForm = !showForm"
      >
        {{ showForm ? "Close" : "Register domain" }}
      </button>
    </div>

    <form
      v-if="showForm"
      class="glass mt-6 grid gap-3 rounded-2xl p-5 sm:grid-cols-2"
      @submit.prevent="registerDomain"
    >
      <label class="text-xs text-slate-400">
        Customer
        <select
          v-model="form.customerId"
          class="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        >
          <option value="">Select…</option>
          <option v-for="c in customers" :key="c.id" :value="c.id">
            {{ c.name }} ({{ c.email }})
          </option>
        </select>
      </label>
      <label class="text-xs text-slate-400">
        Domain (FQDN)
        <input
          v-model="form.fqdn"
          class="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          placeholder="example.com"
        />
      </label>
      <label class="text-xs text-slate-400">
        Registrar
        <input
          v-model="form.registrar"
          class="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        />
      </label>
      <label class="text-xs text-slate-400">
        Annual cost (USD)
        <input
          v-model.number="form.annualCostUsd"
          type="number"
          min="0"
          step="0.01"
          class="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          placeholder="15.00"
        />
      </label>
      <label class="text-xs text-slate-400">
        Registered on
        <input
          v-model="form.registeredAt"
          type="date"
          class="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        />
      </label>
      <label class="text-xs text-slate-400">
        Expires on
        <input
          v-model="form.expiresAt"
          type="date"
          class="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        />
      </label>
      <label class="flex items-center gap-2 text-xs text-slate-400">
        <input v-model="form.autoRenew" type="checkbox" class="rounded" />
        Auto-renew (bills annual cost to wallet on expiry)
      </label>
      <div class="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          :disabled="formBusy"
          class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {{ formBusy ? "Saving…" : "Register domain" }}
        </button>
        <p v-if="formError" class="text-sm text-rose-400">{{ formError }}</p>
      </div>
      <p class="text-xs text-slate-500 sm:col-span-2">
        Tip: auto-renew needs both an annual cost and an expiry date to schedule
        the yearly wallet charge.
      </p>
    </form>

    <div v-if="!pending && !error" class="admin-summary">
      <div class="admin-summary-card">
        <span>Domains managed</span>
        <strong>{{ domains.length }}</strong>
      </div>
      <div class="admin-summary-card">
        <span>Auto-renewing</span>
        <strong>{{ autoRenewDomains }}</strong>
      </div>
      <div class="admin-summary-card">
        <span>Expiring in 30d</span>
        <strong>{{ expiringDomains }}</strong>
      </div>
      <div class="admin-summary-card">
        <span>Annual cost</span>
        <strong>{{ formatCents(annualDomainCost) }}</strong>
      </div>
    </div>

    <p v-if="actionError" class="mt-4 text-sm text-rose-400">
      {{ actionError }}
    </p>

    <p v-if="pending" class="mt-8 text-sm text-slate-500">Loading…</p>
    <p v-else-if="error" class="mt-8 text-sm text-rose-400">{{ error }}</p>
    <p v-else-if="!domains.length" class="mt-8 text-sm text-slate-500">
      No domains yet.
    </p>

    <div v-else class="glass gradient-border mt-8 overflow-hidden rounded-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead
            class="border-b border-white/10 text-xs uppercase text-slate-500"
          >
            <tr>
              <th class="px-4 py-3 font-medium">Domain</th>
              <th class="px-4 py-3 font-medium">Customer</th>
              <th class="px-4 py-3 font-medium">Registrar</th>
              <th class="px-4 py-3 font-medium">Annual cost</th>
              <th class="px-4 py-3 font-medium">Auto-renew</th>
              <th class="px-4 py-3 font-medium">Expires</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="d in domains" :key="d.id">
              <td class="px-4 py-3 font-medium text-white">{{ d.fqdn }}</td>
              <td class="px-4 py-3 text-slate-300">{{ d.customerName }}</td>
              <td class="px-4 py-3 text-slate-300">
                {{ titleCase(d.registrar) }}
              </td>
              <td class="px-4 py-3 text-slate-300">
                {{
                  d.annualCostCents != null
                    ? formatCents(d.annualCostCents)
                    : "—"
                }}
              </td>
              <td class="px-4 py-3">
                <button
                  type="button"
                  :disabled="busy === d.id"
                  class="rounded-full px-2 py-0.5 text-xs font-medium disabled:opacity-50"
                  :class="
                    d.autoRenew
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-slate-500/15 text-slate-400'
                  "
                  @click="toggleAutoRenew(d)"
                >
                  {{ d.autoRenew ? "On" : "Off" }}
                </button>
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                <span :class="expiryClass(d.daysToExpiry)">
                  {{ formatDate(d.expiresAt) }}
                </span>
                <span
                  v-if="d.daysToExpiry != null"
                  class="ml-1 text-xs"
                  :class="expiryClass(d.daysToExpiry)"
                >
                  ({{ d.daysToExpiry < 0 ? "expired" : `${d.daysToExpiry}d` }})
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
