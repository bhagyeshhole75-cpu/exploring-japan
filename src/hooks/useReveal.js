import { useEffect, useRef, useState } from "react";

// Adds "is-in" once the element scrolls into view, which triggers the CSS
// reveal animations (text rising in, cards sliding up).
// threshold 0 = trigger as soon as any part is on screen. (A percentage
// threshold breaks for very tall elements: a 4,000 px card list on a phone can
// never be 20% visible, so it would never appear.)
export default function useReveal({ threshold = 0, rootMargin = "0px 0px -10% 0px" } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Also reveal anything already scrolled past (e.g. after jumping to a
        // chapter), so nothing stays hidden above the screen.
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, inView];
}
