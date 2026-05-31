<script setup lang="ts">
/** Thin gradient bar across the top that tracks page scroll progress. */
const bar = ref<HTMLElement | null>(null);

onMounted(() => {
  const b = bar.value;
  if (!b) return;
  let raf = 0;
  const update = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    b.style.transform = `scaleX(${p})`;
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  });
});
</script>

<template>
  <div class="fixed inset-x-0 top-0 z-[60] h-[3px]" aria-hidden="true">
    <div
      ref="bar"
      class="h-full origin-left bg-gradient-to-r from-brand-400 via-accent-400 to-accent-600"
      style="transform: scaleX(0)"
    />
  </div>
</template>
