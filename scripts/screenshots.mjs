// Captures README images and manifest screenshots with mocked data.
// Usage: npm start (in another terminal), then: node scripts/screenshots.mjs
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { mockOpenLibrary } from "../tests/e2e/mock-api.js";

const BASE = process.env.BASE_URL || "http://localhost:4173/";
const fx = (n) => JSON.parse(readFileSync(new URL(`../tests/fixtures/${n}`, import.meta.url)));
const docs = [...fx("search-page1.json").docs.slice(0, 12), ...fx("trending.json").works];
const statuses = ["read", "read", "reading", "want", "read", "want", "read", "want", "read", "reading", "want", "read", "read", "want", "read", "want", "read", "want", "read", "want", "want", "read"];
const now = Date.UTC(2026, 9, 18);
const books = docs.map((d, i) => ({
  key: d.key, title: d.title, authors: d.author_name, year: d.first_publish_year, coverId: null,
  pages: d.number_of_pages_median, editions: d.edition_count, status: statuses[i] || "want",
  myRating: statuses[i] === "read" ? 3 + (i % 3) : 0, note: "", addedAt: now - i * 86400000, updatedAt: now - i * 86400000,
  finishedAt: statuses[i] === "read" ? now - i * 86400000 : null,
}));
const state = { version: 2, books, recent: ["andrić", "tolkien", "dostojevski"], settings: {} };

const browser = await chromium.launch();
async function shoot(name, path, { width, height, dpr = 1, theme = "light", full = false, seed = true, before } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, colorScheme: theme, serviceWorkers: "block" });
  await mockOpenLibrary(context);
  if (seed) await context.addInitScript((s) => { if (!localStorage.getItem("knjigoteka:v2")) localStorage.setItem("knjigoteka:v2", s); }, JSON.stringify(state));
  const page = await context.newPage();
  await page.goto(BASE + path);
  await page.waitForLoadState("networkidle");
  if (before) await before(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: name, fullPage: full });
  await context.close();
  console.log("saved", name);
}

await shoot("app/screenshots/wide-home.png", "", { width: 1280, height: 800 });
await shoot("app/screenshots/narrow-shelf.png", "#/shelf", { width: 390, height: 844 });
await shoot("docs/home.png", "", { width: 1280, height: 800, dpr: 2 });
await shoot("docs/search.png", "#/search?q=andri%C4%87", { width: 1280, height: 800, dpr: 2 });
await shoot("docs/book.png", "#/book/OL9000001W", { width: 1280, height: 900, dpr: 2 });
await shoot("docs/shelf.png", "#/shelf", { width: 1280, height: 860, dpr: 2 });
await shoot("docs/shelf-dark.png", "#/shelf", { width: 1280, height: 860, dpr: 2, theme: "dark" });
await shoot("docs/mobile-home.png", "", { width: 390, height: 844, dpr: 3 });
await shoot("docs/mobile-book.png", "#/book/OL9000001W", { width: 390, height: 844, dpr: 3, before: (p) => p.evaluate(() => window.scrollTo(0, 420)) });
await shoot("docs/mobile-shelf-dark.png", "#/shelf", { width: 390, height: 844, dpr: 3, theme: "dark" });
await browser.close();
