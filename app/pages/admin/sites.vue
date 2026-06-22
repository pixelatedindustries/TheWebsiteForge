<script setup lang="ts">
import type { Customer, Site } from "~/models/admin";

definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Sites — Admin", robots: "noindex" });

// Aligned to the real site_status enum (draft / live / suspended / offboarded).
const statusStyles: Record<string, string> = {
  live: "bg-emerald-500/15 text-emerald-300",
  draft: "bg-slate-500/15 text-slate-400",
  suspended: "bg-rose-500/15 text-rose-300",
  offboarded: "bg-slate-500/15 text-slate-500",
};

const { adminFetch } = useAuth();
const sites = ref<Site[]>([]);
const customers = ref<Customer[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);
const actionError = ref<string | null>(null);
const busy = ref<string | null>(null);

const liveSites = computed(
  () => sites.value.filter((site) => site.status === "live").length,
);
const draftSites = computed(
  () => sites.value.filter((site) => site.status === "draft").length,
);
const suspendedSites = computed(
  () => sites.value.filter((site) => site.status === "suspended").length,
);

// --- create form -------------------------------------------------------
const showForm = ref(false);
const formBusy = ref(false);
const formError = ref<string | null>(null);
const form = reactive({
  customerId: "",
  name: "",
  type: "dynamic" as "static" | "dynamic" | "app",
  origin: "brought" as "built" | "brought",
  dbHosting: "none" as "none" | "self_hosted" | "managed",
  deployUrl: "",
  repoUrl: "",
  vpsHost: "",
});

async function load() {
  try {
    const [s, c] = await Promise.all([
      adminFetch<{ sites: Site[] }>("/api/admin/sites"),
      adminFetch<{ customers: Customer[] }>("/api/admin/customers"),
    ]);
    sites.value = s.sites;
    customers.value = c.customers;
  } catch (e) {
    error.value = errMsg(e, "Failed to load sites.");
  } finally {
    pending.value = false;
  }
}

async function createSite() {
  if (!form.customerId || form.name.trim().length < 2) {
    formError.value = "Pick a customer and enter a site name.";
    return;
  }
  formBusy.value = true;
  formError.value = null;
  try {
    await adminFetch("/api/admin/sites", {
      method: "POST",
      body: {
        customerId: form.customerId,
        name: form.name.trim(),
        type: form.type,
        origin: form.origin,
        dbHosting: form.dbHosting,
        deployUrl: form.deployUrl.trim() || undefined,
        repoUrl: form.repoUrl.trim() || undefined,
        vpsHost: form.vpsHost.trim() || undefined,
      },
    });
    Object.assign(form, {
      customerId: "",
      name: "",
      type: "dynamic",
      origin: "brought",
      dbHosting: "none",
      deployUrl: "",
      repoUrl: "",
      vpsHost: "",
    });
    showForm.value = false;
    await load();
  } catch (e) {
    formError.value = errMsg(e, "Could not create the site.");
  } finally {
    formBusy.value = false;
  }
}

async function setStatus(site: Site, status: string) {
  const previous = site.status;
  site.status = status;
  busy.value = site.id;
  actionError.value = null;
  try {
    await adminFetch("/api/admin/sites", {
      method: "PATCH",
      body: { id: site.id, status },
    });
  } catch (e) {
    site.status = previous;
    actionError.value = errMsg(e, `Could not update "${site.name}".`);
  } finally {
    busy.value = null;
  }
}

function errMsg(e: unknown, fallback: string) {
  const err = e as { data?: { statusMessage?: string }; statusMessage?: string };
  return err?.data?.statusMessage || err?.statusMessage || fallback;
}

onMounted(load);
</script>

<template>
  <div class="admin-page admin-page--sites">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold text-white">Sites</h1>
        <p class="mt-1 text-sm text-slate-400">
          Every site you build and host.
        </p>
      </div>
      <button
        type="button"
        class="rounded-lg bg-brand-500/20 px-4 py-2 text-sm font-semibold text-brand-200 hover:bg-brand-500/30"
        @click="showForm = !showForm"
      >
        {{ showForm ? "Close" : "New site" }}
      </button>
    </div>

    <form
      v-if="showForm"
      class="glass mt-6 grid gap-3 rounded-2xl p-5 sm:grid-cols-2"
      @submit.prevent="createSite"
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
        Site name
        <input
          v-model="form.name"
          class="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          placeholder="Acme Co. website"
        >
      </label>
      <label class="text-xs text-slate-400">
        Type
        <select
          v-model="form.type"
          class="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        >
          <option value="static">Static</option>
          <option value="dynamic">Dynamic</option>
          <option value="app">App</option>
        </select>
      </label>
      <label class="text-xs text-slate-400">
        Origin
        <select
          v-model="form.origin"
          class="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        >
          <option value="built">Built by us</option>
          <option value="brought">Brought by customer</option>
        </select>
      </label>
      <label class="text-xs text-slate-400">
        Database hosting
        <select
          v-model="form.dbHosting"
          class="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        >
          <option value="none">None</option>
          <option value="self_hosted">Self-hosted</option>
          <option value="managed">Managed</option>
        </select>
      </label>
      <label class="text-xs text-slate-400">
        Deploy URL
        <input
          v-model="form.deployUrl"
          class="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          placeholder="https://…"
        >
      </label>
      <label class="text-xs text-slate-400">
        Repo URL
        <input
          v-model="form.repoUrl"
          class="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          placeholder="https://github.com/…"
        >
      </label>
      <label class="text-xs text-slate-400">
        VPS host
        <input
          v-model="form.vpsHost"
          class="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          placeholder="vps-1"
        >
      </label>
      <div class="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          :disabled="formBusy"
          class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {{ formBusy ? "Saving…" : "Create site" }}
        </button>
        <p v-if="formError" class="text-sm text-rose-400">{{ formError }}</p>
      </div>
    </form>

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
        <span>Draft</span>
        <strong>{{ draftSites }}</strong>
      </div>
      <div class="admin-summary-card">
        <span>Suspended</span>
        <strong>{{ suspendedSites }}</strong>
      </div>
    </div>

    <p v-if="actionError" class="mt-4 text-sm text-rose-400">
      {{ actionError }}
    </p>

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
              <th class="px-4 py-3 font-medium" />
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
