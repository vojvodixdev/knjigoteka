/* =====================================================================
   Knjigoteka – service worker

   Caches                     Strategy                 Why
   ------------------------   ----------------------   ---------------------------------
   knjigoteka-shell-<ver>     precache, cache-first    app files change only on release
   knjigoteka-api             network-first + timeout  fresh results online, last copy offline
   knjigoteka-covers          cache-first, capped      covers never change

   Releasing a new version: change VERSION. The new worker installs in the
   background, the page shows "A new version is available", and only when
   the reader taps "Reload" does the worker take over (SKIP_WAITING).
   ===================================================================== */

const VERSION = "2.0.0";
const SHELL_CACHE = `knjigoteka-shell-${VERSION}`;
const API_CACHE = "knjigoteka-api";
const COVER_CACHE = "knjigoteka-covers";
const KEEP = [SHELL_CACHE, API_CACHE, COVER_CACHE];

const API_LIMIT = 150;     // stored API responses
const COVER_LIMIT = 400;   // stored cover images
const NETWORK_TIMEOUT = 7000;

const SHELL_FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "js/theme-init.js",
  "js/app.js",
  "js/api.js",
  "js/store.js",
  "js/router.js",
  "js/i18n.js",
  "js/ui.js",
  "js/util.js",
  "js/pwa.js",
  "js/views/home.js",
  "js/views/search.js",
  "js/views/book.js",
  "js/views/shelf.js",
  "fonts/literata-latin-wght-normal.woff2",
  "fonts/literata-latin-ext-wght-normal.woff2",
  "fonts/literata-cyrillic-wght-normal.woff2",
  "fonts/atkinson-hyperlegible-latin-400-normal.woff2",
  "fonts/atkinson-hyperlegible-latin-700-normal.woff2",
  "fonts/atkinson-hyperlegible-latin-ext-400-normal.woff2",
  "fonts/atkinson-hyperlegible-latin-ext-700-normal.woff2",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "icons/apple-touch-icon.png",
];

/* ---------- lifecycle ---------- */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES.map((url) => new Request(url, { cache: "reload" }))))
  );
  // No skipWaiting() here: an update waits until the reader agrees to reload.
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.filter((name) => name.startsWith("knjigoteka") && !KEEP.includes(name)).map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

/* ---------- routing ---------- */

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    // Page loads (also deep links like /?source=pwa) get the cached app shell
    if (request.mode === "navigate") {
      event.respondWith(appShell(request));
      return;
    }
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  if (url.hostname === "openlibrary.org" && /^\/(search\.json|works\/OL\d+W\.json|trending\/)/.test(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.hostname === "covers.openlibrary.org") {
    event.respondWith(cacheFirst(request, COVER_CACHE, COVER_LIMIT));
  }
});

/* ---------- strategies ---------- */

async function appShell(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match("index.html");
  if (cached) return cached;
  try {
    return await fetch(request);
  } catch {
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

async function cacheFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: cacheName === SHELL_CACHE });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok || response.type === "opaque") {
      await cache.put(request, response.clone());
      if (limit) trim(cacheName, limit);
    }
    return response;
  } catch {
    return Response.error(); // the page shows a generated cover instead
  }
}

async function networkFirst(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await withTimeout(fetch(request), NETWORK_TIMEOUT);
    if (response.ok) {
      await cache.put(request, response.clone());
      trim(API_CACHE, API_LIMIT);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // No network and nothing cached: a JSON answer the app recognises
    return new Response(JSON.stringify({ offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/* ---------- helpers ---------- */

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); }
    );
  });
}

/** Deletes the oldest entries so a cache never grows past `max` items. */
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((key) => cache.delete(key)));
}
