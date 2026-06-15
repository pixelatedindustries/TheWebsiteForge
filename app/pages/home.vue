<script setup lang="ts">
useSeoMeta({
  title: "TheWebsiteForge — Websites We Build, Sell, and Stand Behind",
  description:
    "Premium, fast, beautifully animated websites we build and sell. Browse the showcase, see the proof, and pick a plan.",
});
</script>

<template>
  <div data-glass-page class="relative isolate">
    <GlassShardBackground
      glass-color="#343536"
      edge-light-color="#eee9df"
      :ambient-intensity="0.55"
      :point-light-intensity="32"
      :roughness="0.34"
      :transmission="0.7"
      :thickness="1.35"
      :shard-count="144"
      :shard-size-min="0.16"
      :shard-size-max="0.32"
      intro-color="#ffffff"
      :logo-offset-x="2.9"
      :intro-hold="0.8"
      :intro-duration="2.2"
      :scrub="1"
      :explosion="4.8"
      :hover-lift="0.35"
      :hover-drift="1.1"
      :hover-rotation="0.32"
      :hover-spring="2.4"
    />

    <div class="relative z-10">
      <!-- soft landing heading over the morphed orb background -->
      <section
        data-glass-hero
        class="hero relative flex min-h-screen items-center px-6 pt-40 pb-28 sm:px-10 lg:px-24"
      >
        <div class="relative z-10 w-full max-w-5xl">
          <p
            v-reveal="{ y: 14, duration: 0.9 }"
            class="mb-10 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.4em] text-slate-500"
          >
            <span class="h-px w-12 bg-slate-700" />
            Digital craft studio
          </p>
          <h1
            class="font-display text-[clamp(2.75rem,7vw,7rem)] font-medium leading-[1.04] tracking-tight text-[#ece9e2]"
          >
            <span v-lines="{ delay: 0.1 }" class="block"
              >Websites we build,</span
            >
            <span v-reveal="{ y: 30, delay: 0.5, duration: 1.6 }" class="block">
              <span class="font-serif font-light italic text-brand-300"
                >sell</span
              >, &amp; stand behind.
            </span>
          </h1>

          <div
            v-reveal="{ delay: 0.85, duration: 1.4 }"
            class="mt-14 flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between"
          >
            <p class="max-w-md text-lg leading-relaxed text-slate-400">
              Refined, blisteringly fast websites — designed, animated, and
              sold. Quiet power, beautifully made.
            </p>
            <div class="flex shrink-0 items-center gap-3">
              <NuxtLink
                to="/showcase"
                class="btn-gradient inline-flex items-center gap-3 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em]"
              >
                The Work
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </NuxtLink>
              <NuxtLink
                to="/pricing"
                class="btn-line inline-flex items-center px-8 py-4 text-xs font-medium uppercase tracking-[0.2em]"
              >
                Pricing
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <ManifestoSection />

      <LogoMarquee parallax />
      <FeaturedShowcase />

      <StatsStrip v-stack />

      <SectionMarquee text="The Proof" reverse />
      <ProofWall v-stack />

      <SectionMarquee text="The Process" />
      <ProcessSection v-stack="{ bg: '#000000' }" v-bgmorph />

      <TestimonialsSection />

      <div data-glass-end>
        <CtaSection v-stack />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* a faint lifted glow + corner vignette gives the void depth */
.hero-glow {
  background:
    radial-gradient(
      52% 46% at 25% 30%,
      rgba(255, 255, 255, 0.06),
      transparent 70%
    ),
    radial-gradient(
      120% 90% at 50% 0%,
      transparent 55%,
      rgba(0, 0, 0, 0.55) 100%
    );
}
</style>
