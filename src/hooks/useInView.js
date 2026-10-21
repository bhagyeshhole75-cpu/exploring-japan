import { useEffect, useRef, useState } from "react";

// True while the element is on screen. Used to pause 3D rendering when it's
// scrolled out of view, which saves battery and GPU.
export default function useInView(rootMargin = "100px") {
  const ref = useRef(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [rootMargin]);
  return [ref, inView];
}
