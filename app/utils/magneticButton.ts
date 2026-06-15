import gsap from "gsap";

/**
 * MagneticButton — a reusable magnetic-hover utility (vanilla TS + GSAP).
 *
 * • Activates when the cursor comes within `radius` px of the button's box
 *   (proximity, not just hover), tracked off a single window pointermove.
 * • Pulls the button toward the cursor by `pull` (0–1) with a smooth lerp.
 * • Parallaxes the label: the inner text travels at `innerRatio` of the
 *   wrapper's speed (0.5 = half), creating depth between button and text.
 * • On leave, snaps both back to centre with an elastic ease.
 *
 * Usage:
 *   const mag = new MagneticButton(el, { radius: 40, pull: 0.4 });
 *   // ...later
 *   mag.destroy();
 */
export interface MagneticOptions {
  /** activation proximity from the button's edge, in px (default 40) */
  radius?: number;
  /** how hard the wrapper follows the cursor, 0–1 (default 0.4) */
  pull?: number;
  /** inner-text net speed relative to the wrapper, 0–1 (default 0.5 = half) */
  innerRatio?: number;
}

type QuickTo = (value: number) => void;

export class MagneticButton {
  private el: HTMLElement;
  private inner: HTMLElement;
  private radius: number;
  private pull: number;
  private innerRatio: number;
  private active = false;
  private resetTween: gsap.core.Tween | null = null;

  private xTo: QuickTo;
  private yTo: QuickTo;
  private ixTo: QuickTo;
  private iyTo: QuickTo;

  constructor(el: HTMLElement, opts: MagneticOptions = {}) {
    this.el = el;
    this.radius = opts.radius ?? 40;
    this.pull = opts.pull ?? 0.4;
    this.innerRatio = opts.innerRatio ?? 0.5;
    this.inner = this.wrapInner();

    const cfg = { duration: 0.4, ease: "power3" };
    this.xTo = gsap.quickTo(this.el, "x", cfg);
    this.yTo = gsap.quickTo(this.el, "y", cfg);
    this.ixTo = gsap.quickTo(this.inner, "x", cfg);
    this.iyTo = gsap.quickTo(this.inner, "y", cfg);

    window.addEventListener("pointermove", this.onMove, { passive: true });
  }

  /** Wrap the button's contents so the label can move independently. */
  private wrapInner(): HTMLElement {
    const existing = this.el.querySelector<HTMLElement>("[data-magnetic-inner]");
    if (existing) return existing;
    const span = document.createElement("span");
    span.setAttribute("data-magnetic-inner", "");
    const cs = getComputedStyle(this.el);
    const gap = cs.columnGap && cs.columnGap !== "normal" ? cs.columnGap : "0px";
    span.style.cssText = `display:inline-flex;align-items:center;justify-content:center;gap:${gap};will-change:transform;`;
    while (this.el.firstChild) span.appendChild(this.el.firstChild);
    this.el.appendChild(span);
    return span;
  }

  private onMove = (e: PointerEvent) => {
    const r = this.el.getBoundingClientRect();
    // distance from the cursor to the nearest point on the button's box
    const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
    const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
    const dist = Math.hypot(dx, dy);

    if (dist <= this.radius) {
      if (this.resetTween) {
        this.resetTween.kill();
        this.resetTween = null;
      }
      this.active = true;
      const mx = (e.clientX - (r.left + r.width / 2)) * this.pull;
      const my = (e.clientY - (r.top + r.height / 2)) * this.pull;
      this.xTo(mx);
      this.yTo(my);
      // The inner is a child, so it already inherits the wrapper's move; offset
      // it by (ratio − 1)·move so its *net* travel is innerRatio·move — the
      // label trails at half speed.
      const k = this.innerRatio - 1;
      this.ixTo(mx * k);
      this.iyTo(my * k);
    } else if (this.active) {
      this.active = false;
      this.snapBack();
    }
  };

  private snapBack() {
    const ease = "elastic.out(1, 0.3)";
    this.resetTween = gsap.to(this.el, {
      x: 0,
      y: 0,
      duration: 1.1,
      ease,
      overwrite: true,
    });
    gsap.to(this.inner, { x: 0, y: 0, duration: 1.1, ease, overwrite: true });
  }

  destroy() {
    window.removeEventListener("pointermove", this.onMove);
    gsap.killTweensOf([this.el, this.inner]);
    gsap.set([this.el, this.inner], { clearProps: "transform" });
  }
}
