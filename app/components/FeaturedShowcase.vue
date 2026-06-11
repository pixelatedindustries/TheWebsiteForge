<script setup lang="ts">
import { projects } from "~~/shared/site";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const featured = projects.slice(0, 5);

const section = ref<HTMLElement | null>(null);
const track = ref<HTMLElement | null>(null);
const progress = ref<HTMLElement | null>(null);

let mounted = false;
let mm: gsap.MatchMedia | null = null;

onBeforeUnmount(() => {
  mounted = false;
  mm?.revert();
});

onMounted(() => {
  mounted = true;

  const setup = () => {
    if (!mounted || mm) return;
    // Desktop + motion-OK only: pin the section and scrub the cards horizontally.
    mm = gsap.matchMedia();
    mm.add(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      () => {
        const sec = section.value;
        const tr = track.value;
        if (!sec || !tr) return;

        const distance = () => Math.max(0, tr.scrollWidth - window.innerWidth);
        const tween = gsap.to(tr, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: sec,
            start: "top top",
            end: () => "+=" + distance(),
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) =>
              progress.value &&
              gsap.set(progress.value, { scaleX: self.progress }),
          },
        });
        return () => tween.kill();
      },
    );
  };

  requestAnimationFrame(() => {
    setup();
    setTimeout(() => ScrollTrigger.refresh(true), 120);
  });
});
</script>

<template>
  <!-- ───────── Desktop: pinned horizontal scroll ───────── -->
  <section ref="section" class="relative hidden h-screen lg:block">
    <div class="flex h-full items-center overflow-hidden">
      <div
        ref="track"
        class="flex h-full items-center gap-10 pr-[10vw] pl-[max(2rem,8vw)] will-change-transform"
      >
        <!-- intro panel -->
        <div class="w-[36vw] shrink-0">
          <SectionHeading
            align="left"
            eyebrow="Showcase × Proof"
            title="Work that earns its keep"
            subtitle="Each build ships with a real metric attached. Scroll across a few favourites — every one is buyable or buildable."
          />
          <NuxtLink
            v-magnetic="0.4"
            to="/showcase"
            class="glass mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            View all work
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </NuxtLink>
        </div>

        <!-- cards -->
        <div
          v-for="(project, i) in featured"
          :key="project.id"
          v-tilt
          class="w-[clamp(20rem,30vw,28rem)] shrink-0"
        >
          <span
            class="mb-3 block font-display text-sm font-semibold text-white/30"
          >
            0{{ i + 1 }} — {{ project.category }}
          </span>
          <ShowcaseCard :project="project" :show-price="false" />
        </div>
      </div>
    </div>

    <!-- scrub progress bar -->
    <div class="absolute inset-x-[8vw] bottom-10 h-px bg-white/10">
      <div
        ref="progress"
        class="h-full origin-left scale-x-0 bg-gradient-to-r from-brand-400 to-accent-400"
      />
    </div>
  </section>

  <!-- ───────── Mobile / reduced-motion: classic grid ───────── -->
  <section class="px-4 py-20 sm:px-6 lg:hidden">
    <div class="mx-auto max-w-7xl">
      <div class="flex flex-col items-end justify-between gap-6 sm:flex-row">
        <SectionHeading
          align="left"
          eyebrow="Showcase × Proof"
          title="Work that earns its keep"
          subtitle="Each build ships with a real metric attached. These are a few of our favourites — every one is buyable or buildable."
        />
        <NuxtLink
          v-reveal="{ y: 20 }"
          to="/showcase"
          class="glass inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          View all work
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </NuxtLink>
      </div>

      <div
        v-reveal:stagger="{ selector: '.card', stagger: 0.14 }"
        class="mt-12 grid gap-6 sm:grid-cols-2"
      >
        <div v-for="project in featured" :key="project.id" class="card">
          <ShowcaseCard :project="project" :show-price="false" />
        </div>
      </div>
    </div>
  </section>
</template>
