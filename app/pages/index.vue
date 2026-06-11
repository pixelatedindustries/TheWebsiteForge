<script setup lang="ts">
useSeoMeta({
  title: "TheWebsiteForge — Premium Websites With Motion, Speed & Bite",
  description:
    "We design, build, and sell premium, beautifully animated websites. Enter to explore the showcase, the proof, and transparent pricing.",
});

const content = ref<HTMLElement | null>(null);
const swallow = useState<{
  active: boolean;
  vortex: number;
  cover: number;
}>("blackHoleSwallow", () => ({ active: false, vortex: 0, cover: 0 }));

// ambient cinematic audio (synthesised; muted by default)
const hum = useAmbientHum();
// Cleanup fns collected from inside the async onMounted. Vue lifecycle hooks
// can't be registered after an `await`, so we register ONE onBeforeUnmount here
// (synchronously) and run everything pushed to this array.
const cleanups: Array<() => void> = [];
onBeforeUnmount(() => {
  hum.disable();
  for (const fn of cleanups) fn();
});

const line1 = "TheWebsite".split(""); // headline rendered per-letter for the lens

// things the black hole's gravity acts on. `lens` = headline letters that bend
// toward the hole by their own geometry (a standing gravitational lens); `tug` =
// copy that's pulled toward the hole when the cursor nears it (chroma = also
// splits into RGB fringes on proximity).
type Item = {
  el: HTMLElement;
  cx: number;
  cy: number;
  mode: "lens" | "tug";
  chroma: boolean;
  x: (v: number) => void;
  y: (v: number) => void;
  sx: (v: number) => void;
  sk: (v: number) => void;
};
let items: Item[] = [];
let gsapRef: (typeof import("gsap"))["gsap"] | null = null;
const mouse = { x: 0, y: 0 }; // cursor in normalized screen space (-0.5..0.5, y down)
let entering = false;
let ambientReady = false; // hold the ambient effects until the entrance settles

// the hole's on-screen position — matches the shader (right-of-centre, drifts
// slightly toward the cursor)
function holeScreen() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const aspect = vw / vh;
  const hx = 0.34 + mouse.x * 0.05;
  return { x: (0.5 + hx / aspect) * vw, y: (0.5 + mouse.y * 0.05) * vh };
}

function measure() {
  for (const t of items) {
    const r = t.el.getBoundingClientRect();
    t.cx = r.left + r.width / 2;
    t.cy = r.top + r.height / 2;
  }
}

// #1 lens: each headline letter bends toward the hole by its own distance to it
function applyLens(hole: { x: number; y: number }) {
  for (const t of items) {
    if (t.mode !== "lens") continue;
    const dx = hole.x - t.cx;
    const dy = hole.y - t.cy;
    const dist = Math.hypot(dx, dy) || 1;
    const infl = Math.exp(-dist / 250); // strongest for letters nearest the hole
    t.x((dx / dist) * infl * 46);
    t.y((dy / dist) * infl * 30);
    t.sx(1 + infl * 0.5);
  }
}

onMounted(async () => {
  // Returning visitors skip the intro and go straight to /home. The flag is set
  // the first time they click "Enter the site" (see enter()).
  if (localStorage.getItem("twf_entered") === "1") {
    await navigateTo("/home", { replace: true });
    return;
  }
  if (!content.value) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: gsap } = await import("gsap");
  gsapRef = gsap;

  const make = (el: HTMLElement, mode: "lens" | "tug"): Item => {
    gsap.set(el, {
      transformOrigin: mode === "lens" ? "center center" : "left center",
      willChange: "transform",
    });
    return {
      el,
      cx: 0,
      cy: 0,
      mode,
      chroma: el.hasAttribute("data-chroma"),
      x: gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" }),
      y: gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" }),
      sx: gsap.quickTo(el, "scaleX", { duration: 0.5, ease: "power3" }),
      sk: gsap.quickTo(el, "skewX", { duration: 0.5, ease: "power3" }),
    };
  };
  const collect = () => {
    const root = content.value!;
    const letters = Array.from(
      root.querySelectorAll<HTMLElement>("[data-letter]"),
    );
    const grav = Array.from(root.querySelectorAll<HTMLElement>("[data-grav]"));
    items = [
      ...letters.map((el) => make(el, "lens")),
      ...grav.map((el) => make(el, "tug")),
    ];
  };
  collect();

  // entrance: the headline letters rise in (replaces v-split for this line)
  gsap.from(content.value.querySelectorAll("[data-letter]"), {
    yPercent: 120,
    opacity: 0,
    stagger: 0.035,
    duration: 0.7,
    ease: "power3.out",
    delay: 0.15,
  });

  // #8 decode: the subline scrambles through glyphs and resolves
  const sub = content.value.querySelector<HTMLElement>("[data-decode]");
  if (sub) {
    const final = sub.textContent ?? "";
    const glyphs =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789·—#%&";
    const startT = performance.now() + 700;
    const dur = 1100;
    const step = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - startT) / dur));
      const shown = Math.floor(t * final.length);
      let out = "";
      for (let i = 0; i < final.length; i++) {
        const ch = final[i]!;
        out +=
          i < shown || ch === " "
            ? ch
            : glyphs[(Math.random() * glyphs.length) | 0];
      }
      sub.textContent = out;
      if (t < 1) requestAnimationFrame(step);
      else sub.textContent = final;
    };
    requestAnimationFrame(step);
  }

  const remeasure = () => {
    if (entering) return;
    for (const t of items) gsap.set(t.el, { x: 0, y: 0, scaleX: 1, skewX: 0 });
    measure();
  };
  window.addEventListener("resize", remeasure);
  cleanups.push(() => window.removeEventListener("resize", remeasure));

  // let the entrance reveals settle, then measure rest positions + start effects
  const readyT = setTimeout(() => {
    measure();
    ambientReady = true;
    applyLens(holeScreen());
  }, 1900);
  cleanups.push(() => clearTimeout(readyT));

  // ambient pull only for fine pointers
  if (!window.matchMedia("(pointer: fine)").matches) return;

  const R = 440; // tug influence radius (px)
  const onMove = (e: PointerEvent) => {
    mouse.x = e.clientX / window.innerWidth - 0.5;
    mouse.y = e.clientY / window.innerHeight - 0.5;
    if (entering || !ambientReady) return;
    const hole = holeScreen();
    applyLens(hole);
    for (const t of items) {
      if (t.mode !== "tug") continue;
      let infl = 1 - Math.hypot(e.clientX - t.cx, e.clientY - t.cy) / R;
      infl = infl <= 0 ? 0 : infl * infl * (3 - 2 * infl);
      const dx = hole.x - t.cx;
      const dy = hole.y - t.cy;
      const len = Math.hypot(dx, dy) || 1;
      t.x((dx / len) * infl * 56);
      t.y((dy / len) * infl * 30);
      t.sx(1 + infl * 0.18); // stretch toward the hole
      t.sk(-infl * 6);
      // #7 chromatic light-splitting as the cursor nears
      if (t.chroma) {
        const ca = infl * 6;
        t.el.style.textShadow =
          ca < 0.25
            ? ""
            : `${ca.toFixed(2)}px 0 rgba(255,96,96,${(0.5 * infl).toFixed(3)}), ${(-ca).toFixed(2)}px 0 rgba(120,224,255,${(0.6 * infl).toFixed(3)})`;
      }
    }
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  cleanups.push(() => window.removeEventListener("pointermove", onMove));
});

// Vortex swallow: the black hole sucks the copy in, swirls the whole field down
// into itself and drains the screen to black, then /home is revealed from the dark.
async function enter() {
  if (entering) return;
  // Remember that the visitor has entered, so future visits skip the intro.
  if (import.meta.client) localStorage.setItem("twf_entered", "1");
  const reduced =
    import.meta.client &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    await navigateTo("/home");
    return;
  }

  const gsap = gsapRef ?? (await import("gsap")).default;
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");

  entering = true;
  swallow.value = { active: true, vortex: 0, cover: 0 };
  measure();
  const hole = holeScreen();

  // the copy + headline letters + vortex are pulled in together, draining to black
  await new Promise<void>((resolve) => {
    const tl = gsap.timeline({ onComplete: () => resolve() });

    // every letter/element spirals into the hole, stretching + fading as it goes
    items.forEach((t, i) => {
      gsap.set(t.el, { transformOrigin: "center center" });
      tl.to(
        t.el,
        {
          x: hole.x - t.cx,
          y: hole.y - t.cy,
          scale: 0.04,
          rotation: gsap.utils.random(-70, 70),
          skewX: gsap.utils.random(-25, 25),
          opacity: 0,
          duration: 1.1,
          ease: "power2.in",
          overwrite: "auto",
        },
        i * 0.03,
      );
    });

    // the field swirls down into the hole and the screen drains to black
    const vx = { v: 0 };
    tl.to(
      vx,
      {
        v: 1,
        duration: 1.4,
        ease: "power2.in",
        onUpdate: () => (swallow.value.vortex = vx.v),
      },
      0,
    );
    // seal the blackness as the drain completes
    const cv = { v: 0 };
    tl.to(
      cv,
      {
        v: 1,
        duration: 0.45,
        ease: "power2.in",
        onUpdate: () => (swallow.value.cover = cv.v),
      },
      1.0,
    );
  });

  // we're in blackness — swap to /home behind the cover
  await navigateTo("/home");
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  await nextTick();
  requestAnimationFrame(() => ScrollTrigger.refresh(true));
  setTimeout(() => ScrollTrigger.refresh(true), 450);

  // reveal the settled /home out of the dark
  const cv2 = { v: 1 };
  await new Promise<void>((resolve) => {
    gsap.to(cv2, {
      v: 0,
      duration: 0.9,
      ease: "power2.out",
      onUpdate: () => (swallow.value.cover = cv2.v),
      onComplete: () => resolve(),
    });
  });

  swallow.value = { active: false, vortex: 0, cover: 0 };
  entering = false;
  ScrollTrigger.refresh(true);
}
</script>

<template>
  <!-- Massive black hole (from the layout) bleeds off the right; content sits in
       the dark space on the left. Its gravity tugs the copy toward the cursor's
       side and, on Enter, sucks it all into the vortex. -->
  <section class="intro relative flex h-svh items-center overflow-hidden">
    <!-- left-to-right scrim keeps the copy crisp against the giant orb -->
    <div
      class="pointer-events-none absolute inset-0 z-5"
      style="
        background: linear-gradient(
          to right,
          #04070d 20%,
          rgba(4, 7, 13, 0.72) 46%,
          transparent 76%
        );
      "
      aria-hidden="true"
    />

    <div class="relative z-10 w-full px-6 sm:px-10 lg:px-16">
      <div ref="content" class="max-w-xl">
        <p
          v-reveal="{ y: 12, duration: 0.6 }"
          data-grav
          data-chroma
          class="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-200/80"
        >
          <span
            class="h-px w-9 bg-gradient-to-r from-brand-400 to-transparent"
          />
          Premium websites · built &amp; sold
        </p>

        <h1
          class="intro-word font-display font-bold leading-[0.9] tracking-tight text-white"
        >
          <span class="sr-only">TheWebsite Forge</span>
          <span aria-hidden="true" class="block whitespace-nowrap">
            <span
              v-for="(ch, i) in line1"
              :key="i"
              data-letter
              class="inline-block will-change-transform"
              >{{ ch }}</span
            >
          </span>
          <span aria-hidden="true" data-letter class="source-word block"
            >Forge</span
          >
        </h1>

        <p
          v-reveal="{ delay: 0.72 }"
          data-grav
          data-chroma
          data-decode
          class="mt-7 max-w-md text-base leading-relaxed text-slate-300/90"
        >
          Premium websites — designed, animated, built, and sold.
        </p>

        <button
          v-reveal="{ delay: 0.88, y: 16 }"
          data-grav
          type="button"
          class="btn-gradient intro-enter group mt-9 inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold text-white"
          @click="enter"
        >
          Enter the site
          <svg
            class="transition-transform duration-300 group-hover:translate-x-1"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- #12 ambient audio toggle (muted by default) -->
    <button
      type="button"
      :aria-pressed="hum.enabled.value"
      :aria-label="
        hum.enabled.value ? 'Mute ambient sound' : 'Play ambient sound'
      "
      class="hum-toggle absolute bottom-6 right-6 z-20 grid h-11 w-11 place-items-center rounded-full text-brand-100/80 transition hover:text-white"
      @click="hum.toggle()"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M4 9v6h4l5 4V5L8 9H4z" />
        <template v-if="hum.enabled.value">
          <path d="M16 8.5a4 4 0 0 1 0 7" />
          <path d="M18.5 6a7 7 0 0 1 0 12" />
        </template>
        <line v-else x1="16" y1="9" x2="21" y2="15" />
        <line v-if="!hum.enabled.value" x1="21" y1="9" x2="16" y2="15" />
      </svg>
    </button>
  </section>
</template>

<style scoped>
.intro {
  isolation: isolate;
}
.intro-word {
  font-size: clamp(2.6rem, 7vw, 5.5rem);
}
.source-word {
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", serif;
  font-style: italic;
  font-weight: 600;
  letter-spacing: -0.01em;
  background-image: linear-gradient(
    100deg,
    var(--color-brand-300),
    var(--color-accent-400) 55%,
    var(--color-accent-300)
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: shimmer 6s linear infinite;
}
.intro-enter {
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 0 0 1px rgba(52, 216, 166, 0.16),
    0 16px 42px -18px rgba(56, 189, 248, 0.9);
}
.hum-toggle {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(10, 16, 28, 0.4);
  backdrop-filter: blur(6px);
}
.hum-toggle[aria-pressed="true"] {
  border-color: rgba(120, 224, 255, 0.45);
  box-shadow: 0 0 18px -4px rgba(56, 189, 248, 0.6);
}
@media (prefers-reduced-motion: reduce) {
  .source-word {
    animation: none;
  }
}
</style>
