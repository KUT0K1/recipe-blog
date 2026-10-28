// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Deployment target is configured via environment so the same code builds for
// GitHub Pages project paths (https://<user>.github.io/<repo>/) and for a
// custom domain served from the root (https://example.com/).
//   SITE_URL  – origin of the deployed site, e.g. https://kut0k1.github.io
//   BASE_PATH – path prefix, e.g. /recipe-blog or /
const site = process.env.SITE_URL ?? "https://kut0k1.github.io";
const base = process.env.BASE_PATH ?? "/recipe-blog";

export default defineConfig({
  site,
  base,
  trailingSlash: "always",
  output: "static",
  integrations: [
    react(),
    sitemap({
      // Skip the 404 page and the root page (it only forwards to /de/).
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, "");
        return !path.endsWith("/404") && path !== base.replace(/\/$/, "");
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
