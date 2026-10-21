import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Most tests mock Open Library with page.route, which a service worker would bypass.
    // pwa.spec.js turns the service worker back on.
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `node scripts/serve.mjs app ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    // Tests read the Serbian interface; a Serbian browser gets it on the first visit.
    { name: "desktop", use: { ...devices["Desktop Chrome"], locale: "sr-RS" } },
    { name: "mobile", use: { ...devices["Pixel 7"], locale: "sr-RS" }, testIgnore: /pwa\.spec/ },
  ],
});
