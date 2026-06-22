<script setup lang="ts">
import type { ChangeRequest } from "~/models/admin";

definePageMeta({ layout: "admin" });
useSeoMeta({ title: "Change requests — Admin", robots: "noindex" });

const { adminFetch } = useAuth();
const requests = ref<ChangeRequest[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);
const busy = ref<string | null>(null);
const actionError = ref<string | null>(null);

// Per-row quote input (USD).
const quoteInput = reactive<Record<string, number | null>>({});

const statusStyles: Record<string, string> = {
  open: "bg-brand-500/15 text-brand-300",
  quoted: "bg-amber-500/15 text-amber-300",
  approved: "bg-emerald-500/15 text-emerald-300",
  done: "bg-slate-500/15 text-slate-400",
  declined: "bg-rose-500/15 text-rose-300",
};

const openCount = computed(
  () => requests.value.filter((r) => r.status === "open").length,
);
const quotedCount = computed(
  () => requests.value.filter((r) => r.status === "quoted").length,
);

function errMsg(e: unknown, fallback: string) {
  const err = e as { data?: { statusMessage?: string }; statusMessage?: string };
  return err?.data?.statusMessage || err?.statusMessage || fallback;
}

async function load() {
  try {
    const res = await adminFetch<{ requests: ChangeRequest[] }>(
      "/api/admin/change-requests",
    );
    requests.value = res.requests;
  } catch (e) {
    error.value = errMsg(e, "Failed to load requests.");
  } finally {
    pending.value = false;
  }
}

async function patch(
  id: string,
  body: { status: string; quotedUsdCents?: number },
) {
  busy.value = id;
  actionError.value = null;
  try {
    await adminFetch("/api/admin/change-requests", {
      method: "PATCH",
      body: { id, ...body },
    });
    await load();
  } catch (e) {
    actionError.value = errMsg(e, "Could not update the request.");
  } finally {
    busy.value = null;
  }
}

function sendQuote(r: ChangeRequest) {
  const usd = quoteInput[r.id];
  if (usd == null || usd <= 0) {
    actionError.value = "Enter a quote amount first.";
    return;
  }
  patch(r.id, { status: "quoted", quotedUsdCents: Math.round(usd * 100) });
}

onMounted(load);
</script>

<template>
  <div class="admin-page admin-page--change-requests">
    <h1 class="font-display text-2xl font-semibold text-white">
      Change requests
    </h1>
    <p class="mt-1 text-sm text-slate-400">
      Customer feature/change requests. Quote them; the customer approves and
      pays from their wallet.
    </p>

    <div v-if="!pending && !error" class="admin-summary">
      <div class="admin-summary-card">
        <span>Total</span>
        <strong>{{ requests.length }}</strong>
      </div>
      <div class="admin-summary-card">
        <span>New / open</span>
        <strong>{{ openCount }}</strong>
      </div>
      <div class="admin-summary-card">
        <span>Awaiting approval</span>
        <strong>{{ quotedCount }}</strong>
      </div>
    </div>

    <p v-if="actionError" class="mt-4 text-sm text-rose-400">
      {{ actionError }}
    </p>

    <p v-if="pending" class="mt-8 text-sm text-slate-500">Loading…</p>
    <p v-else-if="error" class="mt-8 text-sm text-rose-400">{{ error }}</p>
    <p v-else-if="!requests.length" class="mt-8 text-sm text-slate-500">
      No requests yet.
    </p>

    <div v-else class="mt-8 space-y-4">
      <article
        v-for="r in requests"
        :key="r.id"
        class="glass gradient-border rounded-2xl p-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-base font-semibold text-white">{{ r.title }}</h2>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="
                  statusStyles[r.status] || 'bg-slate-500/15 text-slate-400'
                "
              >
                {{ titleCase(r.status) }}
              </span>
            </div>
            <p class="mt-1 text-xs text-slate-400">
              {{ r.customerName }} ({{ r.customerEmail }}) ·
              {{ formatDate(r.createdAt) }}
            </p>
          </div>
          <div class="text-right">
            <p
              v-if="r.quotedCents != null"
              class="text-sm font-semibold text-white"
            >
              {{ formatCents(r.quotedCents) }}
            </p>
            <p v-if="r.approvedAt" class="text-xs text-emerald-300">
              Approved {{ formatDate(r.approvedAt) }}
            </p>
          </div>
        </div>

        <p class="mt-3 whitespace-pre-wrap text-sm text-slate-300">
          {{ r.details }}
        </p>

        <div
          v-if="r.status === 'open' || r.status === 'quoted'"
          class="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500">Quote (USD)</span>
            <input
              v-model.number="quoteInput[r.id]"
              type="number"
              min="0"
              step="0.01"
              class="w-28 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white"
              :placeholder="
                r.quotedCents != null ? (r.quotedCents / 100).toFixed(2) : '0.00'
              "
            >
          </div>
          <button
            type="button"
            :disabled="busy === r.id"
            class="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            @click="sendQuote(r)"
          >
            {{ r.status === "quoted" ? "Update quote" : "Send quote" }}
          </button>
          <button
            type="button"
            :disabled="busy === r.id"
            class="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
            @click="patch(r.id, { status: 'declined' })"
          >
            Decline
          </button>
        </div>
        <div
          v-else-if="r.status === 'approved'"
          class="mt-4 flex items-center gap-3 border-t border-white/10 pt-4"
        >
          <button
            type="button"
            :disabled="busy === r.id"
            class="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
            @click="patch(r.id, { status: 'done' })"
          >
            Mark done
          </button>
        </div>
      </article>
    </div>
  </div>
</template>
