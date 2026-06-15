<script setup lang="ts">
import type { Domain } from "~/models/admin";

definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Domains — Admin", robots: "noindex" });

const { adminFetch } = useAuth();
const domains = ref<Domain[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);
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

onMounted(async () => {
  try {
    const res = await adminFetch<{ domains: Domain[] }>("/api/admin/domains");
    domains.value = res.domains;
  } catch (e) {
    const err = e as {
      data?: { statusMessage?: string };
      statusMessage?: string;
    };
    error.value =
      err?.data?.statusMessage ||
      err?.statusMessage ||
      "Failed to load domains.";
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <div class="admin-page admin-page--domains">
    <h1 class="font-display text-2xl font-semibold text-white">Domains</h1>
    <p class="mt-1 text-sm text-slate-400">Registrations and renewal dates.</p>

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
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="
                    d.autoRenew
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-slate-500/15 text-slate-400'
                  "
                >
                  {{ d.autoRenew ? "On" : "Off" }}
                </span>
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
