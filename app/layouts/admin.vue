<script setup lang="ts">
const { user, ready, configured, signOut, adminFetch } = useAuth();
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
    const err = e as { statusMessage?: string; data?: { statusMessage?: string } };
    accessError.value =
      err?.data?.statusMessage || err?.statusMessage || "You are not authorized for the admin area.";
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
</script>

<template>
  <div class="min-h-screen bg-[#05070d] text-slate-200">
    <!-- loading gate -->
    <div
      v-if="!ready || checking"
      class="flex min-h-screen items-center justify-center"
    >
      <div class="flex items-center gap-3 text-slate-400">
        <span
          class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-brand-400"
        />
        Loading admin…
      </div>
    </div>

    <!-- access denied -->
    <div
      v-else-if="!authorized"
      class="flex min-h-screen items-center justify-center px-4"
    >
      <div class="glass gradient-border max-w-md rounded-2xl p-8 text-center">
        <h1 class="font-display text-xl font-semibold text-white">
          Access denied
        </h1>
        <p class="mt-3 text-sm text-slate-400">{{ accessError }}</p>
        <p v-if="user" class="mt-2 text-xs text-slate-500">
          Signed in as {{ user.email }}
        </p>
        <button
          class="btn-gradient mt-6 inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
          @click="handleSignOut"
        >
          Sign out
        </button>
      </div>
    </div>

    <!-- authorized shell -->
    <div v-else class="flex min-h-screen">
      <aside
        class="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-black/20 p-5 md:flex"
      >
        <NuxtLink to="/admin" class="flex items-center gap-2.5">
          <LogoMark :size="28" />
          <span class="font-semibold tracking-tight text-white">
            Admin
          </span>
        </NuxtLink>

        <nav class="mt-8 flex flex-1 flex-col gap-1">
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="rounded-lg px-3 py-2 text-sm font-medium transition"
            :class="
              isActive(item.to)
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            "
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <NuxtLink
          to="/home"
          class="rounded-lg px-3 py-2 text-xs text-slate-500 transition hover:text-slate-300"
        >
          ← Back to site
        </NuxtLink>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header
          class="flex items-center justify-between border-b border-white/10 px-5 py-3.5"
        >
          <!-- mobile nav -->
          <nav class="flex gap-1 overflow-x-auto md:hidden">
            <NuxtLink
              v-for="item in nav"
              :key="item.to"
              :to="item.to"
              class="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition"
              :class="
                isActive(item.to)
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white'
              "
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
          <div class="hidden md:block" />

          <div class="flex items-center gap-3">
            <span class="text-sm text-slate-400">{{ user?.email }}</span>
            <button
              class="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              @click="handleSignOut"
            >
              Sign out
            </button>
          </div>
        </header>

        <main class="flex-1 p-5 sm:p-7">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
