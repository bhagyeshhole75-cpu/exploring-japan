import { useEffect, useState } from "react";
import { SHOPS, CITIES, CATEGORIES } from "../../api/_shops.js";
import { CREDITS } from "../../api/_credits.js";

// Built-in copy, used until the API answers (or if it can't be reached).
const FALLBACK = {
  cities: CITIES,
  categories: CATEGORIES,
  shops: SHOPS.map((s) => ({
    ...s,
    photo: { small: `/shops/${s.id}-sm.jpg`, large: `/shops/${s.id}.jpg`, credit: CREDITS[s.id] },
  })),
};

// Loads the shop list from our Node.js API (/api/shops).
export default function useShops() {
  const [data, setData] = useState(FALLBACK);
  const [source, setSource] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/shops")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((json) => {
        if (cancelled) return;
        setData(json);
        setSource("api");
      })
      .catch(() => !cancelled && setSource("fallback"));
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...data, source };
}
