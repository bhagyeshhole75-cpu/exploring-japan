import { useCallback, useState } from "react";
import Loader from "./components/Loader.jsx";
import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import Landmarks from "./components/Landmarks.jsx";
import Shops from "./components/Shops.jsx";
import ChapterPill from "./components/ChapterPill.jsx";
import { Tips, Faq, CloudStatus, Footer } from "./components/Sections.jsx";
import useShops from "./hooks/useShops.js";
import "./lib/smooth.js"; // starts Lenis smooth scrolling

export default function App() {
  const { shops, cities, categories, source } = useShops();
  const [loaded, setLoaded] = useState(false);
  const onLoaded = useCallback(() => setLoaded(true), []);

  return (
    <>
      {!loaded && <Loader onDone={onLoaded} />}
      <Nav />
      <main>
        <Hero shopCount={shops.length} cityCount={cities.length} loaded={loaded} />
        <div className="dark-zone">
          <Landmarks />
          <Shops shops={shops} cities={cities} categories={categories} source={source} />
          <Tips />
          <Faq />
          <CloudStatus shopCount={shops.length} />
        </div>
      </main>
      <Footer shops={shops} />
      <ChapterPill />
    </>
  );
}
