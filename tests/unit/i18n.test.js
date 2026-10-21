import { test } from "node:test";
import assert from "node:assert/strict";
import { createI18n, MESSAGES } from "../../app/js/i18n.js";
import { sortShelf } from "../../app/js/views/shelf.js";

test("Serbian and English have the same keys", () => {
  assert.deepEqual(Object.keys(MESSAGES.en).sort(), Object.keys(MESSAGES.sr).sort());
});

test("Serbian plural forms", () => {
  const { t } = createI18n("sr");
  assert.equal(t("book.ratingCount", { n: 1, count: "1" }), "1 ocena");
  assert.equal(t("book.ratingCount", { n: 3, count: "3" }), "3 ocene");
  assert.equal(t("book.ratingCount", { n: 5, count: "5" }), "5 ocena");
  assert.equal(t("book.ratingCount", { n: 21, count: "21" }), "21 ocena");
  assert.equal(t("book.ratingCount", { n: 12, count: "12" }), "12 ocena");
});

test("placeholders and language switching", () => {
  const i18n = createI18n("sr");
  assert.equal(i18n.t("search.titleFor", { q: "Andrić" }), "Rezultati za „Andrić”");
  i18n.setLang("en");
  assert.equal(i18n.t("search.titleFor", { q: "Andrić" }), "Results for “Andrić”");
  assert.equal(i18n.t("missing.key"), "missing.key");
});

test("sortShelf orders with the reader's locale", () => {
  const books = [
    { title: "Čovek", authors: ["Ž"], myRating: 1, addedAt: 1 },
    { title: "Cvet", authors: ["A"], myRating: 5, addedAt: 2 },
    { title: "Zid", authors: [], myRating: 3, addedAt: 3 },
  ];
  assert.deepEqual(sortShelf(books, "title", "sr").map((b) => b.title), ["Cvet", "Čovek", "Zid"]);
  assert.deepEqual(sortShelf(books, "author", "sr").map((b) => b.title), ["Cvet", "Čovek", "Zid"]);
  assert.deepEqual(sortShelf(books, "rating").map((b) => b.title), ["Cvet", "Zid", "Čovek"]);
  assert.deepEqual(sortShelf(books, "added").map((b) => b.title), ["Zid", "Cvet", "Čovek"]);
});
