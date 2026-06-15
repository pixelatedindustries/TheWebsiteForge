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
  <section class="px-6 py-48 sm:px-10 lg:px-24">
    <p
      v-reveal="{ y: 12, duration: 0.7 }"
      class="mb-12 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.4em] text-slate-500"
    >
      <span class="h-px w-12 bg-slate-700" />
      Start
    </p>
    <h2
      v-lines="{ delay: 0.05 }"
      class="max-w-4xl font-serif text-[clamp(2.5rem,6vw,6rem)] font-light leading-[1.05] tracking-[-0.01em] text-[#ece9e2]"
    >
      {{ title }}
    </h2>
    <div
      v-reveal="{ delay: 0.15, duration: 1.4 }"
      class="mt-16 flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between"
    >
      <p class="max-w-md text-lg leading-relaxed text-slate-400">
        {{ subtitle }}
      </p>
      <div class="flex shrink-0 items-center gap-3">
        <NuxtLink
          to="/contact"
          class="btn-gradient inline-flex items-center px-8 py-4 text-xs font-medium uppercase tracking-[0.2em]"
        >
          Get a quote
        </NuxtLink>
        <NuxtLink
          to="/showcase"
          class="btn-line inline-flex items-center px-8 py-4 text-xs font-medium uppercase tracking-[0.2em]"
        >
          The Work
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
