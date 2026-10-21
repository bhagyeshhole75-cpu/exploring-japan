import { useCallback, useEffect, useMemo, useState } from "react";

function Chip({ active, onClick, children }) {
  return (
    <button className={`chip ${active ? "active" : ""}`} onClick={onClick} aria-pressed={active}>
      {children}
    </button>
  );
}

function ShopCard({ shop, categoryName, onOpen }) {
  return (
    <button className="shop-card" onClick={() => onOpen(shop)}>
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
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const credit = shop.photo.credit;

  return (
    <div className="modal-backdrop" onClick={onClose}>
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
  const [city, setCity] = useState("All");
  const [category, setCategory] = useState("all");
  const [open, setOpen] = useState(null);
  const close = useCallback(() => setOpen(null), []);

  const catName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);
  const visible = shops.filter(
    (s) => (city === "All" || s.city === city) && (category === "all" || s.category === category)
  );

  return (
    <section className="section" id="shops">
      <header className="section-head center">
        <p className="label">§02 / The shops</p>
        <h2>
          Fourteen shops.
          <br />
          Every one worth the trip.
        </h2>
        <p className="section-sub">
          Markets, makers and pop-culture temples. Filter by city or by what you love, and tap a card for
          the full story.
        </p>
      </header>

      <div className="filters">
        <div className="chip-row" aria-label="Filter by city">
          {["All", ...cities].map((c) => (
            <Chip key={c} active={city === c} onClick={() => setCity(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <div className="chip-row" aria-label="Filter by type">
          <Chip active={category === "all"} onClick={() => setCategory("all")}>
            Everything
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
              {c.name}
            </Chip>
          ))}
        </div>
        <p className={`data-source source-${source}`}>
          {visible.length} of {shops.length} shops ·{" "}
          {source === "api" ? "data served by our Node.js API" : source === "fallback" ? "offline copy" : "loading…"}
        </p>
      </div>

      <div className="shop-grid">
        {visible.map((shop) => (
          <ShopCard key={shop.id} shop={shop} categoryName={catName[shop.category]} onOpen={setOpen} />
        ))}
        {visible.length === 0 && (
          <p className="empty">
            No shops match that mix yet. Try another city or type.
          </p>
        )}
      </div>

      {open && <ShopModal shop={open} categoryName={catName[open.category]} onClose={close} />}
    </section>
  );
}
