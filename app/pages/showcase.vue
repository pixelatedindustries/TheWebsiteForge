<script setup lang="ts">
import { projectCategories, type Project, type ProjectCategory } from "~~/shared/site";

useSeoMeta({
  title: "Showcase — Lumina Studio",
  description:
    "Browse websites we've built and sell. Filter by type, see the proof metric on each, and find one to buy or commission.",
});

type Filter = "All" | ProjectCategory;
const filters: Filter[] = ["All", ...projectCategories];
const active = ref<Filter>("All");

// Filtering happens on the Nitro backend via /api/projects?category=
const { data, pending } = await useFetch("/api/projects", {
  query: { category: active },
  default: () => ({ count: 0, projects: [] as Project[] }),
});
</script>

<template>
  <div class="px-4 pt-36 pb-10 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <SectionHeading
        eyebrow="Showcase × Proof"
        title="Websites we've built — and you can buy"
        subtitle="Every project ships with a real outcome attached. Filter by category, then grab one off the shelf or commission your own."
      />

      <!-- filter chips -->
      <div class="mt-10 flex flex-wrap justify-center gap-2">
        <button
          v-for="f in filters"
          :key="f"
          type="button"
          class="rounded-full px-4 py-2 text-sm font-medium transition"
          :class="
            active === f
              ? 'btn-gradient text-white'
              : 'glass text-slate-300 hover:bg-white/10'
          "
          @click="active = f"
        >
          {{ f }}
        </button>
      </div>

      <p class="mt-6 text-center text-sm text-slate-500">
        <span v-if="pending">Loading…</span>
        <span v-else>
          Showing {{ data.count }}
          {{ data.count === 1 ? "project" : "projects" }}
          <template v-if="active !== 'All'"> in {{ active }}</template>
        </span>
      </p>

      <!-- grid -->
      <div class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(project, i) in data.projects"
          :key="project.id"
          v-motion="reveal(i % 6, { step: 70 })"
        >
          <ShowcaseCard :project="project" />
        </div>
      </div>

      <p
        v-if="!pending && data.count === 0"
        class="py-16 text-center text-slate-400"
      >
        No projects in this category yet — check back soon.
      </p>
    </div>

    <CtaSection
      title="See one you like?"
      subtitle="Buy a ready-made build outright, or use it as the starting point for something custom. Let's talk."
    />
  </div>
</template>
