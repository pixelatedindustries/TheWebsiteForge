<script setup lang="ts">
import type { Project } from "~~/shared/site";

const props = withDefaults(
  defineProps<{
    project: Project;
    showPrice?: boolean;
  }>(),
  {
    showPrice: true,
  },
);

const statusStyle: Record<Project["status"], string> = {
  Available: "bg-brand-500/15 text-brand-300 ring-brand-400/30",
  Sold: "bg-slate-500/15 text-slate-300 ring-white/15",
  Featured: "bg-accent-500/15 text-accent-300 ring-accent-400/30",
};

const priceLabel = computed(() =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(props.project.price),
);
</script>

<template>
  <article
    v-spotlight
    class="glass gradient-border group relative flex flex-col overflow-hidden rounded-2xl p-3 transition duration-300 hover:-translate-y-1.5 hover:glow-ring"
  >
    <div class="relative overflow-hidden rounded-xl">
      <ProjectCover :project="project" class="transition duration-500 group-hover:scale-[1.04]" />
      <span
        class="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 backdrop-blur-md"
        :class="statusStyle[project.status]"
      >
        {{ project.status }}
      </span>
    </div>

    <div class="flex flex-1 flex-col p-3 pt-4">
      <div class="flex items-center justify-between gap-2">
        <h3 class="font-display text-lg font-semibold text-white">
          {{ project.name }}
        </h3>
        <span class="text-xs font-medium text-slate-400">{{ project.category }}</span>
      </div>

      <p class="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-400">
        {{ project.blurb }}
      </p>

      <div class="mt-4 flex flex-wrap gap-1.5">
        <span
          v-for="tag in project.tags.slice(0, 3)"
          :key="tag"
          class="rounded-md bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-white/5"
        >
          {{ tag }}
        </span>
      </div>

      <div class="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
        <div>
          <p class="text-2xl font-bold text-gradient">{{ project.metric }}</p>
          <p class="text-xs text-slate-500">{{ project.metricLabel }}</p>
        </div>
        <div v-if="showPrice" class="text-right">
          <p class="text-xs text-slate-500">from</p>
          <p class="text-sm font-semibold text-white">{{ priceLabel }}</p>
        </div>
      </div>
    </div>
  </article>
</template>
