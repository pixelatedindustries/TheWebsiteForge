<script setup lang="ts">
/**
 * Block-shutter section reveal — the signature awwwards transition.
 *
 * The section starts hidden behind a solid monochrome slab. On scroll-in the
 * slab splits into N vertical bars that lift away in a staggered sweep, while
 * the content beneath settles up from a slight scale + offset. Reads as a
 * panel snapping open into columns.
 *
 * Accessible / SSR-safe: the overlay is painted only on the client when motion
 * is allowed, so no-JS and reduced-motion users see the content directly with
 * no covering slab and no flash.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const props = withDefaults(
  defineProps<{
    panels?: number;
    color?: "black" | "white";
    from?: "top" | "bottom";
    start?: string;
  }>(),
  { panels: 7, color: "black", from: "bottom", start: "top 74%" },
);

const root = ref<HTMLElement | null>(null);
const overlay = ref<HTMLElement | null>(null);
let st: ScrollTrigger | null = null;
let tl: gsap.core.Timeline | null = null;

onBeforeUnmount(() => {
  st?.kill();
  tl?.kill();
});

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = root.value;
  const ov = overlay.value;
  if (!el || !ov) return;
  const bars = Array.from(ov.children) as HTMLElement[];
  const inner = el.querySelector<HTMLElement>(".block-reveal-inner");

  // cover synchronously so there's no flash of the bare content first
  gsap.set(ov, { autoAlpha: 1 });
  gsap.set(bars, { yPercent: 0 });
  if (inner) gsap.set(inner, { autoAlpha: 0 });

  const reveal = () => {
    tl = gsap.timeline({
      onComplete: () => gsap.set(ov, { display: "none" }),
    });
    if (inner) gsap.set(inner, { autoAlpha: 1 });
    tl.to(bars, {
      yPercent: props.from === "bottom" ? -101 : 101,
      duration: 0.95,
      ease: "power4.inOut",
      stagger: { each: 0.06, from: "start" },
    });
    if (inner)
      tl.from(
        inner,
        { yPercent: 8, scale: 1.05, duration: 1.1, ease: "power3.out" },
        0.12,
      );
  };

  const rect = el.getBoundingClientRect();
  const alreadyPast = rect.top < window.innerHeight * 0.2;
  if (alreadyPast) {
    // scrolled in before hydration finished — just show it, no replay
    gsap.set(ov, { display: "none" });
    if (inner) gsap.set(inner, { autoAlpha: 1 });
    return;
  }

  st = ScrollTrigger.create({
    trigger: el,
    start: props.start,
    once: true,
    onEnter: reveal,
  });
});
</script>

<template>
  <div ref="root" class="block-reveal relative">
    <div class="block-reveal-inner">
      <slot />
    </div>
    <div
      ref="overlay"
      aria-hidden="true"
      class="block-reveal-overlay"
      :data-color="color"
    >
      <span v-for="n in panels" :key="n" class="block-reveal-bar" />
    </div>
  </div>
</template>

<style scoped>
.block-reveal {
  position: relative;
}
.block-reveal-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  overflow: hidden;
  pointer-events: none;
  /* hidden by default → content is visible for SSR / no-JS / reduced-motion */
  visibility: hidden;
}
.block-reveal-bar {
  flex: 1 1 0;
  /* slight overscan so adjacent bars never reveal a hairline seam */
  height: 102%;
  margin-top: -1%;
  background: #000;
}
.block-reveal-overlay[data-color="white"] .block-reveal-bar {
  background: #f5f5f5;
}
</style>
