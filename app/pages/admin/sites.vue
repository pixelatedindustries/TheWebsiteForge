<script setup lang="ts">
import type { Site } from "~/models/admin";

definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Sites — Admin", robots: "noindex" });

const statusStyles: Record<string, string> = {
  live: "bg-emerald-500/15 text-emerald-300",
  draft: "bg-slate-500/15 text-slate-400",
  building: "bg-brand-500/15 text-brand-300",
  suspended: "bg-rose-500/15 text-rose-300",
  archived: "bg-slate-500/15 text-slate-500",
};

const { adminFetch } = useAuth();
const sites = ref<Site[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);
const busy = ref<string | null>(null);
const liveSites = computed(
  () => sites.value.filter((site) => site.status === "live").length,
);
const buildingSites = computed(
  () => sites.value.filter((site) => site.status === "building").length,
);
const suspendedSites = computed(
  () => sites.value.filter((site) => site.status === "suspended").length,
);

async function load() {
  try {
    const res = await adminFetch<{ sites: Site[] }>("/api/admin/sites");
    sites.value = res.sites;
  } catch (e) {
    const err = e as {
      data?: { statusMessage?: string };
      statusMessage?: string;
    };
    error.value =
      err?.data?.statusMessage || err?.statusMessage || "Failed to load sites.";
  } finally {
    pending.value = false;
  }
}

async function setStatus(site: Site, status: string) {
  const previous = site.status;
  site.status = status;
  busy.value = site.id;
  try {
    await adminFetch("/api/admin/sites", {
      method: "PATCH",
      body: { id: site.id, status },
    });
  } catch {
    site.status = previous;
  } finally {
    busy.value = null;
  }
}

onMounted(load);
</script>

<template>
  <div class="admin-page admin-page--sites">
    <h1 class="font-display text-2xl font-semibold text-white">Sites</h1>
    <p class="mt-1 text-sm text-slate-400">Every site you build and host.</p>

    <div v-if="!pending && !error" class="admin-summary">
      <div class="admin-summary-card">
        <span>Total sites</span>
        <strong>{{ sites.length }}</strong>
      </div>
      <div class="admin-summary-card">
        <span>Live</span>
        <strong>{{ liveSites }}</strong>
      </div>
      <div class="admin-summary-card">
        <span>In production</span>
        <strong>{{ buildingSites }}</strong>
      </div>
      <div class="admin-summary-card">
        <span>Suspended</span>
        <strong>{{ suspendedSites }}</strong>
      </div>
    </div>

    <p v-if="pending" class="mt-8 text-sm text-slate-500">Loading…</p>
    <p v-else-if="error" class="mt-8 text-sm text-rose-400">{{ error }}</p>
    <p v-else-if="!sites.length" class="mt-8 text-sm text-slate-500">
      No sites yet.
    </p>

    <div v-else class="glass gradient-border mt-8 overflow-hidden rounded-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead
            class="border-b border-white/10 text-xs uppercase text-slate-500"
          >
            <tr>
              <th class="px-4 py-3 font-medium">Site</th>
              <th class="px-4 py-3 font-medium">Customer</th>
              <th class="px-4 py-3 font-medium">Type</th>
              <th class="px-4 py-3 font-medium">Database</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="s in sites" :key="s.id">
              <td class="px-4 py-3">
                <p class="font-medium text-white">{{ s.name }}</p>
                <a
                  v-if="s.deployUrl"
                  :href="s.deployUrl"
                  target="_blank"
                  rel="noopener"
                  class="text-xs text-brand-400 hover:text-brand-300"
                >
                  {{ s.deployUrl }}
                </a>
              </td>
              <td class="px-4 py-3 text-slate-300">{{ s.customerName }}</td>
              <td class="px-4 py-3 text-slate-300">{{ titleCase(s.type) }}</td>
              <td class="px-4 py-3 text-slate-300">
                {{ titleCase(s.dbHosting) }}
              </td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="
                    statusStyles[s.status] || 'bg-slate-500/15 text-slate-400'
                  "
                >
                  {{ titleCase(s.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  v-if="s.status !== 'suspended'"
                  type="button"
                  :disabled="busy === s.id"
                  class="text-xs text-amber-300 hover:underline disabled:opacity-50"
                  @click="setStatus(s, 'suspended')"
                >
                  Suspend
                </button>
                <button
                  v-else
                  type="button"
                  :disabled="busy === s.id"
                  class="text-xs text-emerald-300 hover:underline disabled:opacity-50"
                  @click="setStatus(s, 'live')"
                >
                  Resume
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
