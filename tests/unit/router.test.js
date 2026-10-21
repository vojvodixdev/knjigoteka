import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRoute, searchHash, shelfHash, bookHash, hasSearch, activeFilterCount } from "../../app/js/router.js";

test("parses every route", () => {
  assert.equal(parseRoute("").name, "home");
  assert.equal(parseRoute("#/").name, "home");
  assert.deepEqual(parseRoute("#/book/OL45804W"), { name: "book", params: { id: "OL45804W" } });
  assert.equal(parseRoute("#/book/../../etc").name, "notfound");
  assert.equal(parseRoute("#/nope").name, "notfound");
});

test("search params are validated", () => {
  const { params } = parseRoute("#/search?q=andri%C4%87&sort=evil&lang=serbian&from=19x&to=1950&ebooks=1");
  assert.deepEqual(params, { q: "andrić", author: "", subject: "", sort: "relevance", lang: "", from: "", to: "1950", ebooks: true });
});

test("searchHash round-trips and omits defaults", () => {
  const params = { q: "most", author: "", subject: "history", sort: "new", lang: "srp", from: "1900", to: "", ebooks: false };
  const hash = searchHash(params);
  assert.equal(hash, "#/search?q=most&subject=history&sort=new&lang=srp&from=1900");
  assert.deepEqual(parseRoute(hash).params, params);
  assert.equal(searchHash({ sort: "relevance" }), "#/search");
});

test("shelf routes", () => {
  assert.deepEqual(parseRoute("#/shelf").params, { status: "all", view: "spines", sort: "added" });
  assert.deepEqual(parseRoute("#/shelf?status=read&view=grid&sort=title").params, { status: "read", view: "grid", sort: "title" });
  assert.equal(shelfHash({ status: "read", view: "spines", sort: "added" }), "#/shelf?status=read");
  assert.equal(shelfHash(), "#/shelf");
});

test("helpers", () => {
  assert.equal(bookHash("/works/OL1W"), "#/book/OL1W");
  assert.ok(hasSearch({ author: "x" }));
  assert.ok(!hasSearch({ lang: "srp" }));
  assert.equal(activeFilterCount({ lang: "srp", from: "1", to: "2", ebooks: true }), 3);
});
