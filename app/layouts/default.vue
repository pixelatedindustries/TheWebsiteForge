<script setup lang="ts"></script>

<template>
  <div class="relative flex min-h-screen flex-col">
    <!-- premium ambient background — soft glowing lights behind frosted glass
         (pure CSS, replaces the WebGL orb / aurora) -->
    <AmbientGlow />

    <!-- ultra-fine film grain over the entire screen -->
    <div class="grain-fixed" aria-hidden="true" />

    <ScrollProgress />

    <AppHeader />

    <main class="relative z-10 flex-1">
      <slot />
    </main>

    <AppFooter />
  </div>
</template>
