<script setup lang="ts">
const { user, ready, signOut, adminFetch } = useAuth();
const router = useRouter();
const route = useRoute();

const authorized = ref(false);
const checking = ref(true);
const accessError = ref<string | null>(null);

const nav = [
  { label: "Overview", to: "/admin" },
  { label: "Leads", to: "/admin/leads" },
  { label: "Customers", to: "/admin/customers" },
  { label: "Sites", to: "/admin/sites" },
  { label: "Domains", to: "/admin/domains" },
  { label: "Billing", to: "/admin/billing" },
  { label: "Settings", to: "/admin/settings" },
];

async function check() {
  if (!ready.value) return;
  checking.value = true;
  accessError.value = null;

  if (!user.value) {
    authorized.value = false;
    checking.value = false;
    await router.replace("/admin/login");
    return;
  }

  try {
    await adminFetch("/api/admin/me");
    authorized.value = true;
  } catch (e) {
    authorized.value = false;
    const err = e as {
      statusMessage?: string;
      data?: { statusMessage?: string };
    };
    accessError.value =
      err?.data?.statusMessage ||
      err?.statusMessage ||
      "You are not authorized for the admin area.";
  } finally {
    checking.value = false;
  }
}

watch([ready, user], check, { immediate: true });

async function handleSignOut() {
  await signOut();
  await router.replace("/admin/login");
}

const isActive = (to: string) =>
  to === "/admin" ? route.path === "/admin" : route.path.startsWith(to);

const currentSection = computed(
  () => nav.find((item) => isActive(item.to))?.label ?? "Admin",
);
</script>

<template>
  <div class="admin-shell min-h-screen text-zinc-200">
    <div
      v-if="!ready || checking"
      class="flex min-h-screen items-center justify-center bg-[#0a0a09]"
    >
      <div class="flex items-center gap-3 text-zinc-500">
        <span
          class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-800 border-t-zinc-100"
        />
        Opening workspace...
      </div>
    </div>

    <div
      v-else-if="!authorized"
      class="flex min-h-screen items-center justify-center bg-[#0a0a09] px-4"
    >
      <div
        class="max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center"
      >
        <h1 class="font-display text-xl font-semibold text-white">
          Access denied
        </h1>
        <p class="mt-3 text-sm text-zinc-400">{{ accessError }}</p>
        <p v-if="user" class="mt-2 text-xs text-zinc-600">
          Signed in as {{ user.email }}
        </p>
        <button
          class="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
          @click="handleSignOut"
        >
          Sign out
        </button>
      </div>
    </div>

    <div v-else class="relative flex min-h-screen">
      <aside
        class="admin-sidebar sticky top-0 hidden h-screen w-64 shrink-0 flex-col p-5 md:flex"
      >
        <NuxtLink to="/admin" class="flex items-center gap-3 px-2 py-1">
          <span
            class="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/[0.06]"
          >
            <LogoMark :size="21" />
          </span>
          <span>
            <span class="block text-sm font-semibold tracking-tight text-white">
              TheWebsiteForge
            </span>
            <span
              class="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.24em] text-zinc-600"
            >
              Operations
            </span>
          </span>
        </NuxtLink>

        <p
          class="mb-3 mt-10 px-3 text-[9px] font-semibold uppercase tracking-[0.24em] text-zinc-700"
        >
          Workspace
        </p>
        <nav class="flex flex-1 flex-col gap-1">
          <NuxtLink
            v-for="(item, index) in nav"
            :key="item.to"
            :to="item.to"
            class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition"
            :class="
              isActive(item.to)
                ? 'bg-white text-black shadow-lg shadow-black/20'
                : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
            "
          >
            <span
              class="text-[9px] font-semibold tabular-nums tracking-wider"
              :class="isActive(item.to) ? 'text-zinc-500' : 'text-zinc-700'"
            >
              {{ String(index + 1).padStart(2, "0") }}
            </span>
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="border-t border-white/[0.06] pt-4">
          <NuxtLink
            to="/home"
            class="flex items-center justify-between rounded-xl px-3 py-2 text-xs text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300"
          >
            View live site
            <span aria-hidden="true">↗</span>
          </NuxtLink>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header
          class="admin-header sticky top-0 z-30 flex items-center justify-between px-5 py-4 sm:px-7 lg:px-10"
        >
          <nav class="flex gap-1 overflow-x-auto md:hidden">
            <NuxtLink
              v-for="item in nav"
              :key="item.to"
              :to="item.to"
              class="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition"
              :class="
                isActive(item.to)
                  ? 'bg-white text-black'
                  : 'text-zinc-500 hover:text-white'
              "
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
          <p
            class="hidden text-[9px] font-medium uppercase tracking-[0.22em] text-zinc-600 md:block"
          >
            Admin / {{ currentSection }}
          </p>

          <div class="flex items-center gap-3">
            <span
              class="hidden max-w-48 truncate text-xs text-zinc-500 sm:block"
            >
              {{ user?.email }}
            </span>
            <button
              class="rounded-full border border-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
              @click="handleSignOut"
            >
              Sign out
            </button>
          </div>
        </header>

        <main class="relative z-10 flex-1 p-5 sm:p-7 lg:p-10">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  background:
    radial-gradient(
      circle at 85% -10%,
      rgba(255, 255, 255, 0.055),
      transparent 28rem
    ),
    #0a0a09;
}

.admin-sidebar {
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(5, 5, 5, 0.72);
  backdrop-filter: blur(24px);
}

.admin-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.055);
  background: rgba(10, 10, 9, 0.76);
  backdrop-filter: blur(24px);
}

:deep(.admin-page) {
  position: relative;
  margin-inline: auto;
  max-width: 1480px;
}

:deep(.admin-page::before) {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.5625rem;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgb(82 82 91);
}

:deep(.admin-page--leads::before) {
  content: "Pipeline / 02";
}

:deep(.admin-page--customers::before) {
  content: "Relationships / 03";
}

:deep(.admin-page--sites::before) {
  content: "Delivery / 04";
}

:deep(.admin-page--domains::before) {
  content: "Infrastructure / 05";
}

:deep(.admin-page--billing::before) {
  content: "Finance / 06";
}

:deep(.admin-page--settings::before) {
  content: "Access / 07";
}

:deep(.admin-page > h1) {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.055em;
}

:deep(.admin-page > h1 + p) {
  margin-top: 1rem;
  max-width: 38rem;
  line-height: 1.7;
  color: rgb(113 113 122);
}

:deep(.admin-page > h1 + p::after) {
  display: block;
  width: 100%;
  height: 1px;
  margin-top: 2rem;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.16), transparent);
  content: "";
}

:deep(.admin-summary) {
  display: grid;
  margin-top: 2rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.018);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

:deep(.admin-summary-card) {
  position: relative;
  display: flex;
  min-height: 7rem;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: background-color 180ms ease;
}

:deep(.admin-summary-card:hover) {
  background: rgba(255, 255, 255, 0.025);
}

:deep(.admin-summary-card span) {
  font-size: 0.5625rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgb(82 82 91);
}

:deep(.admin-summary-card strong) {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 500;
  letter-spacing: -0.05em;
  color: white;
}

@media (min-width: 1024px) {
  :deep(.admin-summary) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  :deep(.admin-summary-card) {
    min-height: 8rem;
    padding: 1.25rem;
  }
}

:deep(.admin-page .glass),
:deep(.admin-page .glass-strong) {
  border: 1px solid rgba(255, 255, 255, 0.075);
  background: rgba(255, 255, 255, 0.018);
  box-shadow: none;
  backdrop-filter: blur(18px);
}

:deep(.admin-page .gradient-border::before) {
  display: none;
}

:deep(.admin-page table) {
  border-collapse: separate;
  border-spacing: 0;
}

:deep(.admin-page thead) {
  background: rgba(255, 255, 255, 0.018);
}

:deep(.admin-page th) {
  padding-block: 1rem;
  font-size: 0.5625rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgb(82 82 91);
}

:deep(.admin-page tbody tr) {
  transition: background-color 180ms ease;
}

:deep(.admin-page tbody tr:hover) {
  background: rgba(255, 255, 255, 0.025);
}

:deep(.admin-page td) {
  padding-block: 1rem;
}

:deep(.admin-page a[href^="mailto:"]),
:deep(.admin-page a[target="_blank"]) {
  color: rgb(161 161 170);
  text-decoration: underline;
  text-decoration-color: rgba(255, 255, 255, 0.15);
  text-underline-offset: 0.25rem;
}

:deep(.admin-page button),
:deep(.admin-page select),
:deep(.admin-page input) {
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

:deep(.admin-page button:hover:not(:disabled)) {
  transform: translateY(-1px);
}

:deep(.admin-page select),
:deep(.admin-page input) {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.35);
}

:deep(.admin-page section > h2) {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: -0.035em;
}

:deep(.admin-page code) {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}
</style>
