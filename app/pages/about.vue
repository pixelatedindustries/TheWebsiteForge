<script setup lang="ts">
useSeoMeta({
  title: "About — Lumina Studio",
  description:
    "Lumina Studio is a small team obsessed with fast, beautiful, conversion-focused websites — built to sell and built to last.",
});

const values = [
  {
    title: "Speed is a feature",
    body: "Every build targets 95+ Lighthouse. Fast sites rank better, convert better, and feel premium.",
  },
  {
    title: "Motion with meaning",
    body: "Animation should guide attention, not distract. We use it to make interfaces feel alive and intentional.",
  },
  {
    title: "You own everything",
    body: "Full source, assets, and deployment handed over. No proprietary builders, no lock-in, no surprises.",
  },
  {
    title: "Proof over promises",
    body: "We attach a real metric to our work. If it didn't move a number, it isn't done.",
  },
];
</script>

<template>
  <div>
    <!-- intro -->
    <section class="px-4 pt-36 pb-12 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-4xl text-center">
        <SectionHeading
          eyebrow="About us"
          title="A studio for websites worth selling"
          subtitle="We're a compact, senior team that designs, builds, and sells production-grade websites. We sweat the details so your site loads fast, looks unreal, and earns its keep."
        />
      </div>
    </section>

    <StatsStrip />

    <!-- values -->
    <section class="px-4 py-20 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <SectionHeading
          align="left"
          eyebrow="What we value"
          title="Principles behind every build"
        />
        <div class="mt-12 grid gap-6 sm:grid-cols-2">
          <div
            v-for="(value, i) in values"
            :key="value.title"
            v-motion="reveal(i)"
            class="glass gradient-border rounded-2xl p-7"
          >
            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-600/20 ring-1 ring-white/10"
            >
              <span class="font-display text-lg font-bold text-gradient">
                {{ String(i + 1).padStart(2, "0") }}
              </span>
            </div>
            <h3 class="mt-4 font-display text-lg font-semibold text-white">
              {{ value.title }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-400">
              {{ value.body }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <ProcessSection />
    <TestimonialsSection />
    <CtaSection />
  </div>
</template>
