import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import Shops from "./components/Shops.jsx";
import { Tips, Faq, CloudStatus, Footer, FloatingBar } from "./components/Sections.jsx";
import useShops from "./hooks/useShops.js";

export default function App() {
  const { shops, cities, categories, source } = useShops();

  return (
    <>
      <Nav />
      <main>
        <Hero shopCount={shops.length} cityCount={cities.length} />
        <div className="dark-zone">
          <Shops shops={shops} cities={cities} categories={categories} source={source} />
          <Tips />
          <Faq />
          <CloudStatus shopCount={shops.length} />
        </div>
      </main>
      <Footer shops={shops} />
      <FloatingBar />
    </>
  );
}
