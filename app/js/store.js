/* © 2026 Nikola Vojvodić · https://vojvodixdev.github.io/ · All rights reserved, see LICENSE. [nv:2919f35f44] */
/**
 * The reader's shelf, recent searches and settings, persisted in localStorage.
 *
 * Data shape (version 2):
 * {
 *   version: 2,
 *   books:    [ShelfBook],          // newest first
 *   recent:   ["andrić", ...],      // last searches, newest first
 *   settings: { theme, lang }
 * }
 *
 * A ShelfBook is a normalised Book plus: status, rating (0–5), note,
 * addedAt, updatedAt, finishedAt (ms timestamps).
 *
 * Version 1 (the thesis app) stored a plain array of search docs under
 * "knjigoteka-lista"; it is migrated automatically on first load.
 */

import { normalizeWork } from "./api.js";
import { isWorkId, workId } from "./util.js";

export const STORAGE_KEY = "knjigoteka:v2";
export const LEGACY_KEY = "knjigoteka-lista";
export const STATUSES = ["want", "reading", "read"];
const MAX_RECENT = 6;
const MAX_NOTE = 2000;

function emptyData() {
  return { version: 2, books: [], recent: [], settings: {} };
}

/** Accepts anything that looks like a book and returns a clean ShelfBook, or null. */
export function sanitizeShelfBook(input, now = Date.now()) {
  if (!input || typeof input !== "object") return null;
  const base = normalizeWork({
    ...input,
    cover_i: input.coverId ?? input.cover_i,
    author_name: input.authors ?? input.author_name,
    first_publish_year: input.year ?? input.first_publish_year,
    edition_count: input.editions ?? input.edition_count,
    number_of_pages_median: input.pages ?? input.number_of_pages_median,
    ratings_average: input.rating ?? input.ratings_average,
    ratings_count: input.ratingCount ?? input.ratings_count,
    ebook_access: input.ebook ?? input.ebook_access,
    language: input.languages ?? input.language,
  });
  if (!isWorkId(workId(base.key)) || !base.title) return null;

  const status = STATUSES.includes(input.status) ? input.status : "want";
  const rating = Number.isInteger(input.myRating) ? input.myRating : 0;
  const time = (v) => (Number.isFinite(v) && v > 0 ? v : null);

  return {
    ...base,
    title: base.title.slice(0, 300),
    status,
    myRating: Math.min(5, Math.max(0, rating)),
    note: typeof input.note === "string" ? input.note.slice(0, MAX_NOTE) : "",
    addedAt: time(input.addedAt) ?? now,
    updatedAt: time(input.updatedAt) ?? now,
    finishedAt: status === "read" ? time(input.finishedAt) ?? now : null,
  };
}

export function createStore(storage, { now = () => Date.now() } = {}) {
  const listeners = new Set();
  let data = load();

  function load() {
    try {
      const parsed = JSON.parse(storage.getItem(STORAGE_KEY));
      if (parsed?.version === 2 && Array.isArray(parsed.books)) {
        return {
          ...emptyData(),
          ...parsed,
          books: parsed.books.map((b) => sanitizeShelfBook(b, now())).filter(Boolean),
          recent: Array.isArray(parsed.recent) ? parsed.recent.filter((r) => typeof r === "string").slice(0, MAX_RECENT) : [],
          settings: parsed.settings && typeof parsed.settings === "object" ? parsed.settings : {},
        };
      }
    } catch {
      /* corrupted or missing – start fresh / migrate */
    }

    const fresh = emptyData();
    try {
      const legacy = JSON.parse(storage.getItem(LEGACY_KEY));
      if (Array.isArray(legacy)) {
        const t = now();
        fresh.books = legacy
          .map((doc, i) => sanitizeShelfBook({ ...doc, status: "want", addedAt: t - i }, t))
          .filter(Boolean);
      }
    } catch {
      /* nothing to migrate */
    }
    return fresh;
  }

  function persist() {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage full or blocked – keep working in memory */
    }
    listeners.forEach((fn) => fn(data));
  }

  const find = (key) => data.books.find((b) => b.key === key) || null;

  return {
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    get books() {
      return data.books;
    },
    get recent() {
      return data.recent;
    },
    get settings() {
      return data.settings;
    },

    get: find,
    has: (key) => Boolean(find(key)),

    add(book, status = "want") {
      if (find(book.key)) return this.setStatus(book.key, status);
      const t = now();
      const entry = sanitizeShelfBook({ ...book, status, addedAt: t, updatedAt: t, finishedAt: status === "read" ? t : null }, t);
      if (!entry) return null;
      data.books = [entry, ...data.books];
      persist();
      return entry;
    },

    remove(key) {
      const removed = find(key);
      if (!removed) return null;
      data.books = data.books.filter((b) => b.key !== key);
      persist();
      return removed;
    },

    /** Puts a removed book back exactly where it was (used by "Undo"). */
    restore(book, index = 0) {
      if (!book || find(book.key)) return;
      const books = [...data.books];
      books.splice(Math.min(index, books.length), 0, book);
      data.books = books;
      persist();
    },

    indexOf(key) {
      return data.books.findIndex((b) => b.key === key);
    },

    update(key, patch) {
      const book = find(key);
      if (!book) return null;
      const next = { ...book, ...patch, updatedAt: now() };
      if (patch.status) {
        next.finishedAt = patch.status === "read" ? book.finishedAt ?? now() : null;
      }
      if (typeof next.note === "string") next.note = next.note.slice(0, MAX_NOTE);
      next.myRating = Math.min(5, Math.max(0, Number(next.myRating) || 0));
      data.books = data.books.map((b) => (b.key === key ? next : b));
      persist();
      return next;
    },

    setStatus(key, status) {
      if (!STATUSES.includes(status)) return null;
      return this.update(key, { status });
    },

    counts() {
      const counts = { all: data.books.length, want: 0, reading: 0, read: 0 };
      data.books.forEach((b) => { counts[b.status] += 1; });
      return counts;
    },

    stats(year = new Date(now()).getFullYear()) {
      const read = data.books.filter((b) => b.status === "read");
      const rated = data.books.filter((b) => b.myRating > 0);
      return {
        total: data.books.length,
        readThisYear: read.filter((b) => b.finishedAt && new Date(b.finishedAt).getFullYear() === year).length,
        pagesRead: read.reduce((sum, b) => sum + (b.pages || 0), 0),
        averageRating: rated.length ? rated.reduce((s, b) => s + b.myRating, 0) / rated.length : null,
      };
    },

    addRecent(query) {
      const q = String(query ?? "").trim();
      if (!q) return;
      data.recent = [q, ...data.recent.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
      persist();
    },

    clearRecent() {
      data.recent = [];
      persist();
    },

    setSetting(name, value) {
      data.settings = { ...data.settings, [name]: value };
      persist();
    },

    exportJson() {
      return JSON.stringify({ app: "knjigoteka", version: 2, exportedAt: new Date(now()).toISOString(), books: data.books }, null, 2);
    },

    /**
     * Merges books from an exported file. Existing books are replaced only if
     * the imported copy is newer. Returns { added, updated, skipped }.
     */
    importJson(text) {
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("invalid-json");
      }
      const incoming = Array.isArray(parsed) ? parsed : parsed?.books;
      if (!Array.isArray(incoming)) throw new Error("invalid-format");

      const result = { added: 0, updated: 0, skipped: 0 };
      const books = [...data.books];
      incoming.forEach((raw) => {
        const book = sanitizeShelfBook(raw, now());
        if (!book) { result.skipped += 1; return; }
        const i = books.findIndex((b) => b.key === book.key);
        if (i === -1) { books.push(book); result.added += 1; }
        else if (book.updatedAt > books[i].updatedAt) { books[i] = book; result.updated += 1; }
        else result.skipped += 1;
      });
      data.books = books.sort((a, b) => b.addedAt - a.addedAt);
      persist();
      return result;
    },
  };
}
