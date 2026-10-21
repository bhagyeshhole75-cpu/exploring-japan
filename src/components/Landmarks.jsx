import { useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import LandmarksScene from "./LandmarksScene.jsx";
import useInView from "../hooks/useInView.js";
import useScrollProgress from "../hooks/useScrollProgress.js";
import { reducedMotion } from "../lib/smooth.js";

// Captions shown as you scroll. "from" is the scroll progress (0–1) where each
// one appears. Facts checked against Wikipedia.
const CHAPTERS = [
  {
    from: 0,
    jp: "東京タワー",
    kicker: "Tokyo · Minato",
    title: "Tokyo Tower",
    text: "332.9 metres of steel lattice, completed in 1958. It was Japan's tallest tower until Tokyo Skytree opened in 2012.",
  },
  {
    from: 0.065,
    jp: "東京タワー",
    kicker: "Inspired by Paris",
    title: "White and international orange",
    text: "The design was inspired by the Eiffel Tower, and it's painted in bands of white and international orange to meet air-safety rules. Visitors ride up to the Main Deck at 150 m and the Top Deck at 249.6 m.",
  },
  {
    from: 0.13,
    jp: "お土産",
    kicker: "Shopping at the base",
    title: "FootTown",
    text: "At its foot sits FootTown, a five-storey base building full of restaurants and gift shops, so even the tower is a shopping trip.",
  },
  {
    from: 0.2,
    jp: "伏見稲荷大社",
    kicker: "Kyoto · Fushimi",
    title: "Fushimi Inari Taisha",
    text: "Founded in 711, it's the head shrine of Inari: the kami of rice and agriculture, whom merchants also worship as the patron of business.",
  },
  {
    from: 0.3,
    jp: "千本鳥居",
    kicker: "Senbon Torii",
    title: "A tunnel of gates",
    text: "Each of the shrine's roughly 10,000 torii was donated by a Japanese business. About 800 stand in a row as the Senbon Torii, forming a tunnel up the mountain.",
  },
  {
    from: 0.43,
    jp: "金閣寺",
    kicker: "Kyoto · Kitayama",
    title: "Kinkaku-ji",
    text: "The Temple of the Golden Pavilion: a Zen temple whose top two floors are coated in gold leaf, glowing back from the pond in front of it.",
  },
  {
    from: 0.52,
    jp: "金閣",
    kicker: "Since 1397",
    title: "Burned, then rebuilt",
    text: "Its story begins in 1397 with the shōgun Ashikaga Yoshimitsu. The pavilion was destroyed by arson in 1950 and rebuilt in 1955, and today it's part of a UNESCO World Heritage Site.",
  },
  {
    from: 0.61,
    jp: "姫路城",
    kicker: "Himeji · Hyōgo",
    title: "Himeji Castle",
    text: "Known as the 'White Heron Castle' for its brilliant white walls, it became a UNESCO World Heritage Site in 1993.",
  },
  {
    from: 0.7,
    jp: "白鷺城",
    kicker: "Since 1333",
    title: "83 structures, one masterpiece",
    text: "Its history goes back to 1333, with major expansion from 1601 to 1609. It's regarded as the finest surviving example of a classic Japanese castle.",
  },
  {
    from: 0.8,
    jp: "富士山",
    kicker: "Shizuoka · Yamanashi",
    title: "Mount Fuji",
    text: "At 3,776 m it's Japan's highest mountain, an active volcano that last erupted in 1707–08. It stands about 100 km from Tokyo and can be seen from the city on clear days.",
  },
  {
    from: 0.9,
    jp: "霊峰",
    kicker: "A sacred mountain",
    title: "Snow, lakes and pilgrims",
    text: "One of Japan's 'Three Holy Mountains', snow-capped for about five months a year, and a UNESCO World Heritage cultural site since 2013. The Fuji Five Lakes at its foot were formed by its own lava flows.",
  },
];

export default function Landmarks() {
  const section = useRef(null);
  const [viewRef, inView] = useInView("200px");
  const [chapter, setChapter] = useState(0);
  // The progress bar and hint update every frame, so they're changed directly
  // on the DOM instead of through React state (no re-render per frame).
  const barRef = useRef(null);
  const hintRef = useRef(null);

  const onProgress = useCallback((p) => {
    let idx = 0;
    CHAPTERS.forEach((c, i) => p >= c.from && (idx = i));
    setChapter((prev) => (prev === idx ? prev : idx));
    if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    if (hintRef.current) hintRef.current.classList.toggle("hide", p > 0.04);
  }, []);
  const progress = useScrollProgress(section, onProgress);

  const current = CHAPTERS[chapter];

  return (
    <section className="landmarks" id="landmarks" ref={section} data-chapter="Landmarks">
      <div className="landmarks-sticky" ref={viewRef}>
        <Canvas
          className="landmarks-canvas"
          camera={{ position: [0.6, 0.5, 9.5], fov: 45, near: 0.1, far: 200 }}
          dpr={[1, 1.75]}
          frameloop={inView ? "always" : "never"}
        >
          <LandmarksScene progress={progress} animate={!reducedMotion} />
        </Canvas>

        <div className="landmarks-ui">
          <p className="label landmarks-label">§02 / Landmarks</p>

          <div className="landmarks-caption" key={chapter}>
            <p className="caption-kicker">{current.kicker}</p>
            <h3>{current.title}</h3>
            <p>{current.text}</p>
          </div>

          <p className="tategaki" lang="ja" key={`jp-${current.jp}`} aria-hidden="true">
            {current.jp}
          </p>

          <div className="landmarks-foot">
            <span className="counter">
              {String(chapter + 1).padStart(2, "0")} <i>/</i> {String(CHAPTERS.length).padStart(2, "0")}
            </span>
            <span className="progress">
              <i ref={barRef} />
            </span>
            <span className="scroll-hint" ref={hintRef}>
              Scroll to continue ↓
            </span>
          </div>

          <p className="model-note">3D models are stylised and built from code with three.js.</p>
        </div>
      </div>
    </section>
  );
}
