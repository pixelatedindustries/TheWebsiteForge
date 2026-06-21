<script setup lang="ts">
defineProps<{
  name: string;
  index: number;
}>();
</script>

<template>
  <div class="identity-visual absolute inset-0 overflow-hidden">
    <div class="identity-grid absolute inset-0" />

    <svg
      class="identity-svg absolute inset-0 h-full w-full"
      viewBox="0 0 800 800"
      fill="none"
      aria-hidden="true"
    >
      <g class="identity-orbit identity-orbit-slow">
        <circle cx="400" cy="400" r="260" />
        <circle cx="400" cy="400" r="205" stroke-dasharray="2 12" />
        <circle cx="400" cy="140" r="7" class="identity-node" />
        <circle
          cx="195"
          cy="400"
          r="4"
          class="identity-node identity-node-dim"
        />
      </g>

      <g v-if="index % 4 === 0" class="identity-mark">
        <path d="M270 490 400 250l130 240Z" />
        <circle cx="400" cy="400" r="72" />
      </g>
      <g v-else-if="index % 4 === 1" class="identity-mark">
        <rect x="285" y="285" width="230" height="230" rx="34" />
        <path d="M285 400h230M400 285v230" />
      </g>
      <g v-else-if="index % 4 === 2" class="identity-mark">
        <circle cx="400" cy="400" r="130" />
        <path d="M270 400h260M400 270v260M308 308l184 184M492 308 308 492" />
      </g>
      <g v-else class="identity-mark">
        <path d="M250 400c75-150 225-150 300 0-75 150-225 150-300 0Z" />
        <circle cx="400" cy="400" r="58" />
      </g>
    </svg>

    <div class="identity-scan absolute inset-x-0 top-0 h-px" />
    <p
      class="identity-name absolute top-1/2 left-1/2 w-[88%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center font-display font-medium leading-none tracking-[-0.075em] text-[#ece9e2]"
    >
      {{ name }}
    </p>
    <span
      class="absolute top-[52%] left-1/2 -translate-x-1/2 font-mono text-[0.52rem] uppercase tracking-[0.42em] text-white/30"
    >
      Digital identity / {{ String(index + 1).padStart(2, "0") }}
    </span>
  </div>
</template>

<style scoped>
.identity-visual {
  container-type: inline-size;
  background:
    radial-gradient(
      circle at 50% 48%,
      rgba(255, 255, 255, 0.075),
      transparent 34%
    ),
    linear-gradient(145deg, #171614, #080808 72%);
}

.identity-grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: radial-gradient(circle at center, black, transparent 76%);
  opacity: 0.72;
  transition:
    opacity 1.8s ease,
    transform 2.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.identity-svg {
  stroke: rgba(236, 233, 226, 0.22);
  stroke-width: 1;
  transition: transform 2.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.identity-orbit {
  transform-origin: 400px 400px;
  animation: identity-spin 30s linear infinite;
}

.identity-mark {
  stroke: rgba(236, 233, 226, 0.48);
  stroke-width: 1.4;
  transform-origin: 400px 400px;
  transition:
    transform 2.1s cubic-bezier(0.16, 1, 0.3, 1),
    stroke 1.4s ease;
}

.identity-node {
  fill: #ece9e2;
  stroke: none;
}

.identity-node-dim {
  opacity: 0.35;
}

.identity-scan {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(236, 233, 226, 0.4),
    transparent
  );
  box-shadow: 0 0 25px rgba(236, 233, 226, 0.15);
  opacity: 0.35;
  animation: identity-scan 7s ease-in-out infinite;
}

.identity-name {
  font-size: clamp(2.2rem, 8.5cqw, 6.5rem);
  text-shadow: 0 12px 55px rgba(0, 0, 0, 0.75);
  transition:
    color 1.5s ease,
    text-shadow 1.8s ease;
}

:global(.group:hover) .identity-svg {
  transform: scale(1.045);
}

:global(.group:hover) .identity-mark {
  stroke: rgba(255, 255, 255, 0.72);
  transform: rotate(-6deg) scale(1.045);
}

:global(.group:hover) .identity-grid {
  opacity: 0.9;
  transform: scale(1.025);
}

:global(.group:hover) .identity-name {
  color: #fff;
  text-shadow: 0 18px 70px rgba(0, 0, 0, 0.9);
}

@keyframes identity-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes identity-scan {
  0%,
  100% {
    transform: translateY(8vh);
    opacity: 0;
  }
  20%,
  80% {
    opacity: 0.35;
  }
  50% {
    transform: translateY(60vh);
  }
}

@media (prefers-reduced-motion: reduce) {
  .identity-orbit,
  .identity-scan {
    animation: none;
  }
}
</style>
