<script setup lang="ts">
const year = new Date().getFullYear();
const columns = [
  {
    title: "Explore",
    links: [
      { label: "Showcase", to: "/showcase" },
      { label: "Pricing", to: "/pricing" },
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Marketing sites", to: "/pricing" },
      { label: "Web apps", to: "/pricing" },
      { label: "E-commerce", to: "/showcase" },
      { label: "Ready-made builds", to: "/showcase" },
    ],
  },
];
</script>

<template>
  <footer class="relative z-10 mt-24 border-t border-white/10">
    <div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div class="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <NuxtLink to="/home" class="flex items-center gap-2.5">
            <LogoMark :size="30" />
            <span class="text-lg font-semibold tracking-tight text-white">
              TheWebsite<span class="text-gradient">Forge</span>
            </span>
          </NuxtLink>
          <p class="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            We design, build, and sell premium websites that load fast, look
            stunning, and convert. Yours after handover - no lock-in.
          </p>
        </div>

        <div v-for="col in columns" :key="col.title">
          <h3 class="text-sm font-semibold text-white">{{ col.title }}</h3>
          <ul class="mt-4 space-y-2.5">
            <li v-for="link in col.links" :key="link.label">
              <NuxtLink
                :to="link.to"
                class="text-sm text-slate-400 transition hover:text-brand-300"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-white">Start a project</h3>
          <p class="mt-4 text-sm text-slate-400">
            Tell us what you're building. We reply within one business day.
          </p>
          <NuxtLink
            to="/contact"
            class="btn-gradient mt-4 inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
          >
            Get a quote ->
          </NuxtLink>
        </div>
      </div>

      <div
        class="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row"
      >
        <p>© {{ year }} TheWebsiteForge. All rights reserved.</p>
        <nav class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <NuxtLink to="/terms" class="transition hover:text-brand-300">Terms</NuxtLink>
          <NuxtLink to="/hosting-agreement" class="transition hover:text-brand-300">
            Hosting Agreement
          </NuxtLink>
          <NuxtLink to="/refund-policy" class="transition hover:text-brand-300">
            Refund Policy
          </NuxtLink>
        </nav>
        <p class="flex items-center gap-2">
          <span class="inline-block h-2 w-2 animate-pulse-glow rounded-full bg-brand-400" />
          Built with Nuxt 4 · Tailwind v4
        </p>
      </div>
    </div>
  </footer>
</template>
