import { getDeviceTier, type DeviceTier } from "~/utils/deviceTier";

/**
 * Reactive accessor for the detected device tier. Backed by the shared state the
 * `device-tier.client` plugin seeds, so every caller agrees and the heuristic
 * only runs once.
 *
 * Use `isLowEnd` to skip mounting expensive WebGL backgrounds on constrained
 * devices, e.g.:
 *
 *   const { isLowEnd } = useDeviceTier();
 *   <ExpensiveWebGLBackground v-if="!isLowEnd" />
 *   <CheapStaticBackground v-else />
 *
 * During SSR the tier defaults to "high" so the markup matches the most capable
 * case; the plugin corrects it on the client before paint.
 */
export function useDeviceTier() {
  const tier = useState<DeviceTier>("device-tier", () =>
    import.meta.client ? getDeviceTier() : "high",
  );

  const isLowEnd = computed(() => tier.value === "low");
  const isHighEnd = computed(() => tier.value === "high");

  return { tier, isLowEnd, isHighEnd };
}
