import { useLayoutEffect, useRef, useState } from "react";

// Japanese names shown above each city.
const CITY_JP = { All: "日本", Tokyo: "東京", Kyoto: "京都", Osaka: "大阪", Hokkaido: "北海道" };

// Two-step filter:
//   Step 1 shows only the cities. A highlight slides to the one you pick.
//   Step 2 then animates open with just the categories that city has.
export default function ShopFilter({ shops, cities, categories, city, category, onCity, onCategory, onReset }) {
  const rowRef = useRef(null);
  const [pill, setPill] = useState(null); // position of the sliding highlight

  const options = [
    { value: "All", label: "All of Japan", count: shops.length },
    ...cities.map((c) => ({ value: c, label: c, count: shops.filter((s) => s.city === c).length })),
  ];

  // Categories available in the chosen city, with how many shops each has.
  const inCity = !city || city === "All" ? shops : shops.filter((s) => s.city === city);
  const subOptions = categories
    .map((c) => ({ ...c, count: inCity.filter((s) => s.category === c.id).length }))
    .filter((c) => c.count > 0);
  const cityLabel = city === "All" ? "Japan" : city;

  // Measure the active city button so the highlight can glide to it.
  useLayoutEffect(() => {
    const measure = () => {
      const btn = rowRef.current?.querySelector(".city-option.active");
      setPill(btn ? { left: btn.offsetLeft, top: btn.offsetTop, width: btn.offsetWidth, height: btn.offsetHeight } : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [city]);

  return (
    <div className="filter">
      {/* Step 1: where */}
      <p className="filter-step">
        <span>1</span> Where are you heading?
      </p>
      <div className={`city-row ${city ? "has-choice" : ""}`} ref={rowRef} role="radiogroup" aria-label="Choose a city">
        {pill && <span className="city-highlight" style={pill} aria-hidden="true" />}
        {options.map((o) => (
          <button
            key={o.value}
            role="radio"
            aria-checked={city === o.value}
            className={`city-option ${city === o.value ? "active" : ""}`}
            onClick={() => onCity(o.value)}
          >
            <span className="city-jp" lang="ja">
              {CITY_JP[o.value] ?? ""}
            </span>
            <span className="city-name">{o.label}</span>
            <em>{o.count}</em>
          </button>
        ))}
      </div>

      {/* Step 2: what (slides open once a city is chosen) */}
      <div className={`sub-filter ${city ? "open" : ""}`} aria-hidden={!city}>
        <div className="sub-inner">
          <p className="filter-step">
            <span>2</span> What are you into in {cityLabel}?
            <button className="filter-reset" onClick={onReset} tabIndex={city ? 0 : -1}>
              Reset
            </button>
          </p>
          {/* key: replay the staggered entrance each time the city changes */}
          <div className="sub-row" key={city ?? "none"} role="radiogroup" aria-label="Choose a type of shop">
            <button
              role="radio"
              aria-checked={category === "all"}
              className={`chip ${category === "all" ? "active" : ""}`}
              style={{ "--i": 0 }}
              onClick={() => onCategory("all")}
              tabIndex={city ? 0 : -1}
            >
              Everything <em>{inCity.length}</em>
            </button>
            {subOptions.map((c, i) => (
              <button
                key={c.id}
                role="radio"
                aria-checked={category === c.id}
                className={`chip ${category === c.id ? "active" : ""}`}
                style={{ "--i": i + 1 }}
                onClick={() => onCategory(c.id)}
                tabIndex={city ? 0 : -1}
              >
                {c.name} <em>{c.count}</em>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
