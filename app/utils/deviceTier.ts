/**
 * Device-capability detection for the WebGL/canvas backgrounds (issues.md #6).
 *
 * Heavy full-screen shaders (BlackHole, AuroraField) and the LiquidOrb run
 * every frame, so on low-end GPUs / phones they cause jank and battery drain.
 * These helpers let each component scale its cost (fewer fbm octaves, lower
 * internal render scale, capped pixel ratio) — or bail out of the per-frame
 * loop entirely — without duplicating the heuristics.
 *
 * Client-only — call inside onMounted / after `import.meta.client` guards.
 */

export type DeviceTier = "low" | "high";

type NavigatorWithCapabilities = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

// The heuristic is stable for the lifetime of the page, so compute it once and
// reuse it. Recomputing on every component mount is wasteful and could disagree
// with itself if `matchMedia` changes mid-session.
let cachedTier: DeviceTier | null = null;

// Capability thresholds — at or below any of these, a device reads as "low".
const LOW_MEMORY_GB = 4;
const LOW_CORE_COUNT = 4;
const MOBILE_LOW_CORE_COUNT = 6;
// Optimistic fallbacks for when the browser doesn't expose the capability, so
// we don't wrongly downgrade a capable device that simply withholds the metric.
const ASSUMED_CORES = 8;
const ASSUMED_MEMORY_GB = 8;

/**
 * Coarse device classification. A device is treated as **low** when any of the
 * following hold, since each is a strong signal of a constrained device:
 *
 *  - `prefers-reduced-motion` is set (also covers motion-sensitive users)
 *  - `navigator.deviceMemory` ≤ 4 GB (low-RAM phones / cheap laptops)
 *  - `navigator.hardwareConcurrency` ≤ 4 logical cores
 *  - the Network Information API reports Data Saver / 2g-3g
 *  - the UA looks like a phone/tablet AND has limited cores
 *
 * Everything else is treated as **high** (a device with a real GPU / decent CPU).
 */
export function getDeviceTier(): DeviceTier {
  if (cachedTier) return cachedTier;
  if (typeof window === "undefined") return "high";

  const nav = navigator as NavigatorWithCapabilities;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cores = nav.hardwareConcurrency ?? ASSUMED_CORES;
  const memory = nav.deviceMemory ?? ASSUMED_MEMORY_GB;
  const saveData = nav.connection?.saveData === true;
  const slowNetwork = /(^|-)(2g|slow-2g|3g)$/.test(
    nav.connection?.effectiveType ?? "",
  );
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent ?? "");

  const isLow =
    reduced ||
    memory <= LOW_MEMORY_GB ||
    cores <= LOW_CORE_COUNT ||
    saveData ||
    slowNetwork ||
    (isMobile && cores <= MOBILE_LOW_CORE_COUNT);

  cachedTier = isLow ? "low" : "high";
  return cachedTier;
}

export function isLowPowerDevice(): boolean {
  return getDeviceTier() === "low";
}

/** Whether the user has explicitly requested reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Single source of truth for "should expensive, per-frame motion be disabled?".
 * True when the user asked for reduced motion **or** the device is low-end.
 * Heavy components use this to skip their animation loops (rendering a single
 * static frame instead) so low-end devices stay responsive.
 */
export function shouldReduceMotion(): boolean {
  return prefersReducedMotion() || getDeviceTier() === "low";
}

/** Number of fbm noise octaves to run, by tier. Must be a GLSL loop constant. */
export function fbmOctaves(tier: DeviceTier = getDeviceTier()): number {
  return tier === "low" ? 2 : 4;
}

/**
 * Cap the renderer pixel ratio. Low-tier devices render at 1x; high-tier caps
 * at `hi` (defaults to 1.5) to avoid paying for 3x retina on full-screen quads.
 */
export function cappedPixelRatio(
  hi = 1.5,
  tier: DeviceTier = getDeviceTier(),
): number {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  return tier === "low" ? 1 : Math.min(dpr, hi);
}
