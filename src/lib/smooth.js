import Lenis from "lenis";
import "lenis/dist/lenis.css";

// Smooth scrolling with Lenis: the page glides to a stop instead of jumping
// line by line. Skipped entirely if the visitor prefers reduced motion.
export const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const lenis = reducedMotion
  ? null
  : new Lenis({
      autoRaf: true, // Lenis runs its own animation loop
      lerp: 0.09, // lower = smoother and slower
      anchors: { offset: -16 }, // make #links glide too
    });

// Scroll to an element or position, smoothly when Lenis is active.
export function scrollToTarget(target) {
  if (lenis) {
    lenis.scrollTo(target, { offset: -16, duration: 1.4 });
  } else {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    el?.scrollIntoView();
  }
}

// Freeze page scrolling (e.g. while a modal is open).
export function lockScroll(locked) {
  if (lenis) locked ? lenis.stop() : lenis.start();
  document.documentElement.style.overflow = locked ? "hidden" : "";
}
