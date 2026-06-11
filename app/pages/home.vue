<script setup lang="ts">
useSeoMeta({
  title: "TheWebsiteForge — Websites We Build, Sell, and Stand Behind",
  description:
    "Premium, fast, beautifully animated websites we build and sell. Browse the showcase, see the proof, and pick a plan.",
});
</script>

<template>
  <div>
    <!-- soft landing heading over the morphed orb background -->
    <section
      class="relative px-4 pt-48 pb-10 sm:px-6 lg:px-8 lg:pt-56 xl:pt-64"
    >
      <div class="flex items-center gap-12 2xl:gap-20">
        <div class="min-w-0 max-w-4xl flex-1 lg:pl-12 xl:pl-20 2xl:pl-24">
          <h1
            class="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            <span v-split="{ delay: 0.1 }" class="block"
              >Websites we build,</span
            >
            <span
              v-reveal="{ y: 44, delay: 0.4, duration: 1 }"
              class="text-gradient-animated block"
            >
              sell, and stand behind.
            </span>
          </h1>

          <p
            v-reveal="{ delay: 0.55 }"
            class="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300"
          >
            TheWebsiteForge crafts blisteringly fast, beautifully animated
            websites — then offers them for sale. Browse the showcase, see the
            proof, and launch something you're proud of.
          </p>

          <div
            v-reveal="{ delay: 0.7 }"
            class="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <NuxtLink
              v-magnetic="0.5"
              to="/showcase"
              class="btn-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white sm:w-auto"
            >
              Explore the showcase
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </NuxtLink>
            <NuxtLink
              v-magnetic="0.35"
              to="/pricing"
              class="glass inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              See pricing
            </NuxtLink>
          </div>
        </div>

        <!-- a website being built and shipped, perfectly looping; fills the empty
             right space on wide screens (hidden when there's no room for it) -->
        <BuildShip class="hidden w-105 shrink-0 2xl:block 2xl:w-125" />
      </div>
    </section>

    <LogoMarquee />
    <FeaturedShowcase />
    <StatsStrip />
    <ProofWall />
    <ProcessSection />
    <TestimonialsSection />
    <CtaSection />
  </div>
</template>
