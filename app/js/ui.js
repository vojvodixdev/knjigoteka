/**
 * Reusable UI pieces: covers, book cards, spines, skeletons, toasts.
 * Templates return HTML strings; every value coming from the API goes
 * through escapeHtml() first.
 */

import { coverUrl } from "./api.js";
import { bookHash } from "./router.js";
import { escapeHtml as esc, hashString, truncate, clamp } from "./util.js";

const CLOTH_COLOURS = 8;

export function icon(name, extraClass = "") {
  return `<svg class="icon ${extraClass}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
}

/** Stable "book cloth" colour index for a work, so the same book always looks the same. */
export function clothIndex(book) {
  return hashString(book.key || book.title) % CLOTH_COLOURS;
}

export function authorLine(book, t) {
  return book.authors?.length ? book.authors.slice(0, 2).join(", ") : t("book.unknownAuthor");
}

/**
 * A cover: the real image when Open Library has one, otherwise a generated
 * cloth-bound cover with the title. If the image fails to load (offline,
 * 404) it is removed and the generated cover shows through.
 */
export function coverHtml(book, { size = "M", eager = false, alt = "", className = "" } = {}) {
  const src = coverUrl(book.coverId, size);
  return `
    <div class="cover cloth-${clothIndex(book)} ${className}">
      <div class="cover__fallback" aria-hidden="true">
        <span class="cover__title">${esc(truncate(book.title, 70))}</span>
        <span class="cover__author">${esc(book.authors?.[0] || "")}</span>
      </div>
      ${src ? `<img class="cover__img" src="${esc(src)}" alt="${esc(alt)}" loading="${eager ? "eager" : "lazy"}" decoding="async">` : ""}
    </div>`;
}

export function shelfButtonHtml(book, saved, t) {
  const label = saved ? t("card.remove", { title: book.title }) : t("card.add", { title: book.title });
  return `
    <button class="shelf-btn" type="button" data-action="toggle-shelf" data-key="${esc(book.key)}"
            aria-pressed="${saved}" aria-label="${esc(label)}" title="${esc(label)}">
      ${icon(saved ? "bookmark-fill" : "bookmark")}
    </button>`;
}

export function bookCardHtml(book, ctx) {
  const { t, store } = ctx;
  return `
    <li class="book-card">
      <a class="book-card__link" href="${bookHash(book.key)}">
        ${coverHtml(book)}
        <span class="book-card__title">${esc(book.title)}</span>
        <span class="book-card__author">${esc(authorLine(book, t))}</span>
        ${book.year ? `<span class="book-card__year">${book.year}</span>` : ""}
      </a>
      ${shelfButtonHtml(book, store.has(book.key), t)}
    </li>`;
}

export function skeletonCards(count = 8) {
  return Array.from({ length: count }, () => `
    <li class="book-card is-skeleton" aria-hidden="true">
      <div class="cover skeleton"></div>
      <span class="skeleton-line"></span>
      <span class="skeleton-line skeleton-line--short"></span>
    </li>`).join("");
}

/** Keeps every bookmark button on the page in sync with the shelf. */
export function syncShelfButtons(root, store, t) {
  root.querySelectorAll('[data-action="toggle-shelf"]').forEach((button) => {
    const saved = store.has(button.dataset.key);
    if (button.getAttribute("aria-pressed") === String(saved)) return;
    const title = button.closest(".book-card")?.querySelector(".book-card__title")?.textContent ?? "";
    const label = saved ? t("card.remove", { title }) : t("card.add", { title });
    button.setAttribute("aria-pressed", String(saved));
    button.setAttribute("aria-label", label);
    button.title = label;
    button.querySelector("use")?.setAttribute("href", saved ? "#i-bookmark-fill" : "#i-bookmark");
  });
}

/**
 * A book spine for the shelf view. Height follows a stable hash, thickness
 * follows the page count, so the shelf looks like a real one.
 */
export function spineHtml(book, t, { link = true } = {}) {
  const hash = hashString(book.key);
  const height = 1 + (hash % 5); // spine-h-1 … spine-h-5
  const width = book.pages ? clamp(Math.round(book.pages / 160), 1, 5) : 1 + ((hash >> 3) % 4);
  const classes = `spine cloth-${clothIndex(book)} spine-h-${height} spine-w-${width} is-${book.status}`;
  const inner = `
    <span class="spine__title">${esc(truncate(book.title, 48))}</span>
    <span class="spine__author">${esc(book.authors?.[0]?.split(" ").pop() || "")}</span>`;
  if (!link) return `<li class="spine-slot" aria-hidden="true"><span class="${classes}">${inner}</span></li>`;

  const label = `${book.title}, ${authorLine(book, t)}. ${t(`status.${book.status}`)}`;
  return `
    <li class="spine-slot">
      <a class="${classes}" href="${bookHash(book.key)}" aria-label="${esc(label)}" title="${esc(book.title)}">${inner}</a>
    </li>`;
}

/** Decorative spines for the empty hero – no text, hidden from screen readers. */
export function decorativeSpines(count = 9) {
  return Array.from({ length: count }, (_, i) => {
    const h = 1 + ((i * 7 + 3) % 5);
    const w = 1 + ((i * 5 + 1) % 4);
    return `<span class="spine spine--blank cloth-${(i * 3) % CLOTH_COLOURS} spine-h-${h} spine-w-${w}"></span>`;
  }).join("");
}

export function starsHtml(value, { label = "" } = {}) {
  const full = Math.round(value ?? 0);
  return `<span class="stars" ${label ? `aria-label="${esc(label)}" role="img"` : 'aria-hidden="true"'}>${
    Array.from({ length: 5 }, (_, i) => icon(i < full ? "star-fill" : "star")).join("")
  }</span>`;
}

export function searchFormHtml(t, value = "", { large = false } = {}) {
  return `
    <form class="search-form${large ? " search-form--large" : ""}" role="search" data-search-form>
      <label class="visually-hidden" for="search-input">${t("search.label")}</label>
      ${icon("search", "search-form__icon")}
      <input id="search-input" class="search-form__input" type="search" name="q" value="${esc(value)}"
             placeholder="${esc(t("search.placeholder"))}" autocomplete="off" enterkeyhint="search"
             maxlength="200" required>
      <kbd class="search-form__kbd" title="${esc(t("search.shortcut"))}">/</kbd>
      <button class="btn btn-primary" type="submit">${t("search.submit")}</button>
    </form>`;
}

export function emptyStateHtml({ title, text = "", actions = "" }) {
  return `
    <div class="empty-state">
      <h2 class="empty-state__title">${title}</h2>
      ${text ? `<p class="empty-state__text">${text}</p>` : ""}
      ${actions ? `<div class="empty-state__actions">${actions}</div>` : ""}
    </div>`;
}

/* ---------- Toasts & announcements ---------- */

export function toast(message, { action, onAction, duration = 5000 } = {}) {
  const host = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");

  const text = document.createElement("span");
  text.textContent = message;
  el.append(text);

  let timer = null;
  const close = () => {
    clearTimeout(timer);
    el.classList.add("is-leaving");
    setTimeout(() => el.remove(), 180);
  };

  if (action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "toast__action";
    button.textContent = action;
    button.addEventListener("click", () => {
      onAction?.();
      close();
    });
    el.append(button);
  }

  // The same message twice in a row replaces the older toast instead of stacking
  [...host.children].forEach((old) => { if (old.firstElementChild?.textContent === message) old.remove(); });
  host.append(el);
  while (host.children.length > 3) host.firstElementChild.remove();
  if (duration) timer = setTimeout(close, duration);
  return close;
}

export function announce(message) {
  const region = document.getElementById("announcer");
  region.textContent = "";
  requestAnimationFrame(() => { region.textContent = message; });
}
