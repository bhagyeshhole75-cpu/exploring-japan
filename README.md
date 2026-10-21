# Exploring Japan ⛩

A guide to 14 famous and special shops across Japan, from Tokyo's markets to a
Kyoto knife maker founded in 1560. The hero is a live **three.js** torii gate with
falling sakura petals, the interface is **React**, and the shop data comes from a
**Node.js** API deployed on **Vercel**.

**Live:** https://exploring-japan-bhagyesh.vercel.app  
**Code:** https://github.com/bhagyeshhole75-cpu/exploring-japan

Built by Bhagyesh Hole (first-year Computer Science, VIT Pune) for the AWS Student
Builder Group pre-interview task.

## Features
- **Opening loader:** a torii draws itself stroke by stroke while a percentage counts up.
- **3D hero:** a vermilion torii built from three.js shapes, a refractive glass "sun",
  140 sakura petals drawn in a single GPU call (instancing), bloom, a camera that follows
  your pointer, and a ring of text spinning around the gate in CSS 3D.
- **Scroll-driven 3D journey through five landmarks**, all modelled in code with three.js.
  Scrolling flies the camera from place to place while the sky shifts from night to dawn,
  and captions, vertical Japanese titles and an 01 / 11 counter change as you go:
  1. **Tokyo Tower** at night over a lit-up city (scaled from the real 332.9 m height,
     with the Main Deck at 150 m and the Top Deck at 249.6 m).
  2. **Fushimi Inari Taisha**: the camera flies *through* a tunnel of 46 vermilion torii
     in a cedar forest (instanced: the gates are drawn in a handful of GPU calls).
  3. **Kinkaku-ji**, the Golden Pavilion, mirrored in its pond.
  4. **Himeji Castle** rising out of the mist at dusk, with falling sakura.
  5. **Mount Fuji** at dawn: a lathe-built cone with gullies, a jagged snowline and
     clouds, reflected in the lake at its foot.
- **Smooth motion:** Lenis smooth scrolling, headings that reveal letter by letter, cards
  that slide in one after another, scroll-linked parallax, and a floating chapter pill
  (01 / 06) for jumping between sections.
- **14 shops in 4 regions** (Tokyo, Kyoto, Osaka, Hokkaido). Choose a city, then a type, and
  open any shop for its story, what makes it special, and a local tip. The filter works in
  two steps: pick a city first, then the categories available there animate in.
- **Real photos** from Wikimedia Commons under free licences, with every photographer credited.
- **Shopping tips and a FAQ** for first-time visitors.
- **Live cloud panel:** pings the API and shows the Node.js version, region, round-trip time
  and the current time in Tokyo.
- Responsive, pauses 3D when it's off screen, and respects "reduce motion" (no smooth
  scrolling, no animation).

Design references: Shopify Editions (smooth scroll, split-letter headings, chapter pill),
ivress (loader, chapter storytelling, vertical Japanese text), ScreenTune and vanta.supply
(layout and glass look).

## Tech stack
| Layer    | Tool                                         | What it does here |
|----------|----------------------------------------------|-------------------|
| UI       | React 19                                     | Components, filters, modal, FAQ |
| Motion   | Lenis + CSS transitions + IntersectionObserver | Smooth scroll, reveals, parallax |
| 3D       | three.js via React Three Fiber, drei, postprocessing | Torii, Tokyo Tower, castle, city, petals, bloom |
| Backend  | Node.js serverless functions (`/api`)        | `GET /api/shops`, `GET /api/health` |
| Build    | Vite                                         | Dev server and production bundle |
| Hosting  | Vercel (functions pinned to `bom1`, Mumbai)  | CDN for static files and runs the API |

## API
```
GET /api/shops                 -> all shops, cities, categories
GET /api/shops?city=Kyoto      -> only Kyoto shops
GET /api/shops?category=food   -> only food & markets
GET /api/health                -> runtime, region, Tokyo time
```
`/api/shops` is cached at the CDN for an hour (`s-maxage=3600`), so most requests never
start the function.

## Project structure
```
exploring-japan/
├── api/
│   ├── _shops.js      # shop data (facts checked against Wikipedia)
│   ├── _credits.js    # photo authors and licences
│   ├── shops.js       # GET /api/shops
│   └── health.js      # GET /api/health
├── public/shops/      # photos (640px cards and 1200px detail versions)
├── src/
│   ├── components/
│   │   ├── ToriiScene.jsx      # hero 3D scene
│   │   ├── LandmarksScene.jsx  # scroll-driven 3D: camera path, sky, city
│   │   ├── models/             # TokyoTower, ToriiTunnel, GoldenPavilion, HimejiCastle,
│   │   │                       # MountFuji, Petals, shapes.js (all built from code)
│   │   ├── Loader.jsx, ChapterPill.jsx, SplitText.jsx, Reveal.jsx, RingText.jsx
│   │   ├── Hero.jsx, Landmarks.jsx, Nav.jsx, Shops.jsx, Sections.jsx
│   ├── hooks/         # useShops, useInView, useReveal, useScrollProgress
│   ├── lib/smooth.js  # Lenis smooth scrolling
│   ├── App.jsx
│   └── styles.css
├── vercel.json        # runs the API in Mumbai (bom1)
└── vite.config.js     # also runs /api locally during development
```

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:5173. The API routes work locally too.

## Deploy
```bash
npx vercel deploy --prod
```

## Photo credits
All photos come from [Wikimedia Commons](https://commons.wikimedia.org) under CC BY,
CC BY-SA or CC0 licences. Authors and licence links are listed in `api/_credits.js`
and shown on the site. Images were resized for the web.

Shop facts were checked against Wikipedia. Opening hours and rules change, so check
before you visit.
