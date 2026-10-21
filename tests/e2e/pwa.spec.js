import { test, expect } from "@playwright/test";

// These tests need the real service worker.
test.use({ serviceWorkers: "allow" });

const savedBook = {
  version: 2,
  books: [{ key: "/works/OL9000001W", title: "Na Drini ćuprija", authors: ["Ivo Andrić"], year: 1945, coverId: null, status: "reading", myRating: 5, note: "", addedAt: 1, updatedAt: 1, finishedAt: null }],
  recent: [],
  settings: {},
};

test("manifest is complete and its icons exist", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifest = await (await request.get(`/${href}`)).json();
  expect(manifest).toMatchObject({ short_name: "Knjigoteka", display: "standalone", start_url: expect.any(String) });
  expect(manifest.icons.some((i) => i.purpose === "maskable")).toBe(true);
  for (const icon of manifest.icons) {
    expect((await request.get(`/${icon.src}`)).ok(), icon.src).toBe(true);
  }
});

test("works offline after the first visit", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate((data) => localStorage.setItem("knjigoteka:v2", JSON.stringify(data)), savedBook);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  // setOffline() does not reach requests the service worker makes itself, so
  // on a machine with internet access (like a CI runner) its fetches to Open
  // Library still succeeded and the page showed "no results" instead of the
  // offline state. Cut every non-local request explicitly; playwright.config.js
  // turns on service worker request interception so this applies to it too.
  await context.route((url) => url.hostname !== "localhost", (route) => route.abort("internetdisconnected"));
  await page.reload();
  await expect(page.locator("#offline-bar")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Šta čitaš sledeće?");
  await expect(page.getByRole("heading", { name: "Trenutno čitaš" })).toBeVisible();

  await page.goto("/#/shelf");
  await expect(page.locator(".bookcase .spine")).toHaveCount(1);

  await page.goto("/#/search?q=nesto-novo");
  await expect(page.getByRole("heading", { name: "Nema interneta" })).toBeVisible();
  await context.setOffline(false);
});
