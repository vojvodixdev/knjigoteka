/* © 2026 Nikola Vojvodić · https://vojvodixdev.github.io/ · All rights reserved, see LICENSE. [nv:2919f35f44] */
/**
 * Knjigoteka – application entry point.
 *
 * Wires together the store (localStorage), the Open Library client, the
 * hash router and the four views. Views are plain functions that render
 * into <main> and may return { update, onAction, destroy }.
 */

import { createApi } from "./api.js";
import { createStore } from "./store.js";
import { parseRoute, searchHash } from "./router.js";
import { createI18n, detectLanguage, LANGUAGES } from "./i18n.js";
import { announce, syncShelfButtons, toast, emptyStateHtml } from "./ui.js";
import { initPwa, requestPersistence } from "./pwa.js";
import { renderHome } from "./views/home.js";
import { renderSearch } from "./views/search.js";
import { renderBook } from "./views/book.js";
import { renderShelf } from "./views/shelf.js";

/* ---------- services ---------- */

function safeStorage() {
  try {
    const probe = "__knjigoteka__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    // Private mode / blocked storage: keep the shelf in memory for this visit
    const memory = new Map();
    return { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, String(v)), removeItem: (k) => memory.delete(k) };
  }
}

const store = createStore(safeStorage());
const i18n = createI18n(store.settings.lang || detectLanguage(navigator.languages?.length ? navigator.languages : [navigator.language]));
const api = createApi();
const workCache = new Map();
const scrollPositions = new Map();

const view = document.getElementById("view");
const shelfCount = document.getElementById("shelf-count");
const themeButton = document.getElementById("theme-btn");
const langSwitch = document.getElementById("lang-switch");
const themeColor = document.querySelector('meta[name="theme-color"]');

/** Shared context handed to every view. */
const baseContext = {
  api,
  store,
  workCache,
  toast,
  announce,
  requestPersistence,
  get t() { return i18n.t; },
  get lang() { return i18n.lang; },
  go(hash) {
    if (window.location.hash === hash) render();
    else window.location.hash = hash;
  },
  setTitle(title) {
    document.title = title ? `${title} | Knjigoteka` : "Knjigoteka";
  },
  restoreScroll() {
    const y = scrollPositions.get(window.location.hash || "#/");
    if (y != null) window.scrollTo(0, y);
  },
  searchInput: () => document.getElementById("search-input"),
};

/* ---------- routing ---------- */

const VIEWS = {
  home: renderHome,
  search: renderSearch,
  book: renderBook,
  shelf: renderShelf,
  notfound(root, _params, ctx) {
    ctx.setTitle(ctx.t("notFound.title"));
    root.innerHTML = `<div class="container">${emptyStateHtml({
      title: `<span tabindex="-1">${ctx.t("notFound.title")}</span>`,
      text: ctx.t("notFound.text"),
      actions: `<a class="btn btn-primary" href="#/">${ctx.t("nav.discover")}</a>`,
    })}</div>`;
  },
};

let current = null;
let renders = 0;
let focusSearchAfterRender = false;

function render({ force = false } = {}) {
  const route = parseRoute(window.location.hash);
  const hash = window.location.hash || "#/";

  // Same screen, new parameters (e.g. a different sort) – let the view update in place
  if (!force && current && current.name === route.name && current.instance?.update) {
    current.hash = hash;
    current.instance.update(route.params);
    return;
  }

  if (current) {
    scrollPositions.set(current.hash, window.scrollY);
    current.instance?.destroy?.();
    current.controller.abort();
  }

  const controller = new AbortController();
  const ctx = Object.create(baseContext);
  ctx.signal = controller.signal;

  view.innerHTML = "";
  const instance = VIEWS[route.name](view, route.params, ctx) || null;
  current = { name: route.name, hash, instance, controller };
  updateNav(route.name);

  if (renders > 0 && !force) {
    if (!scrollPositions.has(hash)) window.scrollTo(0, 0);
    (view.querySelector("h1, [tabindex='-1']") || view).focus({ preventScroll: true });
  }
  if (focusSearchAfterRender) {
    focusSearchAfterRender = false;
    baseContext.searchInput()?.focus();
  }
  renders += 1;
}

function updateNav(name) {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === name) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

window.addEventListener("hashchange", () => render());

/* ---------- global interactions (event delegation) ---------- */

function toggleShelf(key) {
  const t = i18n.t;
  const existing = store.get(key);
  if (existing) {
    const index = store.indexOf(key);
    store.remove(key);
    toast(t("toast.removed"), { action: t("toast.undo"), onAction: () => store.restore(existing, index) });
    return;
  }
  const book = workCache.get(key);
  if (!book) return;
  store.add(book, "want");
  requestPersistence();
  toast(t("toast.added"), { action: t("toast.undo"), onAction: () => store.remove(key) });
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const { action } = target.dataset;

  if (action === "toggle-shelf") {
    event.preventDefault();
    toggleShelf(target.dataset.key);
  } else if (action === "back") {
    event.preventDefault();
    if (renders > 1) window.history.back();
    else baseContext.go("#/");
  } else {
    current?.instance?.onAction?.(action, target, event);
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-search-form]");
  if (!form) return;
  event.preventDefault();
  const q = form.elements.namedItem("q").value.trim();
  if (!q) return;
  // A new query from the results page keeps sort and filters, but not a topic/author
  const route = parseRoute(window.location.hash);
  const keep = route.name === "search"
    ? { sort: route.params.sort, lang: route.params.lang, from: route.params.from, to: route.params.to, ebooks: route.params.ebooks }
    : {};
  baseContext.go(searchHash({ ...keep, q }));
});

// "/" focuses search from anywhere, like on GitHub or YouTube
document.addEventListener("keydown", (event) => {
  if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
  const tag = document.activeElement?.tagName;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || document.activeElement?.isContentEditable) return;
  event.preventDefault();
  const input = baseContext.searchInput();
  if (input) input.focus();
  else {
    focusSearchAfterRender = true;
    baseContext.go("#/search");
  }
});

// Covers: remove a failed image so the generated cloth cover shows instead
document.addEventListener("error", (event) => {
  if (event.target instanceof HTMLImageElement && event.target.classList.contains("cover__img")) event.target.remove();
}, true);
document.addEventListener("load", (event) => {
  if (event.target instanceof HTMLImageElement && event.target.classList.contains("cover__img")) {
    // Open Library sometimes answers with a 1×1 pixel instead of a 404
    if (event.target.naturalWidth < 10) event.target.remove();
    else event.target.classList.add("is-loaded");
  }
}, true);

store.subscribe(() => {
  shelfCount.textContent = String(store.books.length);
  syncShelfButtons(view, store, i18n.t);
});

/* ---------- theme & language ---------- */

const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme() {
  const theme = store.settings.theme || (systemDark.matches ? "dark" : "light");
  document.documentElement.dataset.theme = theme;
  themeColor.content = theme === "dark" ? "#0f1a16" : "#1b4332";
  const label = i18n.t(theme === "dark" ? "theme.toLight" : "theme.toDark");
  themeButton.setAttribute("aria-label", label);
  themeButton.title = label;
  themeButton.querySelector("use").setAttribute("href", theme === "dark" ? "#i-sun" : "#i-moon");
}

themeButton.addEventListener("click", () => {
  store.setSetting("theme", document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  applyTheme();
});
systemDark.addEventListener("change", applyTheme);

function applyLanguage() {
  const t = i18n.t;
  document.documentElement.lang = i18n.lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-label]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nLabel)));
  langSwitch.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === i18n.lang)));
  applyTheme();
}

langSwitch.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-lang]");
  if (!button || !LANGUAGES.includes(button.dataset.lang) || button.dataset.lang === i18n.lang) return;
  const next = button.dataset.lang;
  store.setSetting("lang", next);
  i18n.setLang(next);
  applyLanguage();
  render({ force: true });
});

/* ---------- start ---------- */

shelfCount.textContent = String(store.books.length);
applyLanguage();
render();
initPwa({ t: (...args) => i18n.t(...args), toast });

/* Autorska prava: kad sajt radi na tuđem domenu, prikaže link ka originalu. Za sopstveni domen dodaj ga u HOMES. */
(function () {
  var HOMES = ["vojvodixdev.github.io", "localhost", "127.0.0.1", "[::1]", ""];
  var host = location.hostname;
  if (HOMES.indexOf(host) > -1 || /\.localhost$/.test(host)) return;
  var link = document.createElement("a");
  link.className = "nv-original";
  link.href = "https://vojvodixdev.github.io/";
  link.textContent = "Original work by Nikola Vojvodić";
  link.setAttribute("data-nv", "nv:2919f35f44");
  document.body.appendChild(link);
  console.warn("This page is a copy of work by Nikola Vojvodić (© 2026, all rights reserved): https://vojvodixdev.github.io/ [nv:2919f35f44]");
})();
