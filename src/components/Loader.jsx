import { useEffect, useRef, useState } from "react";
import { lockScroll, reducedMotion } from "../lib/smooth.js";

// The torii's strokes, in the order they're drawn (pillars, beams, strut).
const STROKES = [
  "M30 22 V96",
  "M90 22 V96",
  "M8 16 C 40 24, 80 24, 112 16",
  "M14 28 H106",
  "M22 46 H98",
  "M60 28 V46",
];

// Opening screen (inspired by ivress): a torii draws itself while a percentage
// counts up. It finishes once fonts and the page have loaded, then the
// curtain lifts.
export default function Loader({ onDone }) {
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const ready = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      onDone();
      return;
    }
    lockScroll(true);
    const pageLoaded = new Promise((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", r, { once: true })));
    const timeout = new Promise((r) => setTimeout(r, 3500)); // never wait forever
    Promise.race([Promise.all([document.fonts?.ready, pageLoaded]), timeout]).then(() => (ready.current = true));

    const start = performance.now();
    let last = start;
    let value = 0;
    let raf;
    const tick = (now) => {
      const elapsed = now - start;
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      // Creep towards 90% while loading, then run to 100% once ready
      // (but always show the animation for at least 1.1 s).
      const target = ready.current && elapsed > 1100 ? 100 : Math.min(90, elapsed / 14);
      // Time-based easing, so slow devices count up just as quickly.
      value += (target - value) * (1 - Math.exp(-dt * 6));
      if (target === 100 && value > 99.4) value = 100;
      setPct(Math.floor(value));
      if (value < 100) raf = requestAnimationFrame(tick);
      else {
        setLeaving(true);
        setTimeout(() => {
          lockScroll(false);
          onDone();
        }, 950);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  if (reducedMotion) return null;

  return (
    <div className={`loader ${leaving ? "leaving" : ""}`} role="status" aria-label={`Loading ${pct}%`}>
      <svg className="loader-torii" viewBox="0 0 120 100" aria-hidden="true">
        {STROKES.map((d, i) => {
          // Each stroke draws in turn as the percentage rises.
          const share = 100 / STROKES.length;
          const drawn = Math.min(1, Math.max(0, (pct - i * share) / share));
          return <path key={i} d={d} pathLength="1" style={{ strokeDashoffset: 1 - drawn }} />;
        })}
      </svg>
      <p className="loader-pct">
        {pct}
        <small>%</small>
      </p>
      <p className="loader-text" lang="ja">
        日本を探検する
      </p>
    </div>
  );
}
