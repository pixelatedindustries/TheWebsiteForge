/**
 * Lumina motion system — GSAP + ScrollTrigger + Lenis smooth scroll.
 *
 * Registers a small library of auto-available Vue directives so components stay
 * declarative:
 *   v-reveal               — fade/slide-in on scroll
 *   v-reveal:stagger       — stagger children in on scroll
 *   v-parallax="0.2"       — scrub-driven parallax (fraction of own height)
 *   v-magnetic="0.4"       — cursor-magnet hover (great on buttons)
 *   v-tilt                 — 3D pointer tilt (great on cards)
 *   v-count                — count-up the numeric part of the element's text
 *   v-split="{ delay }"    — word/char rise-in reveal for headings
 *   v-spotlight            — cursor-tracking glow over a card
 *   v-skew                 — scroll-velocity shear (the "alive" feel)
 *
 * The plugin is universal so the directives resolve during SSR, but every hook
 * body runs client-only and bails out under `prefers-reduced-motion`.
 */
import type { Directive, DirectiveBinding } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// per-element teardown bag (keeps `el` free of ad-hoc props for TS' sake)
const cleanups = new WeakMap<HTMLElement, Array<() => void>>();
function onCleanup(el: HTMLElement, fn: () => void) {
  const arr = cleanups.get(el) ?? [];
  arr.push(fn);
  cleanups.set(el, arr);
}
function runCleanup(el: HTMLElement) {
  cleanups.get(el)?.forEach((fn) => fn());
  cleanups.delete(el);
}

// latest Lenis scroll velocity, shared with the v-skew directive
const velocity = { value: 0 };

// active Lenis instance + a helper for programmatic smooth scrolling (used by
// the hero's "scroll to explore" progress button)
let _lenis: {
  scrollTo: (t: number | HTMLElement, o?: Record<string, unknown>) => void;
} | null = null;
export function smoothScrollTo(
  target: number | HTMLElement,
  opts: { duration?: number; offset?: number } = {},
) {
  if (_lenis) {
    _lenis.scrollTo(target, {
      duration: opts.duration ?? 1.3,
      offset: opts.offset ?? 0,
    });
  } else if (import.meta.client) {
    const y =
      typeof target === "number"
        ? target
        : target.getBoundingClientRect().top +
          window.scrollY +
          (opts.offset ?? 0);
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const reduced =
    import.meta.client &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (import.meta.client) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /** Register a scroll-driven tween and remember it for teardown. */
  function tracked(
    el: HTMLElement,
    vars: gsap.TweenVars,
    fromTo: "from" | "to",
  ) {
    const tween = fromTo === "from" ? gsap.from(el, vars) : gsap.to(el, vars);
    onCleanup(el, () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
    return tween;
  }

  // ── v-reveal ──────────────────────────────────────────────────────────────
  const reveal: Directive<HTMLElement, RevealOpts | undefined> = {
    mounted(el, binding) {
      if (reduced) return;
      if (binding.arg === "stagger") return mountStagger(el, binding.value);
      const o = binding.value ?? {};
      const rect = el.getBoundingClientRect();
      const isInitiallyVisible =
        rect.top < window.innerHeight * 0.92 &&
        rect.bottom > -window.innerHeight * 0.1;
      const tween = gsap.from(el, {
        opacity: 0,
        y: o.y ?? 60,
        scale: o.scale ?? 0.94,
        duration: o.duration ?? 1,
        ease: o.ease ?? "power3.out",
        delay: o.delay ?? 0,
        scrollTrigger: isInitiallyVisible
          ? undefined
          : { trigger: el, start: o.start ?? "top 85%", once: true },
      });
      onCleanup(el, () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    },
    unmounted: runCleanup,
  };

  function mountStagger(el: HTMLElement, value?: RevealOpts) {
    const o = value ?? {};
    const targets = o.selector
      ? el.querySelectorAll<HTMLElement>(o.selector)
      : (el.children as unknown as HTMLElement[]);
    const rect = el.getBoundingClientRect();
    const isInitiallyVisible =
      rect.top < window.innerHeight * 0.9 &&
      rect.bottom > -window.innerHeight * 0.1;
    const tween = gsap.from(targets, {
      opacity: 0,
      y: o.y ?? 56,
      scale: o.scale ?? 0.95,
      duration: o.duration ?? 0.9,
      ease: o.ease ?? "power3.out",
      stagger: o.stagger ?? 0.12,
      scrollTrigger: isInitiallyVisible
        ? undefined
        : { trigger: el, start: o.start ?? "top 80%", once: true },
    });
    onCleanup(el, () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
  }

  // ── v-parallax ────────────────────────────────────────────────────────────
  const parallax: Directive<HTMLElement, number | undefined> = {
    mounted(el, binding) {
      if (reduced) return;
      const speed = binding.value ?? 0.2;
      tracked(
        el,
        {
          yPercent: -speed * 100,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
        "to",
      );
    },
    unmounted: runCleanup,
  };

  // ── v-magnetic ────────────────────────────────────────────────────────────
  const magnetic: Directive<HTMLElement, number | undefined> = {
    mounted(el, binding) {
      if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
      const strength = binding.value ?? 0.4;
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      };
      const leave = () => {
        xTo(0);
        yTo(0);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      onCleanup(el, () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
        gsap.set(el, { x: 0, y: 0 });
      });
    },
    unmounted: runCleanup,
  };

  // ── v-tilt ────────────────────────────────────────────────────────────────
  const tilt: Directive<HTMLElement, { max?: number } | undefined> = {
    mounted(el, binding) {
      if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
      const max = binding.value?.max ?? 9;
      gsap.set(el, {
        transformPerspective: 900,
        transformStyle: "preserve-3d",
      });
      const rx = gsap.quickTo(el, "rotationX", {
        duration: 0.5,
        ease: "power2",
      });
      const ry = gsap.quickTo(el, "rotationY", {
        duration: 0.5,
        ease: "power2",
      });
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * max * 2);
        rx(-py * max * 2);
      };
      const enter = () => gsap.to(el, { scale: 1.03, duration: 0.4 });
      const leave = () => {
        rx(0);
        ry(0);
        gsap.to(el, { scale: 1, duration: 0.5 });
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
      onCleanup(el, () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
      });
    },
    unmounted: runCleanup,
  };

  // ── v-count ───────────────────────────────────────────────────────────────
  const count: Directive<
    HTMLElement,
    { duration?: number; immediate?: boolean } | undefined
  > = {
    mounted(el, binding) {
      if (reduced) return;
      const raw = (el.textContent ?? "").trim();
      const m = raw.match(/^(\D*?)([\d.,]+)(.*)$/s);
      if (!m) return;
      const [, prefix, numStr, suffix] = m;
      const hasComma = numStr.includes(",");
      const decimals = (numStr.split(".")[1] ?? "").length;
      const target = parseFloat(numStr.replace(/,/g, ""));
      const fmt = (n: number) => {
        let s = n.toFixed(decimals);
        if (hasComma) {
          const [int, dec] = s.split(".");
          s = Number(int).toLocaleString("en-US") + (dec ? "." + dec : "");
        }
        return prefix + s + suffix;
      };
      const obj = { v: 0 };
      el.textContent = fmt(0);
      // `immediate` plays on mount (above-the-fold stats); otherwise on scroll-in
      const immediate = binding.value?.immediate ?? false;
      const tween = gsap.to(obj, {
        v: target,
        duration: binding.value?.duration ?? 1.8,
        ease: "power2.out",
        delay: immediate ? 0.35 : 0,
        scrollTrigger: immediate
          ? undefined
          : { trigger: el, start: "top 90%", once: true },
        onUpdate: () => (el.textContent = fmt(obj.v)),
      });
      onCleanup(el, () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        el.textContent = raw;
      });
    },
    unmounted: runCleanup,
  };

  // ── v-split (word + char rise-in) ───────────────────────────────────────────
  const split: Directive<HTMLElement, SplitOpts | undefined> = {
    mounted(el, binding) {
      if (reduced) return;
      const text = (el.textContent ?? "").trim();
      if (!text) return;
      el.setAttribute("aria-label", text);
      el.textContent = "";
      const chars: HTMLElement[] = [];
      text.split(/(\s+)/).forEach((token) => {
        if (/^\s+$/.test(token)) {
          el.appendChild(document.createTextNode(" "));
          return;
        }
        const word = document.createElement("span");
        word.setAttribute("aria-hidden", "true");
        word.style.display = "inline-block";
        word.style.whiteSpace = "nowrap";
        for (const ch of token) {
          const c = document.createElement("span");
          c.textContent = ch;
          c.style.display = "inline-block";
          c.style.willChange = "transform, opacity";
          word.appendChild(c);
          chars.push(c);
        }
        el.appendChild(word);
      });
      const o = binding.value ?? {};
      const rect = el.getBoundingClientRect();
      const isInitiallyVisible =
        rect.top < window.innerHeight * 0.92 &&
        rect.bottom > -window.innerHeight * 0.1;
      const tween = gsap.from(chars, {
        yPercent: 115,
        opacity: 0,
        rotateZ: 5,
        duration: 0.85,
        ease: "power4.out",
        stagger: o.stagger ?? 0.022,
        delay: o.delay ?? 0,
        scrollTrigger:
          o.scroll === false || isInitiallyVisible
            ? undefined
            : { trigger: el, start: o.start ?? "top 88%", once: true },
      });
      onCleanup(el, () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    },
    unmounted: runCleanup,
  };

  // ── v-spotlight (cursor-tracking glow over cards) ───────────────────────────
  const spotlight: Directive<HTMLElement, string | undefined> = {
    mounted(el, binding) {
      if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
      const color = binding.value ?? "rgba(70,200,255,0.20)";
      const overlay = document.createElement("div");
      overlay.style.cssText =
        "position:absolute;inset:0;border-radius:inherit;pointer-events:none;" +
        "opacity:0;transition:opacity .35s ease;mix-blend-mode:screen;z-index:3;";
      if (getComputedStyle(el).position === "static")
        el.style.position = "relative";
      el.appendChild(overlay);
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        overlay.style.background = `radial-gradient(220px circle at ${e.clientX - r.left}px ${e.clientY - r.top}px, ${color}, transparent 60%)`;
      };
      const enter = () => (overlay.style.opacity = "1");
      const leave = () => (overlay.style.opacity = "0");
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
      onCleanup(el, () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
        overlay.remove();
      });
    },
    unmounted: runCleanup,
  };

  // ── v-skew (scroll-velocity shear — the "alive" awwwards feel) ───────────────
  const skew: Directive<HTMLElement, number | undefined> = {
    mounted(el, binding) {
      if (reduced) return;
      const factor = binding.value ?? 0.18;
      const skewTo = gsap.quickTo(el, "skewY", {
        duration: 0.5,
        ease: "power3",
      });
      const tick = () =>
        skewTo(gsap.utils.clamp(-6, 6, velocity.value * factor));
      gsap.ticker.add(tick);
      onCleanup(el, () => {
        gsap.ticker.remove(tick);
        gsap.set(el, { skewY: 0 });
      });
    },
    unmounted: runCleanup,
  };

  const app = nuxtApp.vueApp;
  app.directive("reveal", reveal);
  app.directive("parallax", parallax);
  app.directive("magnetic", magnetic);
  app.directive("tilt", tilt);
  app.directive("count", count);
  app.directive("split", split);
  app.directive("spotlight", spotlight);
  app.directive("skew", skew);

  // Recompute trigger positions once the first page has settled (fonts, images,
  // Lenis) so above-the-fold animations measure correctly on initial load.
  if (import.meta.client) {
    nuxtApp.hook("app:mounted", () =>
      requestAnimationFrame(() => ScrollTrigger.refresh()),
    );
    window.addEventListener("load", () => ScrollTrigger.refresh(), {
      once: true,
    });
  }

  // ── Lenis smooth scroll (client, motion-safe) ───────────────────────────────
  if (import.meta.client && !reduced) {
    import("lenis").then(({ default: Lenis }) => {
      const lenis = new Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenis.on("scroll", (e: { velocity: number }) => {
        ScrollTrigger.update();
        velocity.value = e.velocity;
      });
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      _lenis = lenis;

      // scroll reset + trigger refresh on route change. Refresh again after the
      // page-enter transition settles so above-the-fold reveals measure correctly
      // and actually fire (otherwise the new page can render blank).
      nuxtApp.hook("page:finish", () => {
        lenis.scrollTo(0, { immediate: true });
        requestAnimationFrame(() => ScrollTrigger.refresh());
        setTimeout(() => ScrollTrigger.refresh(), 300);
        setTimeout(() => ScrollTrigger.refresh(), 750);
      });
    });
  }
});

interface RevealOpts {
  y?: number;
  scale?: number;
  duration?: number;
  ease?: string;
  delay?: number;
  start?: string;
  stagger?: number;
  selector?: string;
}
interface SplitOpts {
  delay?: number;
  stagger?: number;
  start?: string;
  scroll?: boolean;
}
