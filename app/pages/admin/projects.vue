<script setup lang="ts">
import { buildPackages, formatUsdCents } from "~~/shared/billing";

definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Projects — Admin", robots: "noindex" });

interface Project {
  id: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string | null;
  name: string;
  planKey: string;
  status: string;
  progress: number;
  estimatedLaunchAt: string | null;
  latestUpdate: string | null;
  brief: Record<string, unknown> | null;
  paymentStatus: string | null;
  paymentAmountCents: number | null;
  paymentCurrency: string | null;
  actions: Array<{ id: string; title: string; status: string }>;
}

const briefFieldLabels: Record<string, string> = {
  businessType: "Business type",
  siteType: "Site type",
  pageCount: "Page count",
  deadline: "Deadline",
  goals: "Main goals",
  pages: "Pages / sections",
  features: "Features",
  references: "References",
};

function packageLabel(planKey: string): string {
  return buildPackages[planKey]?.label ?? planKey;
}

function briefEntries(
  brief: Record<string, unknown> | null,
): Array<{ label: string; value: string }> {
  if (!brief) return [];
  return Object.entries(briefFieldLabels)
    .map(([key, label]) => {
      const raw = brief[key];
      const value = Array.isArray(raw) ? raw.join(", ") : String(raw ?? "");
      return { label, value: value.trim() };
    })
    .filter((entry) => entry.value.length > 0);
}

function paymentTone(status: string | null): string {
  if (status === "paid") return "text-emerald-400";
  if (status === "failed") return "text-rose-400";
  if (status === "refunded") return "text-amber-400";
  return "text-zinc-400";
}

const { adminFetch } = useAuth();
const projects = ref<Project[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);
const busy = ref("");
const expandedBrief = ref<string | null>(null);
const selected = ref<Project | null>(null);
const actionTitle = ref("");
const actionDetails = ref("");
const deliverableName = ref("");
const deliverableUrl = ref("");
const statuses = [
  "awaiting_payment",
  "brief_received",
  "design",
  "build",
  "review",
  "launch",
  "live",
  "paused",
  "canceled",
];

async function load() {
  pending.value = true;
  error.value = null;
  try {
    const result = await adminFetch<{ projects: Project[] }>(
      "/api/admin/projects",
    );
    projects.value = result.projects;
  } catch (e) {
    const err = e as {
      data?: { statusMessage?: string };
      statusMessage?: string;
    };
    error.value =
      err?.data?.statusMessage ||
      err?.statusMessage ||
      "Failed to load projects.";
  } finally {
    pending.value = false;
  }
}

async function save(project: Project) {
  busy.value = project.id;
  try {
    await adminFetch("/api/admin/projects", {
      method: "PATCH",
      body: {
        id: project.id,
        status: project.status,
        progress: project.progress,
        estimatedLaunchAt: project.estimatedLaunchAt,
        latestUpdate: project.latestUpdate,
      },
    });
    await load();
  } finally {
    busy.value = "";
  }
}

async function addAction() {
  if (!selected.value || actionTitle.value.trim().length < 3) return;
  busy.value = selected.value.id;
  try {
    await adminFetch("/api/admin/project-actions", {
      method: "POST",
      body: {
        projectId: selected.value.id,
        title: actionTitle.value,
        details: actionDetails.value,
      },
    });
    actionTitle.value = "";
    actionDetails.value = "";
    await load();
    selected.value =
      projects.value.find((project) => project.id === selected.value?.id) ??
      null;
  } finally {
    busy.value = "";
  }
}

async function addDeliverable() {
  if (
    !selected.value ||
    deliverableName.value.trim().length < 2 ||
    !deliverableUrl.value
  )
    return;
  busy.value = selected.value.id;
  try {
    await adminFetch("/api/admin/project-files", {
      method: "POST",
      body: {
        projectId: selected.value.id,
        name: deliverableName.value,
        url: deliverableUrl.value,
      },
    });
    deliverableName.value = "";
    deliverableUrl.value = "";
  } finally {
    busy.value = "";
  }
}

onMounted(load);
</script>

<template>
  <div class="admin-page">
    <h1 class="font-display text-2xl font-semibold text-white">Projects</h1>
    <p class="mt-1 text-sm text-zinc-500">
      Update customer progress, launch timing, and required actions.
    </p>

    <p v-if="pending" class="mt-8 text-sm text-zinc-500">Loading projects...</p>
    <p v-else-if="error" class="mt-8 text-sm text-rose-400">{{ error }}</p>
    <div v-else class="mt-8 grid gap-5 xl:grid-cols-[1fr_22rem]">
      <div class="space-y-4">
        <article
          v-for="project in projects"
          :key="project.id"
          class="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs text-zinc-600">
                {{ project.customerName }} · {{ project.customerEmail }}
                <span v-if="project.customerCompany">
                  · {{ project.customerCompany }}</span
                >
              </p>
              <h2 class="mt-1 font-semibold text-white">{{ project.name }}</h2>
              <div
                class="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium"
              >
                <span
                  class="rounded-full border border-white/10 px-2.5 py-1 text-zinc-300"
                >
                  {{ packageLabel(project.planKey) }}
                </span>
                <span
                  class="rounded-full border border-white/10 px-2.5 py-1"
                  :class="paymentTone(project.paymentStatus)"
                >
                  Payment: {{ project.paymentStatus ?? "—" }}
                  <template v-if="project.paymentAmountCents != null">
                    · {{ formatUsdCents(project.paymentAmountCents) }}
                  </template>
                </span>
              </div>
            </div>
            <button
              class="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              @click="selected = project"
            >
              Add action
            </button>
          </div>

          <div
            v-if="briefEntries(project.brief).length"
            class="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-4"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white"
              @click="
                expandedBrief = expandedBrief === project.id ? null : project.id
              "
            >
              <span>Project brief</span>
              <span>{{ expandedBrief === project.id ? "Hide" : "View" }}</span>
            </button>
            <dl
              v-if="expandedBrief === project.id"
              class="mt-3 grid gap-2 text-sm"
            >
              <div
                v-for="entry in briefEntries(project.brief)"
                :key="entry.label"
                class="grid grid-cols-[8rem_1fr] gap-3"
              >
                <dt class="text-zinc-500">{{ entry.label }}</dt>
                <dd class="text-zinc-200">{{ entry.value }}</dd>
              </div>
            </dl>
          </div>
          <div class="mt-5 grid gap-3 md:grid-cols-[1fr_7rem_10rem]">
            <select
              v-model="project.status"
              class="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
            >
              <option v-for="status in statuses" :key="status" :value="status">
                {{ status.replaceAll("_", " ") }}
              </option>
            </select>
            <input
              v-model.number="project.progress"
              type="number"
              min="0"
              max="100"
              class="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
            />
            <input
              v-model="project.estimatedLaunchAt"
              type="date"
              class="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
            />
          </div>
          <textarea
            v-model="project.latestUpdate"
            rows="2"
            placeholder="Latest customer-facing update"
            class="mt-3 w-full rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white"
          />
          <div class="mt-3 flex items-center justify-between">
            <span class="text-xs text-zinc-600">
              {{
                project.actions.filter((action) => action.status === "open")
                  .length
              }}
              open actions
            </span>
            <button
              :disabled="busy === project.id"
              class="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black disabled:opacity-50"
              @click="save(project)"
            >
              Save update
            </button>
          </div>
        </article>
      </div>

      <aside
        v-if="selected"
        class="sticky top-24 self-start rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"
      >
        <p class="text-xs text-zinc-600">Customer action</p>
        <h2 class="mt-1 font-semibold text-white">{{ selected.name }}</h2>
        <input
          v-model="actionTitle"
          placeholder="Action title"
          class="mt-5 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
        />
        <textarea
          v-model="actionDetails"
          rows="4"
          placeholder="What does the customer need to do?"
          class="mt-3 w-full rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white"
        />
        <button
          :disabled="busy === selected.id"
          class="mt-3 w-full rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-black disabled:opacity-50"
          @click="addAction"
        >
          Add customer action
        </button>
        <div class="mt-6 border-t border-white/[0.08] pt-5">
          <p class="text-xs text-zinc-600">Add deliverable link</p>
          <input
            v-model="deliverableName"
            placeholder="Final source repository"
            class="mt-3 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
          />
          <input
            v-model="deliverableUrl"
            type="url"
            placeholder="https://..."
            class="mt-3 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white"
          />
          <button
            :disabled="busy === selected.id"
            class="mt-3 w-full rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
            @click="addDeliverable"
          >
            Add deliverable
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>
