/**
 * Motion directive option types (technical / UI).
 *
 * Binding-value shapes for the GSAP-backed directives registered in
 * app/plugins/motion.ts (v-reveal, v-reveal:stagger, v-split).
 */

/** Options for the v-reveal / v-reveal:stagger directives. */
export interface RevealOpts {
  y?: number;
  scale?: number;
  duration?: number;
  ease?: string;
  delay?: number;
  start?: string;
  stagger?: number;
  selector?: string;
}

/** Options for the v-split directive. */
export interface SplitOpts {
  delay?: number;
  stagger?: number;
  start?: string;
  scroll?: boolean;
}
