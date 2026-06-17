import { getDeviceTier, type DeviceTier } from "~/utils/deviceTier";

/**
 * Detects the device tier once on the client and publishes it everywhere:
 *
 *  - a `tier-low` / `tier-high` class + `data-device-tier` attribute on <html>,
 *    so CSS can cheaply switch off decorative animations (see main.css and the
 *    AmbientGlow component) without any JS per element.
 *  - shared Nuxt state (`device-tier`) read by `useDeviceTier()` so components
 *    can reactively skip mounting expensive WebGL backgrounds on low-end gear.
 *
 * Runs client-only (`.client`) because the heuristic needs real navigator /
 * matchMedia values that don't exist during SSR.
 */
export default defineNuxtPlugin(() => {
  const tier = getDeviceTier();
  const tierState = useState<DeviceTier>("device-tier", () => tier);
  tierState.value = tier;

  const root = document.documentElement;
  root.classList.add(tier === "low" ? "tier-low" : "tier-high");
  root.dataset.deviceTier = tier;
});
