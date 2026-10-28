/* © 2026 Nikola Vojvodić · https://vojvodixdev.github.io/ · All rights reserved, see LICENSE. [nv:2919f35f44] */
/**
 * Hash-based routing. Every screen has a shareable URL and works with the
 * browser's back button, also when the app is installed or offline.
 *
 *   #/                      home (discover)
 *   #/search?q=…&sort=…     search results, filters live in the URL
 *   #/book/OL45804W         one book
 *   #/shelf?status=read     the reader's shelf
 */

import { SORTS } from "./api.js";
import { STATUSES } from "./store.js";
import { isWorkId, workId } from "./util.js";

export const SHELF_VIEWS = ["spines", "grid"];
export const SHELF_SORTS = ["added", "title", "author", "rating"];

const text = (value, max = 200) => String(value ?? "").trim().slice(0, max);
const year = (value) => (/^-?\d{1,4}$/.test(String(value ?? "")) ? String(value) : "");

export function readSearchParams(params) {
  const sort = params.get("sort");
  const lang = params.get("lang");
  return {
    q: text(params.get("q")),
    author: text(params.get("author")),
    subject: text(params.get("subject")),
    sort: SORTS.includes(sort) ? sort : "relevance",
    lang: /^[a-z]{3}$/.test(lang ?? "") ? lang : "",
    from: year(params.get("from")),
    to: year(params.get("to")),
    ebooks: params.get("ebooks") === "1",
  };
}

export function hasSearch(params) {
  return Boolean(params.q || params.author || params.subject);
}

export function activeFilterCount(params) {
  return [params.lang, params.from || params.to, params.ebooks].filter(Boolean).length;
}

export function parseRoute(hash = "") {
  const raw = String(hash).replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0) return { name: "home", params: {} };

  switch (segments[0]) {
    case "search":
      return { name: "search", params: readSearchParams(params) };
    case "shelf": {
      const status = params.get("status");
      const view = params.get("view");
      const sort = params.get("sort");
      return {
        name: "shelf",
        params: {
          status: STATUSES.includes(status) ? status : "all",
          view: SHELF_VIEWS.includes(view) ? view : "spines",
          sort: SHELF_SORTS.includes(sort) ? sort : "added",
        },
      };
    }
    case "book":
      return isWorkId(segments[1])
        ? { name: "book", params: { id: segments[1] } }
        : { name: "notfound", params: {} };
    default:
      return { name: "notfound", params: {} };
  }
}

export function searchHash(params = {}) {
  const query = new URLSearchParams();
  ["q", "author", "subject", "sort", "lang", "from", "to"].forEach((name) => {
    const value = params[name];
    if (!value) return;
    if (name === "sort" && value === "relevance") return;
    query.set(name, String(value));
  });
  if (params.ebooks) query.set("ebooks", "1");
  const qs = query.toString();
  return qs ? `#/search?${qs}` : "#/search";
}

export function shelfHash({ status = "all", view = "spines", sort = "added" } = {}) {
  const query = new URLSearchParams();
  if (status !== "all") query.set("status", status);
  if (view !== "spines") query.set("view", view);
  if (sort !== "added") query.set("sort", sort);
  const qs = query.toString();
  return qs ? `#/shelf?${qs}` : "#/shelf";
}

export function bookHash(key) {
  return `#/book/${workId(key)}`;
}
