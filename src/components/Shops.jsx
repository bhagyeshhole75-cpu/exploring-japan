import { useCallback, useEffect, useMemo, useState } from "react";
import SplitText from "./SplitText.jsx";
import Reveal from "./Reveal.jsx";
import ShopFilter from "./ShopFilter.jsx";
import { lockScroll } from "../lib/smooth.js";

function ShopCard({ shop, categoryName, onOpen, index }) {
  return (
    <button className="shop-card stagger" style={{ "--i": index }} onClick={() => onOpen(shop)}>
      <div className="shop-photo">
        <img src={shop.photo.small} alt={`${shop.name}, ${shop.area}`} loading="lazy" width="640" height="400" />
        <span className="shop-cat">{categoryName}</span>
      </div>
      <div className="shop-body">
        <p className="shop-where">
          {shop.city} · {shop.area}
        </p>
        <h3>
          {shop.name} <span lang="ja">{shop.jp}</span>
        </h3>
        <p className="shop-tag">{shop.tagline}</p>
        <span className="shop-more">Read more →</span>
      </div>
    </button>
  );
}

function ShopModal({ shop, categoryName, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    lockScroll(true);
    return () => {
      document.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [onClose]);

  const credit = shop.photo.credit;

  return (
    <div className="modal-backdrop" onClick={onClose} data-lenis-prevent>
      <article
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={shop.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="modal-photo">
          <img src={shop.photo.large} alt={`${shop.name}, ${shop.area}`} />
        </div>
        <div className="modal-body">
          <p className="shop-where">
            {categoryName} · {shop.city} · {shop.area}
          </p>
          <h3>
            {shop.name} <span lang="ja">{shop.jp}</span>
          </h3>
          <p className="modal-about">{shop.about}</p>

          <h4>Why it's special</h4>
          <ul className="special">
            {shop.special.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>

          <div className="tip">
            <span>Local tip</span>
            <p>{shop.tip}</p>
          </div>

          {credit && (
            <p className="credit">
              Photo:{" "}
              <a href={credit.source} target="_blank" rel="noreferrer">
                {credit.author || "Wikimedia Commons"}
              </a>
              ,{" "}
              {credit.licenseUrl ? (
                <a href={credit.licenseUrl} target="_blank" rel="noreferrer">
                  {credit.license}
                </a>
              ) : (
                credit.license
              )}
              , via Wikimedia Commons
            </p>
          )}
        </div>
      </article>
    </div>
  );
}

export default function Shops({ shops, cities, categories, source }) {
  const [city, setCity] = useState(null); // null until a city is chosen (step 1)
  const [category, setCategory] = useState("all");
  const [open, setOpen] = useState(null);
  const close = useCallback(() => setOpen(null), []);

  const catName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);
  const visible = shops.filter(
    (s) => (!city || city === "All" || s.city === city) && (category === "all" || s.category === category)
  );

  const chooseCity = (c) => {
    setCity(c);
    setCategory("all"); // each city has its own set of types
  };
  const reset = () => {
    setCity(null);
    setCategory("all");
  };

  return (
    <section className="section" id="shops" data-chapter="Shops">
      <header className="section-head center">
        <Reveal as="p" className="label">
          §03 / The shops
        </Reveal>
        <SplitText text={"Fourteen shops.\nEvery one worth the trip."} />
        <Reveal as="p" className="section-sub">
          Markets, makers and pop-culture temples. Pick a city, then what you love, and tap a card for the
          full story.
        </Reveal>
      </header>

      <Reveal className="filters">
        <ShopFilter
          shops={shops}
          cities={cities}
          categories={categories}
          city={city}
          category={category}
          onCity={chooseCity}
          onCategory={setCategory}
          onReset={reset}
        />
        <p className={`data-source source-${source}`}>
          Showing {visible.length} of {shops.length} shops
          {city && city !== "All" ? ` in ${city}` : ""}
          {category !== "all" ? ` · ${catName[category]}` : ""} ·{" "}
          {source === "api" ? "data served by our Node.js API" : source === "fallback" ? "offline copy" : "loading…"}
        </p>
      </Reveal>

      {/* key: re-run the staggered entrance whenever the filters change */}
      <Reveal className="shop-grid" key={`${city}-${category}`}>
        {visible.map((shop, i) => (
          <ShopCard key={shop.id} index={i} shop={shop} categoryName={catName[shop.category]} onOpen={setOpen} />
        ))}
        {visible.length === 0 && (
          <p className="empty">
            No shops match that mix yet. Try another city or type.
          </p>
        )}
      </Reveal>

      {open && <ShopModal shop={open} categoryName={catName[open.category]} onClose={close} />}
    </section>
  );
}
