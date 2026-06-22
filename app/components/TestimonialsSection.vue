<script setup lang="ts">
import { testimonials } from "~~/shared/site";

const outcomes = [
  ["3×", "trial signups"],
  ["+38%", "conversion"],
  ["4×", "qualified leads"],
  ["−43%", "drop-off"],
  ["+176%", "seat activation"],
  ["−33%", "support tickets"],
  ["+41%", "average order value"],
  ["2×", "demo requests"],
];

// The section auto-advances through the client outcomes on a timer instead of
// being scroll-scrubbed, so the page scrolls straight past to the next section.
const ROTATE_MS = 5000;

const root = ref<HTMLElement | null>(null);
const activeIndex = ref(0);
const cycle = ref(0); // bumps on every (re)start/advance to restart the fill bar
const revealed = ref(false);
const activeTestimonial = computed(() => testimonials[activeIndex.value]!);
const activeOutcome = computed(() => outcomes[activeIndex.value]!);

// the orbit tilts gradually across the set as the outcomes advance
const orbitAngle = computed(() => {
  const p = activeIndex.value / Math.max(1, testimonials.length - 1);
  return `${(-20 + p * 55).toFixed(2)}deg`;
});

let reduced = false;
let timer: ReturnType<typeof setInterval> | null = null;
let io: IntersectionObserver | null = null;

const stopTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};
const startTimer = () => {
  if (reduced) return;
  stopTimer();
  cycle.value++;
  timer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % testimonials.length;
    cycle.value++;
  }, ROTATE_MS);
};

// clicking a client jumps to it and restarts the rotation from there
const selectTestimonial = (index: number) => {
  activeIndex.value = index;
  startTimer();
};

onMounted(() => {
  reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    revealed.value = true;
    return;
  }
  if (!root.value) return;
  // reveal once on entry, and only rotate while the section is on screen
  io = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        revealed.value = true;
        startTimer();
      } else {
        stopTimer();
      }
    },
    { threshold: 0.25 },
  );
  io.observe(root.value);
});

onBeforeUnmount(() => {
  stopTimer();
  io?.disconnect();
});
</script>

<template>
  <section ref="root" class="proof-shell relative">
    <div
      class="proof-stage relative min-h-screen overflow-hidden bg-[#e9e4da] text-[#151412]"
      :class="{ 'is-revealed': revealed }"
    >
      <div class="proof-grid pointer-events-none absolute inset-0" />
      <div
        class="proof-orbit pointer-events-none absolute top-1/2 right-[-20vw] hidden aspect-square w-[min(75vw,1050px)] -translate-y-1/2 rounded-full border border-black/10 lg:block"
        :style="{ rotate: orbitAngle }"
        aria-hidden="true"
      >
        <div class="absolute inset-[14%] rounded-full border border-black/10" />
        <div class="absolute inset-[31%] rounded-full border border-black/10" />
        <span class="proof-orbit-line rotate-[18deg]" />
        <span class="proof-orbit-line rotate-[112deg]" />
        <span class="proof-orbit-line rotate-[236deg]" />
      </div>

      <div
        class="relative z-10 mx-auto flex min-h-screen w-full max-w-[1760px] flex-col px-6 py-16 sm:px-10 lg:px-20"
      >
        <header
          class="flex items-center justify-between border-b border-black/20 pb-5 font-mono text-[0.6rem] uppercase tracking-[0.34em] text-black/65"
        >
          <span>Proof / Client outcomes</span>
          <span>{{ String(activeIndex + 1).padStart(2, "0") }} / 08</span>
        </header>

        <div
          class="grid flex-1 items-center gap-14 py-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.55fr)]"
        >
          <Transition name="proof-swap" mode="out-in">
            <article :key="activeTestimonial.author" class="proof-feature">
              <p
                class="proof-mark font-serif text-[clamp(6rem,13vw,13rem)] leading-[0.4] text-black/10"
                aria-hidden="true"
              >
                “
              </p>
              <blockquote
                class="max-w-5xl font-serif text-[clamp(2rem,4.35vw,4.8rem)] font-light leading-[1.04] tracking-[-0.03em]"
              >
                {{ activeTestimonial.quote }}
              </blockquote>

              <footer class="mt-12 flex items-center gap-5">
                <span
                  class="grid h-12 w-12 place-items-center rounded-full border border-black/20 bg-black text-xs font-semibold tracking-[0.16em] text-[#e9e4da]"
                >
                  {{ activeTestimonial.initials }}
                </span>
                <div>
                  <p class="text-sm font-semibold">
                    {{ activeTestimonial.author }}
                  </p>
                  <p
                    class="mt-1 text-xs uppercase tracking-[0.15em] text-black/65"
                  >
                    {{ activeTestimonial.role }} ·
                    {{ activeTestimonial.company }}
                  </p>
                </div>
              </footer>
            </article>
          </Transition>

          <aside class="relative border-l border-black/15 pl-7 lg:pl-10">
            <Transition name="metric-swap" mode="out-in">
              <div :key="activeOutcome[0]">
                <p
                  class="font-display text-[clamp(4rem,8vw,8rem)] font-semibold leading-[0.82] tracking-[-0.07em]"
                >
                  {{ activeOutcome[0] }}
                </p>
                <p
                  class="mt-6 max-w-40 font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.28em] text-black/65"
                >
                  {{ activeOutcome[1] }} after launch
                </p>
              </div>
            </Transition>
            <div class="mt-14 h-px w-full bg-black/15">
              <div
                :key="cycle"
                class="proof-progress h-px origin-left bg-black"
                :style="{ animationDuration: `${ROTATE_MS}ms` }"
              />
            </div>
            <p class="mt-5 max-w-52 text-sm leading-relaxed text-black/65">
              Outcomes measured after launch. Built beautifully, judged by what
              changed.
            </p>
          </aside>
        </div>

        <nav
          class="grid border-t border-black/15 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Client testimonials"
        >
          <button
            v-for="(testimonial, index) in testimonials"
            :key="testimonial.author"
            type="button"
            class="proof-client group flex items-center justify-between border-b border-black/15 py-4 text-left transition-opacity sm:px-5 lg:border-b-0"
            :class="activeIndex === index ? 'is-active' : ''"
            @click="selectTestimonial(index)"
          >
            <span>
              <span
                class="block font-mono text-[0.52rem] tracking-[0.25em] text-black/60"
              >
                {{ String(index + 1).padStart(2, "0") }}
              </span>
              <span
                class="mt-1 block text-xs font-semibold uppercase tracking-[0.12em]"
              >
                {{ testimonial.company }}
              </span>
            </span>
            <span class="proof-client-dot h-1.5 w-1.5 rounded-full bg-black" />
          </button>
        </nav>
      </div>
    </div>
  </section>
</template>

<style scoped>
.proof-stage {
  transform-origin: center center;
  /* one-time entrance: an inset rounded card opens to full-bleed on scroll-in */
  clip-path: inset(6% 3% 6% 3% round 2rem);
  transform: scale(0.97);
  transition:
    clip-path 1.1s cubic-bezier(0.16, 1, 0.3, 1),
    transform 1.1s cubic-bezier(0.16, 1, 0.3, 1);
}

.proof-stage.is-revealed {
  clip-path: inset(0% 0% 0% 0% round 0rem);
  transform: scale(1);
}

.proof-grid {
  opacity: 0.16;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
  background-size: 7vw 7vw;
  mask-image: radial-gradient(circle at 70% 50%, black, transparent 70%);
}

.proof-orbit {
  transition: rotate 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.proof-orbit::before {
  position: absolute;
  inset: 44%;
  border-radius: 9999px;
  background: #151412;
  content: "";
}

.proof-orbit-line {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 48%;
  height: 1px;
  transform-origin: left center;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.28), transparent);
}

/* auto-resetting fill bar — counts down to the next outcome each cycle */
.proof-progress {
  transform: scaleX(0);
  animation: proof-fill linear forwards;
}

@keyframes proof-fill {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.proof-client {
  position: relative;
  transition: background-color 300ms ease;
}

.proof-client.is-active {
  background: rgba(0, 0, 0, 0.035);
}

.proof-client::before {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: #151412;
  content: "";
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);
}

.proof-client.is-active::before {
  transform: scaleX(1);
}

.proof-client-dot {
  transform: scale(0);
  transition: transform 300ms ease;
}

.proof-client.is-active .proof-client-dot {
  transform: scale(1);
}

.proof-swap-enter-active,
.proof-swap-leave-active,
.metric-swap-enter-active,
.metric-swap-leave-active {
  transition:
    opacity 280ms ease,
    transform 500ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 350ms ease;
}

.proof-swap-enter-from {
  opacity: 0;
  filter: blur(12px);
  transform: translateY(2rem);
}

.proof-swap-leave-to {
  opacity: 0;
  filter: blur(8px);
  transform: translateY(-1.5rem);
}

.metric-swap-enter-from {
  opacity: 0;
  transform: translateY(1.5rem) scale(0.96);
}

.metric-swap-leave-to {
  opacity: 0;
  transform: translateY(-1rem) scale(1.02);
}

@media (prefers-reduced-motion: reduce) {
  .proof-stage {
    clip-path: none;
    transform: none;
    transition: none;
  }
  .proof-orbit {
    transition: none;
  }
  .proof-progress {
    animation: none;
    transform: scaleX(1);
  }
}
</style>
