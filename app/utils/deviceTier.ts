/**
 * Device-capability detection for the WebGL/canvas backgrounds (issues.md #6).
 *
 * Heavy full-screen shaders (BlackHole, AuroraField) and the LiquidOrb run
 * every frame, so on low-end GPUs / phones they cause jank and battery drain.
 * These helpers let each component scale its cost (fewer fbm octaves, lower
 * internal render scale, capped pixel ratio) without duplicating the heuristics.
 *
 * Client-only — call inside onMounted / after `import.meta.client` guards.
 */

export type DeviceTier = "low" | "high";

/**
 * Coarse low-power heuristic: few logical cores is the most reliable signal of
 * a constrained device available to the browser. Treats `prefers-reduced-motion`
 * as low so motion-sensitive users also get the cheapest path.
 */
export function getDeviceTier(): DeviceTier {
  if (typeof window === "undefined") return "high";
  const reduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (reduced || cores <= 4) return "low";
  return "high";
}

export function isLowPowerDevice(): boolean {
  return getDeviceTier() === "low";
}

/** Number of fbm noise octaves to run, by tier. Must be a GLSL loop constant. */
export function fbmOctaves(tier: DeviceTier = getDeviceTier()): number {
  return tier === "low" ? 2 : 4;
}

/**
 * Cap the renderer pixel ratio. Low-tier devices render at 1x; high-tier caps
 * at `hi` (defaults to 1.5) to avoid paying for 3x retina on full-screen quads.
 */
export function cappedPixelRatio(hi = 1.5, tier: DeviceTier = getDeviceTier()): number {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  return tier === "low" ? 1 : Math.min(dpr, hi);
}
