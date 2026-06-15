<script setup lang="ts">
import { formatUsdCents } from "~~/shared/billing";

const links = [
  { label: "Home", to: "/home" },
  { label: "Showcase", to: "/showcase" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
];

const { y } = useWindowScroll();
const scrolled = computed(() => y.value > 16);
const { user, ready, signOut, adminFetch } = useAuth();
const { balanceCents, refresh: refreshWalletBalance } = useWalletBalance();

const open = ref(false);
const accountOpen = ref(false);
const accountMenu = ref<HTMLElement | null>(null);
const isAdmin = ref(false);
const route = useRoute();

const accountName = computed(
  () => user.value?.displayName || user.value?.email || "Account",
);
const avatarInitials = computed(() => {
  const name = accountName.value.replace(/@.*/, "").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = `${parts[0]?.[0] ?? "A"}${parts[1]?.[0] ?? ""}`;
  return initials.toUpperCase();
});

const mobileLinks = computed(() => [
  ...links,
  { label: "Contact", to: "/contact" },
  ...(ready.value && user.value
    ? [{ label: "My account", to: "/account" }]
    : []),
  ...(ready.value && user.value && isAdmin.value
    ? [{ label: "Admin", to: "/admin" }]
    : []),
  ...(ready.value && !user.value ? [{ label: "Sign in", to: "/account" }] : []),
]);

async function refreshAdminStatus() {
  if (!ready.value || !user.value) {
    isAdmin.value = false;
    return;
  }

  try {
    await adminFetch("/api/admin/me");
    isAdmin.value = true;
  } catch {
    isAdmin.value = false;
  }
}

async function handleSignOut() {
  accountOpen.value = false;
  isAdmin.value = false;
  await signOut();
}

if (import.meta.client) {
  watch([ready, () => user.value?.uid], refreshAdminStatus, {
    immediate: true,
  });
  onClickOutside(accountMenu, () => {
    accountOpen.value = false;
  });
}

watch(
  () => route.fullPath,
  () => {
    open.value = false;
    accountOpen.value = false;
    if (ready.value && user.value) {
      void refreshWalletBalance();
    }
  },
);
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 transition-all duration-300"
    :class="scrolled ? 'py-2' : 'py-4'"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav
        class="flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300"
        :class="
          scrolled
            ? 'glass-strong shadow-2xl shadow-black/40'
            : 'border border-transparent'
        "
      >
        <NuxtLink to="/home" class="group flex items-center gap-2.5">
          <span
            data-brand-mark-target
            class="brand-mark-target inline-flex text-white"
          >
            <LogoMark :size="32" />
          </span>
          <span class="text-lg font-semibold tracking-tight text-white">
            TheWebsite<span class="text-gradient">Forge</span>
          </span>
        </NuxtLink>

        <!-- desktop nav -->
        <ul class="hidden items-center gap-1 md:flex">
          <li v-for="link in links" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="relative rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
              active-class="!text-white"
            >
              {{ link.label }}
              <span
                v-if="route.path === link.to"
                class="absolute inset-x-3 -bottom-0.5 h-px bg-linear-to-r from-brand-400 to-accent-400"
              />
            </NuxtLink>
          </li>
        </ul>

        <div class="flex items-center gap-2">
          <NuxtLink
            v-if="ready && user && isAdmin"
            to="/admin"
            class="hidden rounded-lg border border-white/10 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/5 sm:inline-flex"
          >
            Admin
          </NuxtLink>
          <NuxtLink
            v-if="ready && !user"
            to="/account"
            class="hidden rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:block"
          >
            Sign in
          </NuxtLink>
          <NuxtLink
            to="/contact"
            class="hidden rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:block"
          >
            Contact
          </NuxtLink>
          <NuxtLink
            v-magnetic="0.45"
            to="/contact"
            class="btn-gradient hidden rounded-lg px-4 py-2 text-sm font-semibold text-white md:inline-flex"
          >
            Get a quote
          </NuxtLink>

          <NuxtLink
            v-if="ready && user"
            to="/account"
            class="glass inline-flex items-center rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            {{ formatUsdCents(balanceCents ?? 0) }}
          </NuxtLink>

          <div v-if="ready && user" ref="accountMenu" class="relative">
            <button
              type="button"
              class="glass inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 text-sm font-semibold text-white transition hover:border-brand-300/50 hover:bg-white/10"
              :aria-expanded="accountOpen"
              aria-haspopup="menu"
              aria-label="Open account menu"
              @click="accountOpen = !accountOpen"
            >
              <img
                v-if="user.photoURL"
                :src="user.photoURL"
                :alt="accountName"
                loading="lazy"
                decoding="async"
                referrerpolicy="no-referrer"
                class="h-full w-full object-cover"
              />
              <span v-else>{{ avatarInitials }}</span>
            </button>

            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 translate-y-1"
              leave-active-class="transition duration-100 ease-in"
              leave-to-class="opacity-0 translate-y-1"
            >
              <div
                v-if="accountOpen"
                class="glass-strong absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 p-2 text-left shadow-2xl shadow-black/40"
                role="menu"
              >
                <div class="px-3 py-2.5">
                  <p class="truncate text-sm font-semibold text-white">
                    {{ accountName }}
                  </p>
                  <p class="truncate text-xs text-slate-400">
                    {{ user.email }}
                  </p>
                </div>
                <NuxtLink
                  to="/account"
                  class="block rounded-lg px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white"
                  role="menuitem"
                >
                  My account
                </NuxtLink>
                <NuxtLink
                  v-if="isAdmin"
                  to="/admin"
                  class="block rounded-lg px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white sm:hidden"
                  role="menuitem"
                >
                  Admin
                </NuxtLink>
                <button
                  type="button"
                  class="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white"
                  role="menuitem"
                  @click="handleSignOut"
                >
                  Sign out
                </button>
              </div>
            </Transition>
          </div>

          <!-- mobile toggle -->
          <button
            type="button"
            class="glass inline-flex h-10 w-10 items-center justify-center rounded-lg text-white md:hidden"
            :aria-expanded="open"
            aria-label="Toggle menu"
            @click="open = !open"
          >
            <svg
              v-if="!open"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            <svg
              v-else
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </nav>

      <!-- mobile menu -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        leave-active-class="transition duration-150 ease-in"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-if="open"
          class="glass-strong mt-2 overflow-hidden rounded-2xl p-2 md:hidden"
        >
          <NuxtLink
            v-for="link in mobileLinks"
            :key="link.to"
            :to="link.to"
            class="block rounded-xl px-4 py-3 text-base font-medium text-slate-200 transition hover:bg-white/5"
            active-class="text-white bg-white/5"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
      </Transition>
    </div>
  </header>
</template>
