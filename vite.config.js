import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In production, Vercel runs the files in /api as Node.js serverless functions.
// This small plugin runs the same files during local development, so
// `npm run dev` behaves like the deployed site.
function localApi() {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use("/api", async (req, res, next) => {
        const name = req.url.split("?")[0].replace(/^\/+/, "");
        if (!/^[a-z-]+$/.test(name)) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`);
          await mod.default(req, res);
        } catch {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApi()],
});
