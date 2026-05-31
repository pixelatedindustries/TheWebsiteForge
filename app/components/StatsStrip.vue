<script setup lang="ts">
import { stats as fallbackStats, type Stat } from "~~/shared/site";

// Pulls live figures from the Nitro backend (/api/stats) with an SSR-safe fallback.
const { data } = await useFetch("/api/stats", {
  default: () => ({ stats: fallbackStats }),
});

const items = computed<Stat[]>(() => data.value?.stats ?? fallbackStats);
</script>

<template>
  <section class="px-4 py-12 sm:px-6 lg:px-8">
    <div
      v-reveal:stagger="{ selector: '.stat', stagger: 0.12 }"
      class="glass-strong mx-auto grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-3xl md:grid-cols-4"
    >
      <div
        v-for="stat in items"
        :key="stat.label"
        class="stat flex flex-col items-center justify-center px-4 py-8 text-center transition-colors duration-300 hover:bg-white/4"
      >
        <span
          v-count
          class="font-display text-3xl font-bold text-gradient sm:text-4xl"
        >
          {{ stat.value }}
        </span>
        <span class="mt-2 text-sm text-slate-400">{{ stat.label }}</span>
      </div>
    </div>
  </section>
</template>
