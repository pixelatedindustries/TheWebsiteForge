<script setup lang="ts">
interface Props {
  glassColor?: string;
  edgeLightColor?: string;
  ambientIntensity?: number;
  pointLightIntensity?: number;
  transmission?: number;
  roughness?: number;
  thickness?: number;
  scrub?: number;
  shardCount?: number;
  shardSizeMin?: number;
  shardSizeMax?: number;
  introColor?: string;
  logoOffsetX?: number;
  introHold?: number;
  introDuration?: number;
  explosion?: number;
  hoverLift?: number;
  hoverDrift?: number;
  hoverRotation?: number;
  hoverSpring?: number;
}

const props = withDefaults(defineProps<Props>(), {
  glassColor: "#353638",
  edgeLightColor: "#eee9df",
  ambientIntensity: 0.55,
  pointLightIntensity: 32,
  transmission: 0.72,
  roughness: 0.32,
  thickness: 1.3,
  scrub: 1,
  shardCount: 144,
  shardSizeMin: 0.16,
  shardSizeMax: 0.32,
  introColor: "#ffffff",
  logoOffsetX: 2.15,
  introHold: 0.8,
  introDuration: 2.2,
  explosion: 4.8,
  hoverLift: 0.35,
  hoverDrift: 1.1,
  hoverRotation: 0.32,
  hoverSpring: 2.4,
});

const root = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const flyingLogo = ref<HTMLElement | null>(null);
const showFlyingLogo = ref(false);
const rockSceneReady = useState<boolean>("rock-scene-ready", () => true);
const rockSceneRequired = useState<boolean>("rock-scene-required", () => false);
const nuxtApp = useNuxtApp();
let scene: { dispose: () => void; refresh: () => void } | null = null;
let disposed = false;
let introLogoTimer = 0;
let logoFlight: Animation | null = null;
const refreshScene = () => {
  requestAnimationFrame(() => scene?.refresh());
  window.setTimeout(() => scene?.refresh(), 350);
  window.setTimeout(() => scene?.refresh(), 950);
};
const removePageFinishHook = nuxtApp.hook("page:finish", refreshScene);

onMounted(async () => {
  rockSceneRequired.value = true;
  rockSceneReady.value = false;

  if (
    window.scrollY <= 20 &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    document.body.classList.add("brand-intro-active");
    showFlyingLogo.value = true;
    introLogoTimer = window.setTimeout(() => {
      const mark = flyingLogo.value;
      const target = document.querySelector<HTMLElement>(
        "[data-brand-mark-target]",
      );
      if (!mark || !target) {
        document.body.classList.remove("brand-intro-active");
        showFlyingLogo.value = false;
        return;
      }

      const from = mark.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      logoFlight = mark.animate(
        [
          { transform: "translate3d(0, 0, 0) scale(1)", offset: 0 },
          {
            transform: "translate3d(0, -14px, 0) scale(1.035)",
            offset: 0.16,
          },
          {
            transform: `translate3d(${to.left - from.left}px, ${to.top - from.top}px, 0) scale(${to.width / from.width}, ${to.height / from.height})`,
            offset: 1,
          },
        ],
        {
          duration: 1250,
          easing: "cubic-bezier(0.65, 0, 0.2, 1)",
          fill: "forwards",
        },
      );
      logoFlight.onfinish = () => {
        document.body.classList.remove("brand-intro-active");
        showFlyingLogo.value = false;
      };
    }, 1250);
  }

  const canvasElement = canvas.value;
  const page = root.value?.closest<HTMLElement>("[data-glass-page]");
  const hero = page?.querySelector<HTMLElement>("[data-glass-hero]");
  const end = page?.querySelector<HTMLElement>("[data-glass-end]");
  if (!canvasElement || !page || !hero || !end) return;

  const { GlassShardScene } = await import("~/utils/GlassShardScene.client");
  if (disposed) return;

  scene = new GlassShardScene({
    canvas: canvasElement,
    visibilityTarget: page,
    scrollTrigger: hero,
    scrollEndTrigger: end,
    ...props,
  });
  rockSceneReady.value = true;
  refreshScene();
});

onBeforeUnmount(() => {
  disposed = true;
  window.clearTimeout(introLogoTimer);
  logoFlight?.cancel();
  document.body.classList.remove("brand-intro-active");
  rockSceneRequired.value = false;
  rockSceneReady.value = true;
  removePageFinishHook();
  scene?.dispose();
});
</script>

<template>
  <div
    ref="root"
    class="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    aria-hidden="true"
  >
    <canvas ref="canvas" class="h-full w-full opacity-80" />
    <div class="glass-shard-vignette absolute inset-0" />
  </div>
  <Teleport to="body">
    <div v-if="showFlyingLogo" ref="flyingLogo" class="flying-brand-mark">
      <svg viewBox="0 0 360 500" fill="none" aria-hidden="true">
        <path
          d="M112 35H164L154 92H102L112 35ZM83 112H139L126 183C123 201 132 210 151 210H222C248 210 266 192 266 166C266 141 248 124 222 124H146L157 63H224C294 63 342 105 342 166C342 229 294 272 224 272H139L101 465H35L83 112Z"
        />
      </svg>
    </div>
  </Teleport>
</template>

<style scoped>
:global(body.brand-intro-active .brand-mark-target) {
  opacity: 0;
}

:global(.brand-mark-target) {
  transition: opacity 180ms ease;
}

.glass-shard-vignette {
  background:
    radial-gradient(
      circle at 68% 46%,
      transparent 0%,
      rgba(14, 13, 12, 0.12) 45%,
      rgba(14, 13, 12, 0.76) 100%
    ),
    linear-gradient(90deg, rgba(14, 13, 12, 0.58), transparent 55%);
}

.flying-brand-mark {
  position: fixed;
  top: calc(50% - min(29vw, 220px));
  left: calc(72% - min(10.5vw, 80px));
  z-index: 70;
  width: min(21vw, 160px);
  aspect-ratio: 360 / 500;
  pointer-events: none;
  transform-origin: top left;
  filter: drop-shadow(0 0 28px rgba(255, 255, 255, 0.16));
  will-change: transform;
}

.flying-brand-mark svg {
  width: 100%;
  height: 100%;
}

.flying-brand-mark path {
  fill: transparent;
  stroke: #fff;
  stroke-width: 6;
  stroke-linejoin: round;
  stroke-dasharray: 1760;
  stroke-dashoffset: 1760;
  animation:
    draw-mark 0.85s cubic-bezier(0.37, 0, 0.63, 1) forwards,
    fill-mark 0.42s ease 0.72s forwards;
}

@keyframes draw-mark {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes fill-mark {
  to {
    fill: #fff;
    stroke-width: 2;
  }
}
</style>
