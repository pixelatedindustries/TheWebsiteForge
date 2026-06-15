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
    <!-- premium ambient background — soft glowing lights behind frosted glass
         (pure CSS, replaces the WebGL orb / aurora) -->
    <AmbientGlow />

    <!-- ultra-fine film grain over the entire screen -->
    <div class="grain-fixed" aria-hidden="true" />

    <ScrollProgress v-if="!isIntro" />

    <Transition name="chrome">
      <AppHeader v-if="!isIntro" />
    </Transition>

    <main class="relative z-10 flex-1">
      <slot />
    </main>

    <AppFooter v-if="!isIntro" />

    <!-- soft bridge: seals the screen and fades to reveal /home on Enter -->
    <div
      class="pointer-events-none fixed inset-0 z-80"
      :style="{ opacity: swallow.cover, background: '#0e0d0c' }"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
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
