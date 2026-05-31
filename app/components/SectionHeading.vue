<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string;
    title: string;
    subtitle?: string;
    align?: "left" | "center";
  }>(),
  { align: "center" },
);
</script>

<template>
  <div
    class="max-w-2xl"
    :class="align === 'center' ? 'mx-auto text-center' : 'text-left'"
  >
    <span
      v-if="eyebrow"
      v-reveal="{ y: 14, duration: 0.6 }"
      class="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-300"
    >
      <span class="h-1.5 w-1.5 rounded-full bg-brand-400" />
      {{ eyebrow }}
    </span>
    <h2
      v-split="{ delay: 0.08, stagger: 0.018 }"
      class="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
    >
      {{ title }}
    </h2>
    <p
      v-if="subtitle"
      v-reveal="{ delay: 0.2 }"
      class="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg"
      :class="align === 'center' ? 'mx-auto' : ''"
    >
      {{ subtitle }}
    </p>
  </div>
</template>
