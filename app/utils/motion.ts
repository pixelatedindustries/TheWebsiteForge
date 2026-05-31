/**
 * Returns a @vueuse/motion config for a scroll-triggered reveal.
 * Use as: `v-motion="reveal(i)"` to get a staggered entrance.
 * Auto-imported by Nuxt from `app/utils`.
 */
export function reveal(
  index = 0,
  opts: { y?: number; duration?: number; step?: number } = {},
) {
  const { y = 28, duration = 600, step = 90 } = opts;
  return {
    initial: { opacity: 0, y },
    visibleOnce: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * step,
        duration,
        ease: "easeOut",
      },
    },
  };
}
