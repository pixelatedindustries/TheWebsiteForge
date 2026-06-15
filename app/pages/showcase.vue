<script setup lang="ts">
import {
  projectCategories,
  type Project,
  type ProjectCategory,
} from "~~/shared/site";

useSeoMeta({
  title: "Showcase — TheWebsiteForge",
  description:
    "Explore websites and digital products built by TheWebsiteForge.",
});

type Filter = "All" | ProjectCategory;
const filters: Filter[] = ["All", ...projectCategories];
const active = ref<Filter>("All");

const { data, pending } = await useFetch("/api/projects", {
  query: { category: active },
  default: () => ({ count: 0, projects: [] as Project[] }),
});

const priceLabel = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
</script>

<template>
  <main class="showcase-page min-h-screen bg-[#0e0d0c] pt-36 text-[#ece9e2]">
    <section class="px-6 sm:px-10 lg:px-20">
      <div class="mx-auto max-w-[1600px]">
        <header class="border-b border-white/10 pb-12">
          <div
            class="flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-[0.32em] text-white/35"
          >
            <span>Selected archive / 2024–2026</span>
            <span>{{ data.count }} projects</span>
          </div>
          <div class="mt-14 grid items-end gap-10 lg:grid-cols-[1fr_0.32fr]">
            <h1
              class="font-display text-[clamp(5rem,14vw,14rem)] font-medium leading-[0.72] tracking-[-0.09em]"
            >
              The<br />
              <span class="font-serif font-light italic text-brand-300"
                >work.</span
              >
            </h1>
            <div class="max-w-sm border-l border-white/15 pl-6">
              <span class="mb-5 block h-2 w-2 rounded-full bg-brand-300" />
              <p class="text-base leading-relaxed text-white/50">
                Websites and digital products shaped around identity, movement,
                and measurable business outcomes.
              </p>
            </div>
          </div>
        </header>

        <nav
          class="flex flex-wrap items-center gap-x-7 gap-y-3 border-b border-white/10 py-7"
          aria-label="Project categories"
        >
          <button
            v-for="filter in filters"
            :key="filter"
            type="button"
            class="showcase-filter font-mono text-[0.58rem] uppercase tracking-[0.24em] text-white/35 transition-colors"
            :class="{ 'is-active': active === filter }"
            @click="active = filter"
          >
            {{ filter }}
          </button>
        </nav>

        <div
          v-if="pending"
          class="grid min-h-[45vh] place-items-center font-mono text-xs uppercase tracking-[0.3em] text-white/35"
        >
          Loading archive
        </div>

        <section v-else class="showcase-grid py-16">
          <article
            v-for="(project, index) in data.projects"
            :key="project.id"
            v-reveal="{ y: 35, delay: (index % 3) * 0.05 }"
            class="showcase-project group"
            :class="index % 5 === 0 ? 'showcase-project-wide' : ''"
          >
            <div
              class="project-art relative overflow-hidden rounded-[1.5rem] border border-white/10"
              :style="`--project-index:${index}`"
            >
              <ProjectCover
                :project="project"
                class="absolute inset-0 h-full w-full scale-[1.04] transition-transform duration-1000 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.1]"
              />
              <div class="project-art-grid absolute inset-0" />
              <div
                class="project-art-ring absolute rounded-full border border-white/20"
              />
              <div
                class="project-art-frame absolute inset-[8%] rounded-xl border border-white/15"
              >
                <div
                  class="absolute inset-x-0 top-0 flex h-8 items-center justify-between border-b border-white/10 px-3"
                >
                  <span class="flex gap-1">
                    <i
                      v-for="dot in 3"
                      :key="dot"
                      class="h-1 w-1 rounded-full bg-white/35"
                    />
                  </span>
                  <span
                    class="font-mono text-[0.42rem] uppercase tracking-[0.18em] text-white/40"
                    >{{ project.id }}.com</span
                  >
                </div>
              </div>
              <div
                class="absolute inset-0 bg-gradient-to-t from-[#0e0d0c]/80 via-transparent to-transparent"
              />
              <div
                class="absolute inset-x-0 top-0 flex items-center justify-between p-5 font-mono text-[0.52rem] uppercase tracking-[0.25em] text-white/65"
              >
                <span>{{ String(index + 1).padStart(2, "0") }}</span>
                <span>{{ project.status }}</span>
              </div>
              <div
                class="absolute right-0 bottom-0 left-0 flex items-end justify-between gap-5 p-6"
              >
                <div>
                  <p
                    class="font-display text-[clamp(2rem,4vw,4.6rem)] font-medium leading-[0.9] tracking-[-0.065em]"
                  >
                    {{ project.name }}
                  </p>
                  <p
                    class="mt-2 font-mono text-[0.52rem] uppercase tracking-[0.2em] text-white/45"
                  >
                    {{ project.category }} / {{ project.year }}
                  </p>
                </div>
                <span
                  class="project-arrow grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20 bg-black/10 text-lg backdrop-blur-md"
                  >↗</span
                >
              </div>
            </div>

            <div
              class="grid gap-5 border-b border-white/10 py-5 sm:grid-cols-[1fr_auto]"
            >
              <p class="max-w-xl text-sm leading-relaxed text-white/45">
                {{ project.blurb }}
              </p>
              <div class="sm:text-right">
                <strong
                  class="block font-display text-3xl tracking-[-0.05em]"
                  >{{ project.metric }}</strong
                >
                <span
                  class="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-white/35"
                  >{{ project.metricLabel }}</span
                >
              </div>
            </div>

            <div class="mt-4 flex items-center justify-between">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in project.tags.slice(0, 3)"
                  :key="tag"
                  class="font-mono text-[0.48rem] uppercase tracking-[0.16em] text-white/30"
                  >{{ tag }}</span
                >
              </div>
              <span
                class="font-mono text-[0.52rem] uppercase tracking-[0.18em] text-white/45"
                >From {{ priceLabel(project.price) }}</span
              >
            </div>
          </article>
        </section>

        <p
          v-if="!pending && data.count === 0"
          class="py-32 text-center font-mono text-xs uppercase tracking-[0.3em] text-white/35"
        >
          No projects in this category yet
        </p>
      </div>
    </section>

    <CtaSection
      title="See one you like?"
      subtitle="Buy a ready-made build outright, or use it as the starting point for something custom."
    />
  </main>
</template>

<style scoped>
.showcase-filter {
  position: relative;
  padding-block: 0.3rem;
}

.showcase-filter::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background: #ece9e2;
  content: "";
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);
}

.showcase-filter:hover,
.showcase-filter.is-active {
  color: rgba(255, 255, 255, 0.9);
}

.showcase-filter.is-active::after {
  transform: scaleX(1);
}

.showcase-grid {
  display: grid;
  gap: 6rem 2rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.showcase-project-wide {
  grid-column: span 2;
}

.project-art {
  aspect-ratio: 4 / 3;
  background: #242321;
}

.showcase-project-wide .project-art {
  aspect-ratio: 16 / 8;
}

.project-art-grid {
  opacity: 0.22;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 4rem 4rem;
  mask-image: radial-gradient(circle at 70% 35%, black, transparent 65%);
}

.project-art-ring {
  top: calc(14% + var(--project-index) * 1%);
  right: calc(-8% + var(--project-index) * 1%);
  width: 42%;
  aspect-ratio: 1;
  box-shadow:
    inset 0 0 0 1.5rem rgba(255, 255, 255, 0.025),
    inset 0 0 0 3rem rgba(255, 255, 255, 0.018);
  transition: transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
}

.showcase-project:hover .project-art-ring {
  transform: translate(-1rem, 0.5rem) rotate(16deg);
}

.project-arrow {
  transition:
    background-color 300ms ease,
    transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
}

.showcase-project:hover .project-arrow {
  background: #ece9e2;
  color: #151412;
  transform: rotate(45deg);
}

@media (max-width: 767px) {
  .showcase-grid {
    gap: 4rem;
    grid-template-columns: 1fr;
  }

  .showcase-project-wide {
    grid-column: auto;
  }

  .showcase-project-wide .project-art,
  .project-art {
    aspect-ratio: 4 / 5;
  }
}
</style>
