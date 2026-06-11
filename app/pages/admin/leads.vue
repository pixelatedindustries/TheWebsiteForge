<script setup lang="ts">
definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Leads — Admin", robots: "noindex" });

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  budget: string | null;
  message: string | null;
  status: "new" | "contacted" | "won" | "lost";
  source: string;
  createdAt: string;
}

const STATUSES = ["new", "contacted", "won", "lost"] as const;
const statusStyles: Record<string, string> = {
  new: "bg-brand-500/15 text-brand-300",
  contacted: "bg-amber-500/15 text-amber-300",
  won: "bg-emerald-500/15 text-emerald-300",
  lost: "bg-slate-500/15 text-slate-400",
};

const { adminFetch } = useAuth();
const leads = ref<Lead[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);
const saving = ref<string | null>(null);
const selectedLead = ref<Lead | null>(null);

async function load() {
  try {
    const res = await adminFetch<{ leads: Lead[] }>("/api/admin/leads");
    leads.value = res.leads;
  } catch (e) {
    const err = e as {
      data?: { statusMessage?: string };
      statusMessage?: string;
    };
    error.value =
      err?.data?.statusMessage || err?.statusMessage || "Failed to load leads.";
  } finally {
    pending.value = false;
  }
}

async function updateStatus(lead: Lead, status: Lead["status"]) {
  const previous = lead.status;
  lead.status = status;
  saving.value = lead.id;
  try {
    await adminFetch("/api/admin/leads", {
      method: "PATCH",
      body: { id: lead.id, status },
    });
  } catch {
    lead.status = previous;
  } finally {
    saving.value = null;
  }
}

const converting = ref<string | null>(null);
const convertMsg = ref<string | null>(null);

/** Convert a lead into a customer (links the lead + marks it won). */
async function convertLead(lead: Lead) {
  converting.value = lead.id;
  convertMsg.value = null;
  try {
    await adminFetch("/api/admin/customers", {
      method: "POST",
      body: {
        name: lead.name,
        email: lead.email,
        company: lead.company ?? undefined,
        leadId: lead.id,
      },
    });
    lead.status = "won";
    convertMsg.value = `${lead.name} is now a customer.`;
  } catch (e) {
    const err = e as {
      data?: { statusMessage?: string };
      statusMessage?: string;
    };
    convertMsg.value =
      err?.data?.statusMessage || err?.statusMessage || "Convert failed.";
  } finally {
    converting.value = null;
  }
}

function closeLeadModal() {
  selectedLead.value = null;
}

onMounted(load);
</script>

<template>
  <div>
    <h1 class="font-display text-2xl font-semibold text-white">Leads</h1>
    <p class="mt-1 text-sm text-slate-400">
      Enquiries from the contact form and other sources.
    </p>
    <p v-if="convertMsg" class="mt-2 text-sm text-brand-300">
      {{ convertMsg }}
    </p>

    <p v-if="pending" class="mt-8 text-sm text-slate-500">Loading…</p>
    <p v-else-if="error" class="mt-8 text-sm text-rose-400">{{ error }}</p>
    <p v-else-if="!leads.length" class="mt-8 text-sm text-slate-500">
      No leads yet.
    </p>

    <div v-else class="glass gradient-border mt-8 overflow-hidden rounded-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead
            class="border-b border-white/10 text-xs uppercase text-slate-500"
          >
            <tr>
              <th class="px-4 py-3 font-medium">Contact</th>
              <th class="px-4 py-3 font-medium">Budget</th>
              <th class="px-4 py-3 font-medium">Message</th>
              <th class="px-4 py-3 font-medium">Received</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="lead in leads" :key="lead.id" class="align-top">
              <td class="px-4 py-3">
                <p class="font-medium text-white">{{ lead.name }}</p>
                <a
                  :href="`mailto:${lead.email}`"
                  class="text-xs text-brand-400 hover:text-brand-300"
                >
                  {{ lead.email }}
                </a>
                <p v-if="lead.company" class="text-xs text-slate-500">
                  {{ lead.company }}
                </p>
              </td>
              <td class="px-4 py-3 text-slate-300">{{ lead.budget || "—" }}</td>
              <td class="max-w-xs px-4 py-3 text-slate-400">
                <span class="line-clamp-3">{{ lead.message || "—" }}</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-slate-400">
                {{ formatDate(lead.createdAt) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="statusStyles[lead.status]"
                  >
                    {{ titleCase(lead.status) }}
                  </span>
                  <select
                    :value="lead.status"
                    :disabled="saving === lead.id"
                    class="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-slate-200 focus:border-brand-400 focus:outline-none"
                    @change="
                      updateStatus(
                        lead,
                        ($event.target as HTMLSelectElement)
                          .value as Lead['status'],
                      )
                    "
                  >
                    <option v-for="s in STATUSES" :key="s" :value="s">
                      {{ titleCase(s) }}
                    </option>
                  </select>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-brand-300/40 hover:bg-white/5 hover:text-white"
                    @click="selectedLead = lead"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    :disabled="converting === lead.id"
                    class="rounded-lg border border-emerald-400/30 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-50"
                    @click="convertLead(lead)"
                  >
                    {{ converting === lead.id ? "…" : "Convert" }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-100 ease-in"
        leave-to-class="opacity-0"
      >
        <div
          v-if="selectedLead"
          class="fixed inset-0 z-100 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          @click.self="closeLeadModal"
          @keydown.esc="closeLeadModal"
        >
          <div
            class="glass-strong gradient-border max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-2xl shadow-black/50"
            tabindex="-1"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p
                  class="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300"
                >
                  Lead details
                </p>
                <h2 class="mt-2 font-display text-2xl font-semibold text-white">
                  {{ selectedLead.name }}
                </h2>
                <p
                  v-if="selectedLead.company"
                  class="mt-1 text-sm text-slate-400"
                >
                  {{ selectedLead.company }}
                </p>
              </div>
              <button
                type="button"
                class="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                aria-label="Close lead details"
                @click="closeLeadModal"
              >
                Close
              </button>
            </div>

            <dl class="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-xs uppercase text-slate-500">Email</dt>
                <dd class="mt-1">
                  <a
                    :href="`mailto:${selectedLead.email}`"
                    class="text-sm font-medium text-brand-300 hover:text-brand-200"
                  >
                    {{ selectedLead.email }}
                  </a>
                </dd>
              </div>
              <div>
                <dt class="text-xs uppercase text-slate-500">Budget</dt>
                <dd class="mt-1 text-sm font-medium text-white">
                  {{ selectedLead.budget || "—" }}
                </dd>
              </div>
              <div>
                <dt class="text-xs uppercase text-slate-500">Status</dt>
                <dd class="mt-1">
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="statusStyles[selectedLead.status]"
                  >
                    {{ titleCase(selectedLead.status) }}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-xs uppercase text-slate-500">Received</dt>
                <dd class="mt-1 text-sm font-medium text-white">
                  {{ formatDate(selectedLead.createdAt) }}
                </dd>
              </div>
              <div>
                <dt class="text-xs uppercase text-slate-500">Source</dt>
                <dd class="mt-1 text-sm font-medium text-white">
                  {{ titleCase(selectedLead.source.replaceAll("_", " ")) }}
                </dd>
              </div>
            </dl>

            <div class="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 class="text-sm font-semibold text-white">Message</h3>
              <p
                class="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300"
              >
                {{ selectedLead.message || "No message provided." }}
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
