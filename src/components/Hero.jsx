import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import ToriiScene from "./ToriiScene.jsx";
import SplitText from "./SplitText.jsx";
import RingText from "./RingText.jsx";
import useInView from "../hooks/useInView.js";
import { reducedMotion } from "../lib/smooth.js";

export default function Hero({ shopCount, cityCount, loaded }) {
  const [ref, inView] = useInView();
  const hero = useRef(null);

  // Scroll-linked parallax: as you scroll, the headline drifts up and fades
  // while the 3D window grows to full size. Written to a CSS variable (--hp).
  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.75)));
      hero.current?.style.setProperty("--hp", p.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className={`hero ${loaded ? "is-ready" : ""}`} id="top" ref={hero} data-chapter="The gate">
      <div className="hero-copy">
        <p className="kicker fade-up" style={{ "--delay": "0ms" }}>
          日本の名店 · A shopping guide
        </p>
        <SplitText as="h1" text={"Exploring Japan,\none shop at a time."} trigger={loaded} delay={120} />
        <p className="hero-sub fade-up" style={{ "--delay": "700ms" }}>
          {shopCount} famous and special shops across {cityCount} regions, from a 1560 knife maker to
          the discount store that never sleeps.
        </p>
        <div className="fade-up" style={{ "--delay": "850ms" }}>
          <a className="btn btn-dark" href="#landmarks">
            Begin the journey <span aria-hidden>→</span>
          </a>
        </div>
        <p className="hero-note fade-up" style={{ "--delay": "1000ms" }}>
          Tokyo · Kyoto · Osaka · Hokkaido
        </p>
      </div>

      <div className="window fade-up" style={{ "--delay": "500ms" }} ref={ref}>
        <div className="window-bar">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          <span className="window-title">torii.jsx · rendered live with three.js</span>
          <span className="window-tag">§01</span>
        </div>
        <div className="window-stage">
          <Canvas
            camera={{ position: [0, 0.2, 6.5], fov: 38 }}
            dpr={[1, 2]}
            frameloop={inView ? "always" : "never"}
          >
            <ToriiScene animate={!reducedMotion} />
          </Canvas>
          <RingText />
          <div className="stage-caption">
            <span>The gate</span>
            <p>A torii marks the entrance to a Shinto shrine. Here it marks the entrance to this guide.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
