<script setup lang="ts">
const visible = ref(true);
const leaving = ref(false);
const progress = ref(0);
const rockSceneReady = useState<boolean>("rock-scene-ready", () => true);
const rockSceneRequired = useState<boolean>("rock-scene-required", () => false);

let raf = 0;
let disposed = false;

function waitForWindowLoad() {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise<void>((resolve) => {
    window.addEventListener("load", () => resolve(), { once: true });
  });
}

function waitForRockScene() {
  return new Promise<void>((resolve) => {
    const started = performance.now();
    const check = () => {
      const glassPageExists = Boolean(
        document.querySelector("[data-glass-page]"),
      );
      if (
        disposed ||
        (!rockSceneRequired.value && !glassPageExists) ||
        (rockSceneRequired.value && rockSceneReady.value) ||
        performance.now() - started > 8000
      ) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}

onMounted(async () => {
  document.documentElement.classList.add("site-loading");
  const started = performance.now();

  // Real load gates — no artificial minimum; we reveal the page as soon as
  // these are actually ready (rock scene is itself capped at 8s as a safety).
  const gates = [
    waitForWindowLoad(),
    document.fonts?.ready ?? Promise.resolve(),
    waitForRockScene(),
  ];
  let done = 0;
  for (const gate of gates) void Promise.resolve(gate).then(() => (done += 1));

  const animateProgress = () => {
    const elapsed = performance.now() - started;
    // The bar is driven by how many load gates have actually cleared, so it
    // moves fast on a quick load and slow on a heavy one. A decelerating time
    // creep (asymptotes toward 90) fills the gaps so it never stalls or jumps
    // from a standstill while a gate is still pending.
    const real = (done / gates.length) * 100;
    const creep = 90 * (1 - Math.exp(-elapsed / 1400));
    const target = Math.min(97, Math.max(real, creep));
    progress.value += (target - progress.value) * 0.07;
    if (!disposed && !leaving.value)
      raf = requestAnimationFrame(animateProgress);
  };
  raf = requestAnimationFrame(animateProgress);

  await Promise.all(gates);

  if (disposed) return;
  cancelAnimationFrame(raf);
  progress.value = 100;
  await new Promise((resolve) => window.setTimeout(resolve, 220));
  leaving.value = true;
  document.documentElement.classList.remove("site-loading");
  await new Promise((resolve) => window.setTimeout(resolve, 950));
  visible.value = false;
});

onBeforeUnmount(() => {
  disposed = true;
  cancelAnimationFrame(raf);
  document.documentElement.classList.remove("site-loading");
});
</script>

<template>
  <div
    v-if="visible"
    class="site-loader"
    :class="{ 'site-loader--leaving': leaving }"
    role="status"
    aria-live="polite"
    aria-label="Loading TheWebsiteForge"
  >
    <div class="loader-status">
      <span aria-hidden="true" />
      Loading experience
    </div>

    <div class="loader-meta">
      <span>Loading</span>
      <span>{{ Math.round(progress).toString().padStart(3, "0") }}</span>
    </div>
    <div class="loader-rail" aria-hidden="true">
      <span :style="{ transform: `scaleX(${progress / 100})` }" />
    </div>
  </div>
</template>

<style scoped>
.site-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: #fff;
  background: #000;
  transition:
    clip-path 0.95s cubic-bezier(0.76, 0, 0.24, 1),
    opacity 0.45s ease 0.45s;
  clip-path: inset(0 0 0 0);
}

.site-loader--leaving {
  clip-path: inset(0 0 100% 0);
  opacity: 0;
}

.loader-status {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.48);
}

.loader-status span {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #fff;
  animation: loader-pulse 1.4s ease-in-out infinite;
}

.loader-meta,
.loader-rail {
  position: absolute;
  right: clamp(24px, 4vw, 72px);
  bottom: clamp(30px, 5vw, 72px);
  left: clamp(24px, 4vw, 72px);
}

.loader-meta {
  bottom: calc(clamp(30px, 5vw, 72px) + 16px);
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.36);
}

.loader-rail {
  height: 1px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
}

.loader-rail span {
  display: block;
  width: 100%;
  height: 100%;
  transform-origin: left;
  background: #fff;
  transition: transform 0.3s ease-out;
}

@keyframes loader-pulse {
  50% {
    transform: scale(2);
    opacity: 0.3;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loader-status span {
    animation: none;
  }
}
</style>
