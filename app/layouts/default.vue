<script setup lang="ts">
const route = useRoute();

// `/` is the scroll-locked intro (with the orb); `/home` and everything else is
// the normal scrolling site (no orb).
const isIntro = computed(() => route.path === "/");

// "vortex" transition (intro → /home): on Enter the black hole swirls the whole
// field down into itself and drains to black (`vortex` 0→1, drives the shader);
// `cover` is the black bridge that seals the blackness and hides the page swap,
// then fades to reveal /home.
const swallow = useState<{
  active: boolean;
  vortex: number;
  cover: number;
}>("blackHoleSwallow", () => ({
  active: false,
  vortex: 0,
  cover: 0,
}));

// lock page scroll while on the intro
watchEffect(() => {
  if (!import.meta.client) return;
  document.documentElement.classList.toggle("intro-locked", isIntro.value);
});
onBeforeUnmount(() => {
  if (import.meta.client)
    document.documentElement.classList.remove("intro-locked");
});
</script>

<template>
  <div class="relative flex min-h-screen flex-col">
    <!-- aurora is the /home backdrop; on the intro the black hole owns the canvas -->
    <AuroraBackground v-if="!isIntro" />

    <!-- intro background: gravitationally-lensed black hole (vortex on Enter).
         Solid dark bg so the container instantly covers everything from first
         paint, even before Three.js finishes loading the canvas. -->
    <ClientOnly>
      <div
        v-if="isIntro"
        class="black-hole pointer-events-none fixed inset-0 z-0"
      >
        <BlackHole />
      </div>
    </ClientOnly>

    <ScrollProgress v-if="!isIntro" />

    <Transition name="chrome">
      <AppHeader v-if="!isIntro" />
    </Transition>

    <main class="relative z-10 flex-1">
      <slot />
    </main>

    <AppFooter v-if="!isIntro" />

    <!-- black bridge: the vortex drains to black; this seals the blackness and
         hides the page swap, then fades to reveal the settled /home -->
    <div
      class="pointer-events-none fixed inset-0 z-80"
      :style="{ opacity: swallow.cover, background: '#04070d' }"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
/* intro: an instant, painted-on poster of the black hole so the page looks
   complete from the very first paint — long before the three.js bundle has even
   downloaded. The radial glow + dark core sit where the shader draws the orb
   (right-of-centre). Once the WebGL canvas mounts it fades in over the top of
   this (see BlackHole.vue), so there's no blank/dark loading gap. */
.black-hole {
  background:
    radial-gradient(
      42vmax 42vmax at 70% 50%,
      rgba(20, 90, 165, 0.3) 0%,
      rgba(12, 52, 110, 0.16) 26%,
      rgba(6, 20, 48, 0.06) 46%,
      transparent 62%
    ),
    radial-gradient(
      11vmax 11vmax at 70% 50%,
      rgba(2, 4, 9, 0.92) 0%,
      rgba(2, 4, 9, 0.55) 45%,
      transparent 72%
    ),
    #04070d;
}

.chrome-enter-active {
  transition:
    opacity 0.5s ease 0.35s,
    transform 0.5s ease 0.35s;
}
.chrome-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
