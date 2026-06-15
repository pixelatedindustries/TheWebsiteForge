<script setup lang="ts">
useSeoMeta({
  title: "TheWebsiteForge — Websites We Build, Sell, and Stand Behind",
  description:
    "Premium, fast, beautifully animated websites we build and sell. Browse the showcase, see the proof, and pick a plan.",
});

const services = [
  "Website Hosting",
  "Domain Management",
  "Website Creation",
  "Digital Strategy",
];
const activeService = ref(0);
let serviceTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  serviceTimer = setInterval(() => {
    activeService.value = (activeService.value + 1) % services.length;
  }, 2400);
});

onBeforeUnmount(() => {
  if (serviceTimer) clearInterval(serviceTimer);
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
            <div
              class="service-shuffle max-w-xl"
              aria-label="Our services: Website Hosting, Domain Management, Website Creation, Digital Strategy"
            >
              <span
                class="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-slate-500"
              >
                What we do
              </span>
              <div class="mt-3 flex items-baseline gap-4 overflow-hidden">
                <span
                  class="w-7 shrink-0 font-mono text-[0.62rem] tracking-[0.2em] text-slate-600"
                >
                  {{ String(activeService + 1).padStart(2, "0") }}
                </span>
                <Transition name="service-shuffle" mode="out-in">
                  <p
                    :key="services[activeService]"
                    class="font-display text-[clamp(1.65rem,3vw,2.8rem)] font-medium leading-none tracking-[-0.045em] text-slate-300"
                  >
                    {{ services[activeService] }}
                  </p>
                </Transition>
              </div>
              <div class="mt-4 flex gap-1.5 pl-11" aria-hidden="true">
                <span
                  v-for="(_, index) in services"
                  :key="index"
                  class="h-px transition-all duration-700"
                  :class="
                    index === activeService
                      ? 'w-8 bg-slate-300'
                      : 'w-3 bg-slate-700'
                  "
                />
              </div>
            </div>
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

.service-shuffle {
  min-height: 6.5rem;
}

.service-shuffle-enter-active,
.service-shuffle-leave-active {
  transition:
    transform 0.65s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.45s ease,
    filter 0.65s ease;
}

.service-shuffle-enter-from {
  transform: translateY(115%);
  opacity: 0;
  filter: blur(8px);
}

.service-shuffle-leave-to {
  transform: translateY(-115%);
  opacity: 0;
  filter: blur(8px);
}

@media (prefers-reduced-motion: reduce) {
  .service-shuffle-enter-active,
  .service-shuffle-leave-active {
    transition: none;
  }
}
</style>
