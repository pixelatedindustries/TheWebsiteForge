<script setup lang="ts">
const links = [
  { label: "Home", to: "/home" },
  { label: "Showcase", to: "/showcase" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
];

const { y } = useWindowScroll();
const scrolled = computed(() => y.value > 16);

const open = ref(false);
const route = useRoute();
watch(
  () => route.fullPath,
  () => (open.value = false),
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
          <LogoMark :size="32" />
          <span class="text-lg font-semibold tracking-tight text-white">
            YourWebsite<span class="text-gradient">Source</span>
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
                class="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-brand-400 to-accent-400"
              />
            </NuxtLink>
          </li>
        </ul>

        <div class="flex items-center gap-2">
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
            v-for="link in [...links, { label: 'Contact', to: '/contact' }]"
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
