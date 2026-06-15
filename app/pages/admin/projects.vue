<script setup lang="ts">
definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Projects — Admin", robots: "noindex" });

interface Project {
  id: string;
  customerName: string;
  customerEmail: string;
  name: string;
  status: string;
  progress: number;
  estimatedLaunchAt: string | null;
  latestUpdate: string | null;
  actions: Array<{ id: string; title: string; status: string }>;
}

const { adminFetch } = useAuth();
const projects = ref<Project[]>([]);
const pending = ref(true);
const busy = ref("");
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
  const result = await adminFetch<{ projects: Project[] }>(
    "/api/admin/projects",
  );
  projects.value = result.projects;
  pending.value = false;
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
              </p>
              <h2 class="mt-1 font-semibold text-white">{{ project.name }}</h2>
            </div>
            <button
              class="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              @click="selected = project"
            >
              Add action
            </button>
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
