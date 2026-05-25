import { defineConfig } from "astro/config";

export default defineConfig({
  outDir: "docs", // Ensure the site builds here for GitHub Pages compatibility
  base: "/recipe-blog/",
});