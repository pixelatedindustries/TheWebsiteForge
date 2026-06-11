<script setup lang="ts">
import { processSteps } from "~~/shared/site";

const visualSteps = computed(() =>
  processSteps.map((step, index) => ({
    ...step,
    tone: [
      "from-brand-400/30 via-cyan-300/15 to-transparent",
      "from-accent-400/30 via-brand-300/15 to-transparent",
      "from-sky-400/30 via-brand-400/15 to-transparent",
      "from-emerald-300/30 via-accent-400/15 to-transparent",
    ][index],
    icon: ["radar", "prototype", "terminal", "rocket"][index],
  })),
);
</script>

<template>
  <section class="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
    <div
      aria-hidden="true"
      class="absolute inset-x-0 top-20 mx-auto h-80 max-w-5xl rounded-full bg-brand-500/10 blur-3xl"
    />
    <div
      aria-hidden="true"
      class="process-grid absolute inset-0 opacity-[0.18]"
    />

    <div class="relative mx-auto max-w-7xl">
      <SectionHeading
        eyebrow="How we work"
        title="From idea to live in four steps"
        subtitle="A tight, transparent process. You see progress every step, and there are no black boxes."
      />

      <div class="relative mt-16">
        <div
          aria-hidden="true"
          class="process-rail absolute left-6 right-6 top-24 hidden h-px lg:block"
        />

        <ol class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <li
            v-for="(step, index) in visualSteps"
            :key="step.step"
            v-tilt="{ max: 7 }"
            class="process-card group relative min-h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl transition duration-500 hover:-translate-y-2 hover:border-brand-300/50 hover:shadow-brand-500/20"
            :style="{ animationDelay: `${index * 110}ms` }"
          >
            <div
              aria-hidden="true"
              class="absolute inset-x-0 top-0 h-32 bg-gradient-to-b opacity-80 transition duration-500 group-hover:opacity-100"
              :class="step.tone"
            />
            <div
              aria-hidden="true"
              class="absolute -right-16 -top-16 h-36 w-36 rounded-full border border-white/10 bg-white/[0.03] transition duration-500 group-hover:scale-125 group-hover:border-brand-300/30"
            />
            <div
              aria-hidden="true"
              class="absolute bottom-0 left-0 h-28 w-full translate-y-10 bg-gradient-to-t from-brand-500/10 to-transparent opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100"
            />

            <div class="relative flex items-start justify-between gap-4">
              <span
                class="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-display text-xs font-bold tracking-[0.22em] text-brand-200 shadow-lg shadow-brand-500/10"
              >
                {{ step.step }}
              </span>
              <span
                class="process-pulse relative grid h-4 w-4 place-items-center rounded-full bg-brand-300"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-slate-950" />
              </span>
            </div>

            <div class="relative mt-8 grid place-items-center">
              <div
                class="process-orbit absolute h-36 w-36 rounded-full border border-dashed border-brand-300/30"
              />
              <div
                class="relative grid h-28 w-28 place-items-center rounded-2xl border border-white/10 bg-slate-950/70 shadow-2xl shadow-brand-500/20 transition duration-500 group-hover:scale-105 group-hover:border-brand-300/40"
              >
                <svg
                  v-if="step.icon === 'radar'"
                  class="h-16 w-16 text-brand-200"
                  viewBox="0 0 80 80"
                  fill="none"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r="25"
                    stroke="currentColor"
                    stroke-width="3"
                    opacity=".35"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="14"
                    stroke="currentColor"
                    stroke-width="3"
                    opacity=".5"
                  />
                  <path
                    class="svg-sweep"
                    d="M40 40 60 24"
                    stroke="currentColor"
                    stroke-width="4"
                    stroke-linecap="round"
                  />
                  <circle cx="53" cy="29" r="4" fill="currentColor" />
                  <circle cx="40" cy="40" r="3" fill="currentColor" />
                </svg>
                <svg
                  v-else-if="step.icon === 'prototype'"
                  class="h-16 w-16 text-cyan-200"
                  viewBox="0 0 80 80"
                  fill="none"
                >
                  <rect
                    x="16"
                    y="18"
                    width="48"
                    height="38"
                    rx="8"
                    stroke="currentColor"
                    stroke-width="3"
                  />
                  <path
                    d="M16 30h48"
                    stroke="currentColor"
                    stroke-width="3"
                    opacity=".45"
                  />
                  <path
                    class="svg-draw"
                    d="M27 44h13M27 50h25"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                  />
                  <path
                    d="M49 40l10 10-8 2 2 8-10-10 8-2-2-8Z"
                    fill="currentColor"
                  />
                </svg>
                <svg
                  v-else-if="step.icon === 'terminal'"
                  class="h-16 w-16 text-sky-200"
                  viewBox="0 0 80 80"
                  fill="none"
                >
                  <rect
                    x="14"
                    y="18"
                    width="52"
                    height="44"
                    rx="8"
                    stroke="currentColor"
                    stroke-width="3"
                  />
                  <path
                    d="M25 37l8 7-8 7"
                    stroke="currentColor"
                    stroke-width="4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    class="svg-draw"
                    d="M40 51h15"
                    stroke="currentColor"
                    stroke-width="4"
                    stroke-linecap="round"
                  />
                  <circle
                    cx="26"
                    cy="28"
                    r="2"
                    fill="currentColor"
                    opacity=".65"
                  />
                  <circle
                    cx="34"
                    cy="28"
                    r="2"
                    fill="currentColor"
                    opacity=".65"
                  />
                </svg>
                <svg
                  v-else
                  class="h-16 w-16 text-emerald-200"
                  viewBox="0 0 80 80"
                  fill="none"
                >
                  <path
                    class="svg-float"
                    d="M42 12c10 7 15 18 13 31l-9 9-18-18 9-9c2-5 3-9 5-13Z"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M28 34l-10 4 8 8M46 52l-4 10-8-8"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    opacity=".65"
                  />
                  <circle
                    cx="45"
                    cy="31"
                    r="5"
                    stroke="currentColor"
                    stroke-width="3"
                  />
                  <path
                    class="svg-flame"
                    d="M30 55c-4 2-7 5-9 10 5-1 9-3 12-7"
                    stroke="currentColor"
                    stroke-width="4"
                    stroke-linecap="round"
                  />
                </svg>
              </div>
            </div>

            <div class="relative mt-9">
              <h3 class="font-display text-xl font-semibold text-white">
                {{ step.title }}
              </h3>
              <p class="mt-3 text-sm leading-relaxed text-slate-400">
                {{ step.description }}
              </p>
            </div>

            <div
              v-if="index < visualSteps.length - 1"
              aria-hidden="true"
              class="absolute -right-3 top-24 hidden h-6 w-6 rotate-45 border-r border-t border-brand-300/40 bg-slate-950 lg:block"
            />
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

<style scoped>
.process-grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: radial-gradient(circle at 50% 35%, black, transparent 72%);
}

.process-rail {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(52, 216, 166, 0.75),
    rgba(31, 155, 240, 0.75),
    transparent
  );
}

.process-rail::after {
  animation: rail-scan 3.8s ease-in-out infinite;
  background: linear-gradient(90deg, transparent, white, transparent);
  content: "";
  height: 1px;
  left: 0;
  opacity: 0.9;
  position: absolute;
  top: 0;
  width: 22%;
}

.process-card::before {
  background: linear-gradient(
    135deg,
    transparent,
    rgba(255, 255, 255, 0.18),
    transparent
  );
  content: "";
  height: 180%;
  left: -80%;
  opacity: 0;
  position: absolute;
  top: -40%;
  transform: rotate(18deg);
  transition:
    left 700ms ease,
    opacity 300ms ease;
  width: 45%;
}

.process-card {
  animation: card-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.process-card:hover::before {
  left: 130%;
  opacity: 1;
}

.process-orbit {
  animation: orbit-spin 18s linear infinite;
}

.process-pulse::before {
  animation: pulse-ring 1.9s ease-out infinite;
  border: 1px solid rgba(52, 216, 166, 0.55);
  border-radius: 999px;
  content: "";
  inset: -8px;
  position: absolute;
}

.svg-sweep {
  animation: sweep 2.8s ease-in-out infinite;
  transform-origin: 40px 40px;
}

.svg-draw {
  animation: dash 2.4s ease-in-out infinite;
  stroke-dasharray: 42;
}

.svg-float {
  animation: float-rocket 2.8s ease-in-out infinite;
}

.svg-flame {
  animation: flame 900ms ease-in-out infinite alternate;
}

@keyframes rail-scan {
  0% {
    transform: translateX(-30%);
  }
  55%,
  100% {
    transform: translateX(460%);
  }
}

@keyframes card-rise {
  from {
    opacity: 0;
    transform: translateY(34px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes orbit-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse-ring {
  0% {
    opacity: 0.9;
    transform: scale(0.55);
  }
  100% {
    opacity: 0;
    transform: scale(1.8);
  }
}

@keyframes sweep {
  0%,
  100% {
    transform: rotate(-25deg);
  }
  50% {
    transform: rotate(35deg);
  }
}

@keyframes dash {
  0% {
    stroke-dashoffset: 42;
  }
  50%,
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes float-rocket {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes flame {
  from {
    opacity: 0.45;
    transform: translate(1px, -1px);
  }
  to {
    opacity: 1;
    transform: translate(-1px, 1px);
  }
}
</style>
