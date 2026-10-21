# Exploring Japan ⛩

A guide to 14 famous and special shops across Japan, from Tokyo's markets to a
Kyoto knife maker founded in 1560. The hero is a live **three.js** torii gate with
falling sakura petals, the interface is **React**, and the shop data comes from a
**Node.js** API deployed on **Vercel**.

**Live:** https://exploring-japan-bhagyesh.vercel.app

Built by Bhagyesh Hole (first-year Computer Science, VIT Pune) for the AWS Student
Builder Group pre-interview task.

## Features
- **3D hero:** a vermilion torii built from three.js shapes, a refractive glass "sun",
  140 sakura petals drawn in a single GPU call (instancing), bloom, and a camera
  that follows your pointer.
- **14 shops in 4 regions** (Tokyo, Kyoto, Osaka, Hokkaido). Filter by city or type, and
  open any shop for its story, what makes it special, and a local tip.
- **Real photos** from Wikimedia Commons under free licences, with every photographer credited.
- **Shopping tips and a FAQ** for first-time visitors.
- **Live cloud panel:** pings the API and shows the Node.js version, region, round-trip time
  and the current time in Tokyo.
- Responsive, pauses 3D when it's off screen, and respects "reduce motion".

## Tech stack
| Layer    | Tool                                         | What it does here |
|----------|----------------------------------------------|-------------------|
| UI       | React 19                                     | Components, filters, modal, FAQ |
| 3D       | three.js via React Three Fiber, drei, postprocessing | Torii, glass, petals, bloom |
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
│   │   ├── ToriiScene.jsx  # the three.js scene
│   │   ├── Hero.jsx, Nav.jsx, Shops.jsx, Sections.jsx, ToriiIcon.jsx
│   ├── hooks/         # useShops, useInView, useReducedMotion
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
