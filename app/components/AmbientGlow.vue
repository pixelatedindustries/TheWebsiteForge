<script setup lang="ts">
/**
 * AmbientGlow — the premium background visual (no WebGL / Three.js).
 * Large, soft, slow-drifting blurred radial gradients on deep charcoal: it
 * reads like soft glowing lights moving behind frosted glass. Pure CSS, fixed,
 * sits at the very back. Drift pauses under reduced-motion.
 */
// Pause the drift animations while the tab is backgrounded — a pure-CSS battery
// win on laptops (no work happens behind a hidden tab).
const hidden = ref(false);
const onVisibility = () => {
  hidden.value = document.hidden;
};
onMounted(() => {
  document.addEventListener("visibilitychange", onVisibility);
});
onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", onVisibility);
});
</script>

<template>
  <div class="ambient" :class="{ paused: hidden }" aria-hidden="true">
    <span class="orb orb-1" />
    <span class="orb orb-2" />
    <span class="orb orb-3" />
  </div>
</template>

<style scoped>
.ambient {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: var(--color-ink-950);
}
.orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(130px);
  will-change: transform;
}
.orb-1 {
  width: 58vw;
  height: 58vw;
  left: -12vw;
  top: -14vh;
  background: radial-gradient(
    circle,
    rgba(214, 207, 196, 0.16),
    transparent 68%
  );
  animation: drift-1 32s ease-in-out infinite;
}
.orb-2 {
  width: 52vw;
  height: 52vw;
  right: -14vw;
  top: 22vh;
  background: radial-gradient(
    circle,
    rgba(150, 145, 135, 0.14),
    transparent 70%
  );
  animation: drift-2 42s ease-in-out infinite;
}
.orb-3 {
  width: 46vw;
  height: 46vw;
  left: 28vw;
  bottom: -18vh;
  background: radial-gradient(
    circle,
    rgba(184, 178, 166, 0.1),
    transparent 70%
  );
  animation: drift-3 38s ease-in-out infinite;
}
@keyframes drift-1 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(7vw, 6vh) scale(1.08);
  }
}
@keyframes drift-2 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-6vw, 5vh) scale(1.12);
  }
}
@keyframes drift-3 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(5vw, -7vh) scale(0.92);
  }
}
@media (prefers-reduced-motion: reduce) {
  .orb {
    animation: none;
  }
}
.ambient.paused .orb {
  animation-play-state: paused;
}</style>
