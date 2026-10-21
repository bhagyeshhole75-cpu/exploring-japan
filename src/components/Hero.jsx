import { Canvas } from "@react-three/fiber";
import ToriiScene from "./ToriiScene.jsx";
import useInView from "../hooks/useInView.js";
import useReducedMotion from "../hooks/useReducedMotion.js";

export default function Hero({ shopCount, cityCount }) {
  const [ref, inView] = useInView();
  const reducedMotion = useReducedMotion();

  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="kicker">日本の名店 · A shopping guide</p>
        <h1>
          Exploring Japan,
          <br />
          one shop at a time.
        </h1>
        <p className="hero-sub">
          {shopCount} famous and special shops across {cityCount} regions, from a 1560 knife maker to
          the discount store that never sleeps.
        </p>
        <a className="btn btn-dark" href="#shops">
          Explore the shops <span aria-hidden>→</span>
        </a>
        <p className="hero-note">Tokyo · Kyoto · Osaka · Hokkaido</p>
      </div>

      <div className="window" ref={ref}>
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
          <div className="stage-caption">
            <span>The gate</span>
            <p>A torii marks the entrance to a Shinto shrine. Here it marks the entrance to this guide.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
