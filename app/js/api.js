/* © 2026 Nikola Vojvodić · https://vojvodixdev.github.io/ · All rights reserved, see LICENSE. [nv:2919f35f44] */
/**
 * Open Library client.
 *
 * - Builds request URLs (pure, unit-tested).
 * - Normalises the different response shapes (search, trending, works)
 *   into one `Book` object the UI understands.
 * - Keeps a short in-memory cache so "back" navigation is instant.
 *
 * Network caching for offline use lives in the service worker (sw.js).
 */

import { workId } from "./util.js";

export const API_ROOT = "https://openlibrary.org";
export const COVERS_ROOT = "https://covers.openlibrary.org";
export const PAGE_SIZE = 24;

export const SEARCH_FIELDS = [
  "key", "title", "author_name", "first_publish_year", "cover_i", "edition_count",
  "language", "number_of_pages_median", "ratings_average", "ratings_count", "ebook_access",
].join(",");

export const SORTS = ["relevance", "rating", "editions", "new", "old"];

export class OfflineError extends Error {
  constructor() {
    super("offline");
    this.name = "OfflineError";
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Escapes a value for use inside a quoted Solr phrase. */
function phrase(value) {
  return `"${String(value).replace(/["\\]/g, "")}"`;
}

/**
 * Turns UI search state into an Open Library search URL.
 * Filters (language, year range, ebooks, subject) are expressed as Solr
 * clauses inside `q`, which the search endpoint supports.
 */
export function buildSearchUrl({
  q = "", author = "", subject = "", sort = "relevance",
  lang = "", from = "", to = "", ebooks = false, page = 1,
} = {}) {
  const clauses = [];
  if (q.trim()) clauses.push(q.trim());
  if (subject) clauses.push(`subject:${phrase(subject)}`);
  if (lang) clauses.push(`language:${lang}`);
  if (from || to) clauses.push(`first_publish_year:[${from || "*"} TO ${to || "*"}]`);
  if (ebooks) clauses.push("ebook_access:[borrowable TO *]");

  const params = new URLSearchParams();
  if (clauses.length) params.set("q", clauses.join(" "));
  if (author) params.set("author", author);
  if (sort && sort !== "relevance" && SORTS.includes(sort)) params.set("sort", sort);
  params.set("fields", SEARCH_FIELDS);
  params.set("limit", String(PAGE_SIZE));
  params.set("page", String(page));
  return `${API_ROOT}/search.json?${params}`;
}

export function workUrl(id) {
  return `${API_ROOT}/works/${id}.json`;
}

export function trendingUrl(limit = 18) {
  return `${API_ROOT}/trending/daily.json?limit=${limit}`;
}

/** Search for a single work by its key; used when someone opens a shared link. */
export function workSummaryUrl(id) {
  const params = new URLSearchParams({ q: `key:/works/${id}`, fields: SEARCH_FIELDS, limit: "1" });
  return `${API_ROOT}/search.json?${params}`;
}

export function coverUrl(coverId, size = "M") {
  return coverId ? `${COVERS_ROOT}/b/id/${coverId}-${size}.jpg?default=false` : null;
}

export function openLibraryUrl(key) {
  return `${API_ROOT}/works/${workId(key)}`;
}

/**
 * Normalises a search doc, trending doc or subjects-API work into a Book.
 * Unknown values stay null so the UI can decide how to show them.
 */
export function normalizeWork(doc = {}) {
  const key = String(doc.key ?? "");
  const authors = Array.isArray(doc.author_name)
    ? doc.author_name
    : (doc.authors || []).map((a) => a?.name).filter(Boolean);
  const rating = Number(doc.ratings_average);

  return {
    key: key.startsWith("/works/") ? key : `/works/${workId(key)}`,
    title: String(doc.title ?? "").trim(),
    authors: authors.slice(0, 5),
    year: Number.isFinite(doc.first_publish_year) ? doc.first_publish_year : null,
    coverId: doc.cover_i ?? doc.cover_id ?? null,
    editions: Number.isFinite(doc.edition_count) ? doc.edition_count : null,
    pages: Number.isFinite(doc.number_of_pages_median) ? doc.number_of_pages_median : null,
    rating: Number.isFinite(rating) && rating > 0 ? Math.round(rating * 10) / 10 : null,
    ratingCount: Number.isFinite(doc.ratings_count) ? doc.ratings_count : 0,
    languages: Array.isArray(doc.language) ? doc.language.slice(0, 12) : [],
    ebook: doc.ebook_access || "no_ebook",
  };
}

/** Normalises /works/{id}.json – the description can be a string or { value }. */
export function normalizeWorkDetails(work = {}) {
  const text = (v) => (typeof v === "string" ? v : v?.value || "");
  return {
    description: cleanDescription(text(work.description)),
    firstSentence: text(work.first_sentence),
    subjects: Array.isArray(work.subjects) ? [...new Set(work.subjects)].slice(0, 14) : [],
    coverId: Array.isArray(work.covers) ? work.covers.find((c) => c > 0) ?? null : null,
    title: work.title || "",
  };
}

/** Open Library descriptions often end with source links and markdown; keep the prose. */
export function cleanDescription(text) {
  return String(text)
    .replace(/\r/g, "")
    .split(/\n-{3,}\n|\n\*\*Contains\*\*|\n\(\[source\]/)[0]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Creates the API client. `fetchImpl` is injectable for tests.
 */
export function createApi({ fetchImpl = (...args) => fetch(...args), ttl = 5 * 60 * 1000 } = {}) {
  const memo = new Map();

  async function getJson(url, signal) {
    const hit = memo.get(url);
    if (hit && Date.now() - hit.time < ttl) return hit.data;

    let response;
    try {
      response = await fetchImpl(url, { signal, headers: { Accept: "application/json" } });
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      if (typeof navigator !== "undefined" && navigator.onLine === false) throw new OfflineError();
      throw new ApiError(error?.message || "network", 0);
    }

    if (!response.ok) {
      if (response.status === 503) {
        const body = await response.json().catch(() => null);
        if (body?.offline) throw new OfflineError();
      }
      throw new ApiError(`HTTP ${response.status}`, response.status);
    }

    const data = await response.json();
    memo.set(url, { time: Date.now(), data });
    if (memo.size > 60) memo.delete(memo.keys().next().value);
    return data;
  }

  return {
    async search(state, signal) {
      const data = await getJson(buildSearchUrl(state), signal);
      const items = (data.docs || []).map(normalizeWork).filter((b) => b.title);
      return { total: data.numFound ?? data.num_found ?? items.length, items };
    },

    async trending(signal) {
      const data = await getJson(trendingUrl(), signal);
      return (data.works || []).map(normalizeWork).filter((b) => b.title);
    },

    async workSummary(id, signal) {
      const data = await getJson(workSummaryUrl(id), signal);
      const doc = (data.docs || [])[0];
      return doc ? normalizeWork(doc) : null;
    },

    async workDetails(id, signal) {
      return normalizeWorkDetails(await getJson(workUrl(id), signal));
    },
  };
}
