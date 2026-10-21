import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSearchUrl, normalizeWork, normalizeWorkDetails, cleanDescription, createApi, coverUrl,
  OfflineError, ApiError, PAGE_SIZE,
} from "../../app/js/api.js";

const params = (url) => new URL(url).searchParams;

test("buildSearchUrl: plain query with defaults", () => {
  const p = params(buildSearchUrl({ q: "  andrić " }));
  assert.equal(p.get("q"), "andrić");
  assert.equal(p.get("limit"), String(PAGE_SIZE));
  assert.equal(p.get("page"), "1");
  assert.equal(p.get("sort"), null, "relevance is the API default and is not sent");
  assert.ok(p.get("fields").includes("cover_i"));
});

test("buildSearchUrl: filters become Solr clauses", () => {
  const p = params(buildSearchUrl({ q: "most", subject: 'history "x"', lang: "srp", from: "1900", to: "", ebooks: true, sort: "new", page: 3 }));
  assert.equal(p.get("q"), 'most subject:"history x" language:srp first_publish_year:[1900 TO *] ebook_access:[borrowable TO *]');
  assert.equal(p.get("sort"), "new");
  assert.equal(p.get("page"), "3");
});

test("buildSearchUrl: author search without q", () => {
  const p = params(buildSearchUrl({ author: "Ivo Andrić" }));
  assert.equal(p.get("author"), "Ivo Andrić");
  assert.equal(p.get("q"), null);
});

test("buildSearchUrl ignores unknown sort values", () => {
  assert.equal(params(buildSearchUrl({ q: "x", sort: "drop table" })).get("sort"), null);
});

test("normalizeWork maps search docs", () => {
  const book = normalizeWork({
    key: "/works/OL1W", title: " Dune ", author_name: ["Frank Herbert"], first_publish_year: 1965,
    cover_i: 123, edition_count: 80, number_of_pages_median: 600, ratings_average: 4.256, ratings_count: 900,
    language: ["eng"], ebook_access: "borrowable",
  });
  assert.deepEqual(book, {
    key: "/works/OL1W", title: "Dune", authors: ["Frank Herbert"], year: 1965, coverId: 123, editions: 80,
    pages: 600, rating: 4.3, ratingCount: 900, languages: ["eng"], ebook: "borrowable",
  });
});

test("normalizeWork maps subjects-API works and fills gaps", () => {
  const book = normalizeWork({ key: "OL2W", title: "X", authors: [{ name: "A" }, {}], cover_id: 9 });
  assert.equal(book.key, "/works/OL2W");
  assert.deepEqual(book.authors, ["A"]);
  assert.equal(book.coverId, 9);
  assert.equal(book.year, null);
  assert.equal(book.rating, null);
  assert.equal(book.ebook, "no_ebook");
});

test("normalizeWorkDetails reads both description shapes", () => {
  assert.equal(normalizeWorkDetails({ description: "Plain" }).description, "Plain");
  assert.equal(normalizeWorkDetails({ description: { value: "Typed" } }).description, "Typed");
  assert.equal(normalizeWorkDetails({}).description, "");
  assert.equal(normalizeWorkDetails({ covers: [-1, 55] }).coverId, 55);
  assert.deepEqual(normalizeWorkDetails({ subjects: ["A", "A", "B"] }).subjects, ["A", "B"]);
});

test("cleanDescription drops source footers and markdown links", () => {
  const text = "A [great](https://x.y) book.\n\n----------\nSource: Wikipedia";
  assert.equal(cleanDescription(text), "A great book.");
});

test("coverUrl", () => {
  assert.equal(coverUrl(null), null);
  assert.equal(coverUrl(5, "L"), "https://covers.openlibrary.org/b/id/5-L.jpg?default=false");
});

function fakeFetch(responses) {
  const calls = [];
  const fn = async (url) => {
    calls.push(url);
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return { ok: next.status === 200, status: next.status, json: async () => next.body };
  };
  fn.calls = calls;
  return fn;
}

test("createApi.search normalises and memoises responses", async () => {
  const fetchImpl = fakeFetch([{ status: 200, body: { numFound: 1, docs: [{ key: "/works/OL1W", title: "A" }, { key: "/works/OL3W" }] } }]);
  const api = createApi({ fetchImpl });
  const first = await api.search({ q: "a" });
  const second = await api.search({ q: "a" });
  assert.equal(first.total, 1);
  assert.equal(first.items.length, 1, "docs without a title are dropped");
  assert.deepEqual(second, first);
  assert.equal(fetchImpl.calls.length, 1, "second call comes from memory");
});

test("createApi turns the service worker's offline answer into OfflineError", async () => {
  const api = createApi({ fetchImpl: fakeFetch([{ status: 503, body: { offline: true } }]) });
  await assert.rejects(api.search({ q: "x" }), OfflineError);
});

test("createApi reports HTTP errors as ApiError", async () => {
  const api = createApi({ fetchImpl: fakeFetch([{ status: 500, body: {} }]) });
  await assert.rejects(api.trending(), (error) => error instanceof ApiError && error.status === 500);
});

test("createApi.workSummary returns null when nothing matches", async () => {
  const api = createApi({ fetchImpl: fakeFetch([{ status: 200, body: { docs: [] } }]) });
  assert.equal(await api.workSummary("OL1W"), null);
});
