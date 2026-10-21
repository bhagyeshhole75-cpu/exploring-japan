// GET /api/health  ->  which server answered, and what time it is in Tokyo.
export default function handler(req, res) {
  const tokyoTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).format(new Date());

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(
    JSON.stringify({
      ok: true,
      runtime: `Node.js ${process.version}`,
      region: process.env.VERCEL_REGION || "local",
      platform: process.env.VERCEL ? "Vercel Functions" : "Vite dev server",
      tokyoTime,
    })
  );
}
