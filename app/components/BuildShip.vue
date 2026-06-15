<script setup lang="ts">
type Stage = "reaching" | "designing" | "building" | "live" | "optimising";
const stage = ref<Stage>("reaching");
const stageLabel = computed(
  () =>
    ({
      reaching: "Reaching out",
      designing: "Designing",
      building: "Building",
      live: "Live",
      optimising: "Optimising",
    })[stage.value],
);

const root = ref<HTMLDivElement | null>(null);
let kill: (() => void) | null = null;

onMounted(async () => {
  if (!root.value) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    stage.value = "live";
    return;
  }

  const { default: gsap } = await import("gsap");
  const svg = root.value.querySelector("svg");
  if (!svg) return;

  const personL = svg.querySelector(".person-left");
  const personR = svg.querySelector(".person-right");
  const bubbles = Array.from(svg.querySelectorAll<SVGGElement>(".bubble"));
  const frame = svg.querySelector(".frame-shell");
  const topbar = svg.querySelector(".topbar");
  const blockHero = svg.querySelector('[data-block="hero"]');
  const blockHeader = svg.querySelector('[data-block="header"]');
  const blockFeat1 = svg.querySelector('[data-block="feat1"]');
  const blockFeat2 = svg.querySelector('[data-block="feat2"]');
  const blockFeat3 = svg.querySelector('[data-block="feat3"]');
  const blockFooter = svg.querySelector('[data-block="footer"]');
  const blocks = [
    blockHero,
    blockHeader,
    blockFeat1,
    blockFeat2,
    blockFeat3,
    blockFooter,
  ].filter(Boolean);
  if (
    !personL ||
    !personR ||
    !bubbles.length ||
    !frame ||
    !topbar ||
    blocks.length < 6
  )
    return;

  // initial hidden state — matches what every loop iteration starts at
  gsap.set([personL, personR], { opacity: 0 });
  gsap.set(bubbles, { transformOrigin: "50% 50%", opacity: 0, scale: 0 });
  gsap.set(frame, { transformOrigin: "50% 50%", opacity: 0, scale: 0.6 });
  gsap.set(topbar, { opacity: 0 });
  gsap.set(blocks, {
    transformOrigin: "50% 50%",
    scaleY: 0,
    opacity: 0,
    filter: "brightness(1)",
  });

  const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power2.out" } });

  // ── PHASE 1 — REACH OUT ───────────────────────────────────────────
  tl.call(() => (stage.value = "reaching"));
  tl.fromTo(
    personL,
    { opacity: 0, x: -16, scale: 0.9 },
    { opacity: 1, x: 0, scale: 1, duration: 0.5 },
  );
  tl.fromTo(
    personR,
    { opacity: 0, x: 16, scale: 0.9 },
    { opacity: 1, x: 0, scale: 1, duration: 0.5 },
    "<0.15",
  );
  // chat bubbles pop one after another
  tl.fromTo(
    bubbles,
    { opacity: 0, scale: 0 },
    {
      opacity: 1,
      scale: 1,
      duration: 0.32,
      stagger: 0.32,
      ease: "back.out(2)",
    },
    "+=0.1",
  );
  tl.to({}, { duration: 0.6 });

  // ── PHASE 2 — DESIGN (morph: chat becomes the site) ───────────────
  tl.call(() => (stage.value = "designing"));
  tl.to(personL, { opacity: 0, x: -40, duration: 0.55 });
  tl.to(personR, { opacity: 0, x: 40, duration: 0.55 }, "<");
  tl.to(
    bubbles,
    { opacity: 0, scale: 0.15, x: 0, y: 18, duration: 0.5, stagger: 0.04 },
    "<",
  );
  // the frame grows out of the chat's centre
  tl.to(
    frame,
    { opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" },
    "<0.25",
  );
  tl.to(topbar, { opacity: 1, duration: 0.35 }, "<0.3");

  // ── PHASE 3 — BUILD (one thing → bigger site) ─────────────────────
  tl.call(() => (stage.value = "building"));
  // "one thing" — hero only
  tl.fromTo(
    blockHero,
    { scaleY: 0, opacity: 0 },
    { scaleY: 1, opacity: 1, duration: 0.45, ease: "back.out(1.7)" },
    "+=0.25",
  );
  tl.to({}, { duration: 0.5 });
  // header arrives (logo + nav + CTA)
  tl.fromTo(
    blockHeader,
    { scaleY: 0, opacity: 0 },
    { scaleY: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" },
    "+=0.15",
  );
  // first feature card
  tl.fromTo(
    blockFeat1,
    { scaleY: 0, opacity: 0 },
    { scaleY: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" },
    "+=0.25",
  );
  // grows into the full grid
  tl.fromTo(
    [blockFeat2, blockFeat3],
    { scaleY: 0, opacity: 0 },
    {
      scaleY: 1,
      opacity: 1,
      duration: 0.4,
      stagger: 0.18,
      ease: "back.out(1.7)",
    },
    "+=0.35",
  );
  // footer closes it out
  tl.fromTo(
    blockFooter,
    { scaleY: 0, opacity: 0 },
    { scaleY: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" },
    "+=0.3",
  );

  // ── PHASE 4 — LIVE (polish pulses rotate through) ─────────────────
  tl.call(() => (stage.value = "live"));
  tl.to({}, { duration: 0.4 });
  blocks.forEach((b) => {
    tl.to(
      b,
      { filter: "brightness(1.45)", scale: 1.03, duration: 0.22 },
      "+=0.12",
    );
    tl.to(b, { filter: "brightness(1)", scale: 1, duration: 0.38 });
  });

  // ── PHASE 5 — fade everything back to nothing (seamless restart) ──
  tl.call(() => (stage.value = "optimising"));
  tl.to({}, { duration: 0.4 });
  tl.to(
    [
      blockFooter,
      blockFeat3,
      blockFeat2,
      blockFeat1,
      blockHero,
      blockHeader,
      topbar,
    ],
    { opacity: 0, duration: 0.5, stagger: 0.04 },
  );
  tl.to(frame, { opacity: 0, scale: 0.6, duration: 0.5 }, "<0.2");

  kill = () => tl.kill();
});

onBeforeUnmount(() => kill?.());
</script>

<template>
  <div ref="root" class="build-ship pointer-events-none relative">
    <!-- live status chip — narrates the current phase of the loop -->
    <div
      class="status-chip absolute top-2 left-3 z-10 inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200 ring-1 ring-white/10 backdrop-blur"
    >
      <span class="status-dot" :data-stage="stage" />
      <span>{{ stageLabel }}</span>
    </div>

    <svg
      viewBox="0 0 480 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bs-hero" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#34d8a6" stop-opacity="0.9" />
          <stop offset="1" stop-color="#38bdf8" stop-opacity="0.95" />
        </linearGradient>
        <linearGradient id="bs-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgba(14,22,38,0.96)" />
          <stop offset="1" stop-color="rgba(8,14,28,0.96)" />
        </linearGradient>
        <radialGradient id="bs-aura" cx="50%" cy="50%" r="55%">
          <stop offset="0" stop-color="#38bdf8" stop-opacity="0.45" />
          <stop offset="0.55" stop-color="#34d8a6" stop-opacity="0.16" />
          <stop offset="1" stop-color="#04070d" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="bs-pad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#38bdf8" stop-opacity="0" />
          <stop offset="0.5" stop-color="#38bdf8" stop-opacity="0.55" />
          <stop offset="1" stop-color="#38bdf8" stop-opacity="0" />
        </linearGradient>
        <clipPath id="bs-clip">
          <rect x="40" y="40" width="400" height="280" rx="14" />
        </clipPath>

        <!-- shaded heads + shirts + halos for the two people -->
        <radialGradient id="bs-head-cyan" cx="40%" cy="35%" r="65%">
          <stop offset="0" stop-color="#d6f3ff" />
          <stop offset="0.7" stop-color="#7fdfff" />
          <stop offset="1" stop-color="#4cc4ff" />
        </radialGradient>
        <radialGradient id="bs-head-emerald" cx="40%" cy="35%" r="65%">
          <stop offset="0" stop-color="#cffce8" />
          <stop offset="0.7" stop-color="#34d8a6" />
          <stop offset="1" stop-color="#1eb88a" />
        </radialGradient>
        <linearGradient id="bs-shirt-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgba(127,223,255,0.9)" />
          <stop offset="1" stop-color="rgba(60,160,220,0.7)" />
        </linearGradient>
        <linearGradient id="bs-shirt-emerald" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgba(52,216,166,0.9)" />
          <stop offset="1" stop-color="rgba(20,150,115,0.7)" />
        </linearGradient>
        <radialGradient id="bs-halo-cyan" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#38bdf8" stop-opacity="0.45" />
          <stop offset="1" stop-color="#38bdf8" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="bs-halo-emerald" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#34d8a6" stop-opacity="0.45" />
          <stop offset="1" stop-color="#34d8a6" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- ambient breathing aura behind everything -->
      <ellipse
        class="aura"
        cx="240"
        cy="180"
        rx="230"
        ry="140"
        fill="url(#bs-aura)"
      />

      <!-- launchpad / horizon line -->
      <g class="launchpad">
        <ellipse
          cx="240"
          cy="334"
          rx="200"
          ry="5"
          fill="url(#bs-pad)"
          opacity="0.65"
        />
        <line
          x1="40"
          y1="334"
          x2="440"
          y2="334"
          stroke="rgba(127,223,255,0.35)"
          stroke-width="0.6"
        />
        <line
          x1="100"
          y1="344"
          x2="380"
          y2="344"
          stroke="rgba(127,223,255,0.18)"
          stroke-width="0.5"
        />
      </g>

      <!-- ── SCENE 1 — TWO PEOPLE + CHAT BUBBLES ─────────────────── -->
      <g class="person-left">
        <!-- halo glow behind the figure -->
        <ellipse cx="120" cy="185" rx="46" ry="48" fill="url(#bs-halo-cyan)" />
        <!-- torso with curved shoulders narrowing to a neck behind the head -->
        <path
          d="M 100 200 q 0 -40 20 -40 q 20 0 20 40 v 16 h -40 z"
          fill="url(#bs-shirt-cyan)"
          stroke="rgba(127,223,255,0.55)"
          stroke-width="0.6"
        />
        <!-- collar accent -->
        <path
          d="M 110 175 q 10 8 20 0"
          stroke="rgba(255,255,255,0.45)"
          stroke-width="0.9"
          fill="none"
          stroke-linecap="round"
        />
        <!-- head -->
        <circle
          cx="120"
          cy="148"
          r="13"
          fill="url(#bs-head-cyan)"
          stroke="rgba(127,223,255,0.6)"
          stroke-width="0.6"
        />
        <!-- eyes -->
        <circle cx="116" cy="146" r="1.4" fill="rgba(14,22,38,0.9)" />
        <circle cx="124" cy="146" r="1.4" fill="rgba(14,22,38,0.9)" />
        <!-- smile -->
        <path
          d="M 116 152 q 4 3 8 0"
          stroke="rgba(14,22,38,0.65)"
          stroke-width="0.95"
          fill="none"
          stroke-linecap="round"
        />
      </g>
      <g class="person-right">
        <ellipse
          cx="360"
          cy="185"
          rx="46"
          ry="48"
          fill="url(#bs-halo-emerald)"
        />
        <path
          d="M 340 200 q 0 -40 20 -40 q 20 0 20 40 v 16 h -40 z"
          fill="url(#bs-shirt-emerald)"
          stroke="rgba(52,216,166,0.55)"
          stroke-width="0.6"
        />
        <path
          d="M 350 175 q 10 8 20 0"
          stroke="rgba(255,255,255,0.45)"
          stroke-width="0.9"
          fill="none"
          stroke-linecap="round"
        />
        <circle
          cx="360"
          cy="148"
          r="13"
          fill="url(#bs-head-emerald)"
          stroke="rgba(52,216,166,0.6)"
          stroke-width="0.6"
        />
        <circle cx="356" cy="146" r="1.4" fill="rgba(14,22,38,0.9)" />
        <circle cx="364" cy="146" r="1.4" fill="rgba(14,22,38,0.9)" />
        <path
          d="M 356 152 q 4 3 8 0"
          stroke="rgba(14,22,38,0.65)"
          stroke-width="0.95"
          fill="none"
          stroke-linecap="round"
        />
      </g>

      <g class="chat">
        <!-- left-person bubble: tail down-left -->
        <g class="bubble">
          <rect
            x="160"
            y="142"
            width="76"
            height="22"
            rx="11"
            fill="rgba(127,223,255,0.18)"
            stroke="rgba(127,223,255,0.45)"
          />
          <path
            d="M 168 164 L 162 170 L 174 164 z"
            fill="rgba(127,223,255,0.18)"
            stroke="rgba(127,223,255,0.45)"
            stroke-linejoin="round"
          />
          <rect
            x="172"
            y="151"
            width="30"
            height="4"
            rx="2"
            fill="rgba(200,225,255,0.78)"
          />
          <rect
            x="172"
            y="158"
            width="42"
            height="3"
            rx="1.5"
            fill="rgba(200,225,255,0.48)"
          />
        </g>
        <!-- right-person bubble: tail down-right -->
        <g class="bubble">
          <rect
            x="246"
            y="170"
            width="84"
            height="22"
            rx="11"
            fill="rgba(52,216,166,0.18)"
            stroke="rgba(52,216,166,0.45)"
          />
          <path
            d="M 318 192 L 324 198 L 312 192 z"
            fill="rgba(52,216,166,0.18)"
            stroke="rgba(52,216,166,0.45)"
            stroke-linejoin="round"
          />
          <rect
            x="258"
            y="179"
            width="40"
            height="4"
            rx="2"
            fill="rgba(200,255,235,0.78)"
          />
          <rect
            x="258"
            y="186"
            width="52"
            height="3"
            rx="1.5"
            fill="rgba(200,255,235,0.48)"
          />
        </g>
        <!-- left-person typing bubble: three dots -->
        <g class="bubble">
          <rect
            x="174"
            y="198"
            width="48"
            height="20"
            rx="10"
            fill="rgba(127,223,255,0.18)"
            stroke="rgba(127,223,255,0.45)"
          />
          <path
            d="M 182 218 L 178 224 L 188 218 z"
            fill="rgba(127,223,255,0.18)"
            stroke="rgba(127,223,255,0.45)"
            stroke-linejoin="round"
          />
          <circle
            class="typing-dot"
            cx="187"
            cy="208"
            r="1.7"
            fill="rgba(127,223,255,0.85)"
          />
          <circle
            class="typing-dot"
            cx="195"
            cy="208"
            r="1.7"
            fill="rgba(127,223,255,0.85)"
          />
          <circle
            class="typing-dot"
            cx="203"
            cy="208"
            r="1.7"
            fill="rgba(127,223,255,0.85)"
          />
        </g>
      </g>

      <!-- ── SCENE 2+ — THE WEBSITE FRAME ────────────────────────── -->
      <g class="frame-shell">
        <!-- soft glow under the frame -->
        <ellipse
          cx="240"
          cy="322"
          rx="180"
          ry="11"
          fill="#38bdf8"
          opacity="0.22"
        />
        <!-- body -->
        <rect
          x="40"
          y="40"
          width="400"
          height="280"
          rx="14"
          fill="url(#bs-body)"
          stroke="rgba(127,223,255,0.32)"
          stroke-width="1"
        />

        <g clip-path="url(#bs-clip)">
          <!-- top bar (revealed once the frame appears) -->
          <g class="topbar">
            <rect
              x="40"
              y="40"
              width="400"
              height="34"
              fill="rgba(8,14,28,0.65)"
            />
            <line
              x1="40"
              y1="74"
              x2="440"
              y2="74"
              stroke="rgba(127,223,255,0.18)"
            />
            <!-- traffic lights with a subtle highlight on top -->
            <circle cx="58" cy="57" r="4" fill="#ff6b6b" />
            <circle cx="58" cy="56" r="3.2" fill="#ff8a8a" opacity="0.55" />
            <circle cx="72" cy="57" r="4" fill="#ffd166" />
            <circle cx="72" cy="56" r="3.2" fill="#ffe39a" opacity="0.55" />
            <circle cx="86" cy="57" r="4" fill="#34d8a6" />
            <circle cx="86" cy="56" r="3.2" fill="#6cebbf" opacity="0.55" />
            <!-- back / forward / refresh -->
            <path
              d="M 104 53 L 100 57 L 104 61"
              stroke="rgba(127,223,255,0.6)"
              stroke-width="1.2"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M 114 53 L 118 57 L 114 61"
              stroke="rgba(127,223,255,0.4)"
              stroke-width="1.2"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M 130 54 a 3 3 0 1 0 0.7 3.3"
              stroke="rgba(127,223,255,0.55)"
              stroke-width="1.1"
              fill="none"
              stroke-linecap="round"
            />
            <path
              d="M 130 51 L 130 54 L 127 54"
              stroke="rgba(127,223,255,0.55)"
              stroke-width="1.1"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <!-- address bar -->
            <rect
              x="142"
              y="48"
              width="228"
              height="16"
              rx="3"
              fill="rgba(127,223,255,0.08)"
              stroke="rgba(127,223,255,0.22)"
            />
            <!-- favicon (brand mark) -->
            <circle cx="151" cy="56" r="3.4" fill="url(#bs-hero)" />
            <!-- lock icon -->
            <rect
              x="160"
              y="54"
              width="4"
              height="5"
              rx="0.8"
              fill="rgba(127,223,255,0.55)"
            />
            <rect
              x="160.8"
              y="52"
              width="2.4"
              height="2.4"
              rx="1.2"
              fill="none"
              stroke="rgba(127,223,255,0.55)"
              stroke-width="0.6"
            />
            <!-- url text bar -->
            <rect
              x="170"
              y="55"
              width="118"
              height="3"
              rx="1"
              fill="rgba(200,225,255,0.4)"
            />
            <!-- right-side menu dots -->
            <circle cx="414" cy="57" r="1.4" fill="rgba(200,225,255,0.45)" />
            <circle cx="420" cy="57" r="1.4" fill="rgba(200,225,255,0.45)" />
            <circle cx="426" cy="57" r="1.4" fill="rgba(200,225,255,0.45)" />
          </g>

          <!-- content blocks build in over time (data-block names referenced by JS) -->
          <g data-block="hero">
            <rect
              x="60"
              y="116"
              width="360"
              height="72"
              rx="6"
              fill="url(#bs-hero)"
            />
            <!-- decorative diagonal accent in the corner -->
            <path
              d="M 340 116 L 420 116 L 420 188 L 380 188 Z"
              fill="rgba(255,255,255,0.08)"
            />
            <path
              d="M 380 116 L 420 116 L 420 188 L 400 188 Z"
              fill="rgba(255,255,255,0.06)"
            />
            <!-- text bars + CTA pill with arrow -->
            <rect
              x="76"
              y="132"
              width="160"
              height="9"
              rx="2"
              fill="rgba(255,255,255,0.95)"
            />
            <rect
              x="76"
              y="148"
              width="200"
              height="6"
              rx="2"
              fill="rgba(255,255,255,0.7)"
            />
            <rect
              x="76"
              y="160"
              width="180"
              height="6"
              rx="2"
              fill="rgba(255,255,255,0.6)"
            />
            <rect
              x="76"
              y="172"
              width="62"
              height="12"
              rx="6"
              fill="rgba(255,255,255,0.95)"
            />
            <path
              d="M 124 175 L 128 178 L 124 181"
              stroke="rgba(8,14,28,0.75)"
              stroke-width="1.3"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>

          <g data-block="header">
            <!-- logo: gradient pill + a tiny hex inside (echoes the site mark) -->
            <rect
              x="60"
              y="86"
              width="36"
              height="18"
              rx="4"
              fill="url(#bs-hero)"
            />
            <path
              d="M 71 90 L 78 95 L 78 99 L 71 102 L 64 99 L 64 95 Z"
              fill="rgba(14,22,38,0.95)"
            />
            <!-- nav links -->
            <rect
              x="118"
              y="92"
              width="22"
              height="7"
              rx="2"
              fill="rgba(200,225,255,0.6)"
            />
            <rect
              x="148"
              y="92"
              width="28"
              height="7"
              rx="2"
              fill="rgba(200,225,255,0.4)"
            />
            <rect
              x="184"
              y="92"
              width="24"
              height="7"
              rx="2"
              fill="rgba(200,225,255,0.4)"
            />
            <rect
              x="216"
              y="92"
              width="22"
              height="7"
              rx="2"
              fill="rgba(200,225,255,0.4)"
            />
            <!-- CTA pill with label + arrow -->
            <rect
              x="338"
              y="86"
              width="84"
              height="20"
              rx="10"
              fill="url(#bs-hero)"
            />
            <rect
              x="350"
              y="94"
              width="40"
              height="4"
              rx="2"
              fill="rgba(255,255,255,0.95)"
            />
            <path
              d="M 398 92 L 404 96 L 398 100"
              stroke="rgba(255,255,255,0.95)"
              stroke-width="1.4"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>

          <!-- FEATURE 1 — Lightning (speed) -->
          <g data-block="feat1">
            <rect
              x="60"
              y="200"
              width="112"
              height="80"
              rx="6"
              fill="rgba(127,223,255,0.1)"
              stroke="rgba(127,223,255,0.3)"
            />
            <path
              d="M 80 210 L 86 210 L 83 218 L 88 218 L 78 232 L 82 222 L 77 222 Z"
              fill="url(#bs-hero)"
            />
            <rect
              x="72"
              y="238"
              width="64"
              height="6"
              rx="2"
              fill="rgba(200,225,255,0.6)"
            />
            <rect
              x="72"
              y="248"
              width="84"
              height="4"
              rx="1.5"
              fill="rgba(200,225,255,0.32)"
            />
            <rect
              x="72"
              y="256"
              width="76"
              height="4"
              rx="1.5"
              fill="rgba(200,225,255,0.32)"
            />
            <rect
              x="72"
              y="264"
              width="80"
              height="4"
              rx="1.5"
              fill="rgba(200,225,255,0.32)"
            />
          </g>

          <!-- FEATURE 2 — Sparkle (premium) -->
          <g data-block="feat2">
            <rect
              x="184"
              y="200"
              width="112"
              height="80"
              rx="6"
              fill="rgba(127,223,255,0.1)"
              stroke="rgba(127,223,255,0.3)"
            />
            <path
              d="M 204 210 L 207 219 L 216 222 L 207 225 L 204 234 L 201 225 L 192 222 L 201 219 Z"
              fill="url(#bs-hero)"
            />
            <circle cx="214" cy="212" r="1.5" fill="rgba(255,255,255,0.9)" />
            <circle cx="196" cy="232" r="1.2" fill="rgba(255,255,255,0.7)" />
            <rect
              x="196"
              y="238"
              width="60"
              height="6"
              rx="2"
              fill="rgba(200,225,255,0.6)"
            />
            <rect
              x="196"
              y="248"
              width="84"
              height="4"
              rx="1.5"
              fill="rgba(200,225,255,0.32)"
            />
            <rect
              x="196"
              y="256"
              width="72"
              height="4"
              rx="1.5"
              fill="rgba(200,225,255,0.32)"
            />
            <rect
              x="196"
              y="264"
              width="80"
              height="4"
              rx="1.5"
              fill="rgba(200,225,255,0.32)"
            />
          </g>

          <!-- FEATURE 3 — Gear (custom) -->
          <g data-block="feat3">
            <rect
              x="308"
              y="200"
              width="112"
              height="80"
              rx="6"
              fill="rgba(127,223,255,0.1)"
              stroke="rgba(127,223,255,0.3)"
            />
            <g transform="translate(326 220)">
              <circle
                r="5"
                fill="none"
                stroke="url(#bs-hero)"
                stroke-width="1.6"
              />
              <circle r="1.8" fill="url(#bs-hero)" />
              <rect
                x="-1.2"
                y="-8.5"
                width="2.4"
                height="2.6"
                rx="0.8"
                fill="url(#bs-hero)"
              />
              <rect
                x="-1.2"
                y="5.9"
                width="2.4"
                height="2.6"
                rx="0.8"
                fill="url(#bs-hero)"
              />
              <rect
                x="-8.5"
                y="-1.2"
                width="2.6"
                height="2.4"
                rx="0.8"
                fill="url(#bs-hero)"
              />
              <rect
                x="5.9"
                y="-1.2"
                width="2.6"
                height="2.4"
                rx="0.8"
                fill="url(#bs-hero)"
              />
            </g>
            <rect
              x="320"
              y="238"
              width="68"
              height="6"
              rx="2"
              fill="rgba(200,225,255,0.6)"
            />
            <rect
              x="320"
              y="248"
              width="84"
              height="4"
              rx="1.5"
              fill="rgba(200,225,255,0.32)"
            />
            <rect
              x="320"
              y="256"
              width="72"
              height="4"
              rx="1.5"
              fill="rgba(200,225,255,0.32)"
            />
            <rect
              x="320"
              y="264"
              width="80"
              height="4"
              rx="1.5"
              fill="rgba(200,225,255,0.32)"
            />
          </g>

          <!-- FOOTER — logo + tagline + social icons -->
          <g data-block="footer">
            <rect
              x="60"
              y="290"
              width="360"
              height="22"
              rx="4"
              fill="rgba(127,223,255,0.08)"
              stroke="rgba(127,223,255,0.2)"
            />
            <circle cx="76" cy="301" r="3" fill="url(#bs-hero)" />
            <rect
              x="86"
              y="298"
              width="68"
              height="6"
              rx="2"
              fill="rgba(200,225,255,0.42)"
            />
            <!-- X mark -->
            <path
              d="M 372 297 L 379 305 M 379 297 L 372 305"
              stroke="rgba(127,223,255,0.55)"
              stroke-width="1.1"
              stroke-linecap="round"
            />
            <!-- github-ish circle with notch -->
            <circle
              cx="391"
              cy="301"
              r="3.6"
              fill="none"
              stroke="rgba(127,223,255,0.55)"
              stroke-width="1.1"
            />
            <path
              d="M 391 304 v 1.6"
              stroke="rgba(127,223,255,0.55)"
              stroke-width="1.1"
              stroke-linecap="round"
            />
            <!-- linkedin-ish square -->
            <rect
              x="404"
              y="297.5"
              width="8"
              height="8"
              rx="1"
              fill="none"
              stroke="rgba(127,223,255,0.55)"
              stroke-width="1.1"
            />
            <rect
              x="405.8"
              y="300"
              width="1.2"
              height="3.4"
              fill="rgba(127,223,255,0.55)"
            />
            <rect
              x="408"
              y="300"
              width="1.2"
              height="3.4"
              fill="rgba(127,223,255,0.55)"
            />
          </g>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
/* monochrome site: the illustration keeps its tonal contrast, loses its hue */
.build-ship {
  filter: grayscale(1);
}
.build-ship svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

/* gentle breathing on the ambient aura */
.aura {
  transform-origin: center;
  animation: bs-breathe 5s ease-in-out infinite;
}
@keyframes bs-breathe {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.96);
  }
  50% {
    opacity: 0.95;
    transform: scale(1.04);
  }
}
@media (prefers-reduced-motion: reduce) {
  .aura {
    animation: none;
  }
  .typing-dot {
    animation: none;
  }
}

/* typing dots in the third chat bubble — staggered blink */
.typing-dot {
  animation: bs-type 1.2s ease-in-out infinite;
  transform-origin: center;
}
.typing-dot:nth-of-type(2) {
  animation-delay: 0.18s;
}
.typing-dot:nth-of-type(3) {
  animation-delay: 0.36s;
}
@keyframes bs-type {
  0%,
  60%,
  100% {
    opacity: 0.4;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-1.5px);
  }
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}
.status-dot[data-stage="reaching"] {
  background: #7fdfff;
  animation: bs-blink 0.9s ease-in-out infinite;
}
.status-dot[data-stage="designing"] {
  background: #c084fc;
  animation: bs-pulse 1.5s ease-in-out infinite;
}
.status-dot[data-stage="building"] {
  background: #ffd166;
  animation: bs-blink 0.7s ease-in-out infinite;
}
.status-dot[data-stage="live"] {
  background: #34d8a6;
  box-shadow: 0 0 8px rgba(52, 216, 166, 0.7);
}
.status-dot[data-stage="optimising"] {
  background: #38bdf8;
  animation: bs-pulse 1.8s ease-in-out infinite;
}
@keyframes bs-blink {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}
@keyframes bs-pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}
</style>
