<script setup lang="ts">
/**
 * Giant outlined chapter divider — oversized hollow display type that drifts
 * sideways as the page scrolls through it (scrub-driven, so it tracks the
 * scroll 1:1 and reverses with it). Pure typography as decoration; reads as
 * an engraved chapter mark between sections on a monochrome site.
 */
import gsap from "gsap";

const props = withDefaults(
  defineProps<{ text: string; reverse?: boolean; speed?: number }>(),
  { reverse: false, speed: 22 },
);

const strip = ref<HTMLElement | null>(null);
const ruleTop = ref<HTMLElement | null>(null);
const ruleBot = ref<HTMLElement | null>(null);
const tweens: Array<gsap.core.Tween> = [];

onBeforeUnmount(() => {
  tweens.forEach((t) => {
    t.scrollTrigger?.kill();
    t.kill();
  });
});

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = strip.value;
  if (!el) return;

  // drift the giant text sideways, scrubbed to scroll (tracks + reverses)
  tweens.push(
    gsap.fromTo(
      el,
      { xPercent: props.reverse ? -props.speed : 0 },
      {
        xPercent: props.reverse ? 0 : -props.speed,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    ),
  );

  // hairlines draw across, framing the text, as the divider enters
  const rules = [ruleTop.value, ruleBot.value].filter(Boolean) as HTMLElement[];
  rules.forEach((r, i) => {
    tweens.push(
      gsap.fromTo(
        r,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.1,
          ease: "power4.out",
          delay: i * 0.08,
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        },
      ),
    );
  });
});

// enough copies that the strip always overflows the viewport
const copies = computed(() => Array.from({ length: 4 }, () => props.text));
</script>

<template>
  <div
    class="pointer-events-none relative select-none overflow-hidden py-6 lg:py-10"
    aria-hidden="true"
  >
    <span ref="ruleTop" class="rule" />
    <div
      v-skew="0.12"
      ref="strip"
      class="marquee-strip flex w-max items-center gap-[6vw]"
    >
      <span
        v-for="(copy, i) in copies"
        :key="`${copy}-${i}`"
        class="marquee-word"
      >
        {{ copy }}
      </span>
    </div>
    <span ref="ruleBot" class="rule" />
  </div>
</template>

<style scoped>
.marquee-word {
  font-family: var(--font-display);
  font-size: clamp(5rem, 15vw, 14rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  white-space: nowrap;
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.3);
}
/* every other copy is filled but ghost-faint — gives the strip rhythm */
.marquee-word:nth-child(even) {
  -webkit-text-stroke: 0;
  color: rgba(255, 255, 255, 0.06);
}

/* hairlines framing the giant text; scaleX-drawn on enter (see script) */
.rule {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.18);
  transform: scaleX(0);
  transform-origin: left center;
}
.rule:first-of-type {
  top: 0;
}
.rule:last-of-type {
  bottom: 0;
}
</style>
