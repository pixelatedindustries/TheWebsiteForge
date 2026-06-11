<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
  }>(),
  {
    title: "Ready to launch something stunning?",
    subtitle:
      "Buy a ready-made build or commission a custom one. Either way, you'll be live faster than you think.",
  },
);
</script>

<template>
  <section class="px-4 py-20 sm:px-6 lg:px-8">
    <div
      v-reveal="{ y: 50 }"
      class="gradient-border glow-ring relative mx-auto max-w-5xl overflow-hidden rounded-4xl px-6 py-16 text-center sm:px-12"
    >
      <!-- internal glow (breathing) -->
      <div
        class="animate-pulse-glow absolute inset-0 -z-10"
        style="
          background:
            radial-gradient(
              60% 60% at 30% 20%,
              rgba(20, 184, 138, 0.25),
              transparent 70%
            ),
            radial-gradient(
              60% 60% at 75% 80%,
              rgba(31, 155, 240, 0.28),
              transparent 70%
            );
        "
      />
      <div class="absolute inset-0 -z-10 glass-strong" />

      <h2
        class="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
      >
        {{ title }}
      </h2>
      <p class="mx-auto mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
        {{ subtitle }}
      </p>
      <div
        class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
      >
        <NuxtLink
          v-magnetic="0.5"
          to="/contact"
          class="btn-gradient inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold text-white sm:w-auto"
        >
          Get a free quote
        </NuxtLink>
        <NuxtLink
          v-magnetic="0.35"
          to="/showcase"
          class="glass inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
        >
          Browse the showcase
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
