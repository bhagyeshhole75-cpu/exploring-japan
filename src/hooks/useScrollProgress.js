import { useEffect, useRef } from "react";

// Tracks how far the user has scrolled through a tall section, from 0 (top of
// the section reaches the top of the screen) to 1 (bottom reaches the bottom).
// Stored in a ref (not state) so the 3D scene can read it every frame without
// re-rendering React.
export default function useScrollProgress(sectionRef, onChange) {
  const progress = useRef(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      progress.current = p;
      onChange?.(p);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [sectionRef, onChange]);

  return progress;
}
