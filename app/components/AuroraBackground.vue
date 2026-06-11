<script setup lang="ts">
// Decorative background: a live WebGL aurora field + grain + vignette.
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950"
  >
    <!-- flowing, cursor-reactive aurora shader -->
    <AuroraField />

    <!-- ultra-fine film grain for depth -->
    <div class="noise-overlay absolute inset-0" />

    <!-- vignette to keep text legible -->
    <div
      class="absolute inset-0"
      style="background: radial-gradient(ellipse 95% 75% at 50% 0%, transparent, rgba(4, 7, 13, 0.65) 82%);"
    />
  </div>
</template>
