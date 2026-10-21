import { SHOPS, CITIES, CATEGORIES } from "./_shops.js";
import { CREDITS } from "./_credits.js";

// GET /api/shops?city=Tokyo&category=food
// Returns the shop list (optionally filtered) with each photo's credit attached.
export default function handler(req, res) {
  const params = new URL(req.url, "http://localhost").searchParams;
  const city = params.get("city");
  const category = params.get("category");

  const shops = SHOPS.filter((s) => (!city || s.city === city) && (!category || s.category === category)).map(
    (s) => ({
      ...s,
      photo: { small: `/shops/${s.id}-sm.jpg`, large: `/shops/${s.id}.jpg`, credit: CREDITS[s.id] },
    })
  );

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  // Cache at Vercel's CDN for an hour, so most visitors never wake the function.
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.end(JSON.stringify({ count: shops.length, cities: CITIES, categories: CATEGORIES, shops }));
}
