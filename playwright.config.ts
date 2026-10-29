import { defineConfig, devices } from "@playwright/test";

// Smoke tests run against the production build served by `astro preview`.
// Run `npm run build` first.
const base = (process.env.BASE_PATH ?? "/recipe-blog").replace(/\/?$/, "/");

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:4321${base}`,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run preview -- --port 4321 --ignore-lock",
    url: `http://localhost:4321${base}`,
    reuseExistingServer: !process.env.CI,
  },
});
