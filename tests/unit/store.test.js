import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore, sanitizeShelfBook, STORAGE_KEY, LEGACY_KEY } from "../../app/js/store.js";

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k), data };
}

const book = (n, extra = {}) => ({ key: `/works/OL${n}W`, title: `Book ${n}`, authors: ["A"], year: 2000, coverId: null, pages: 100 * n, ...extra });

function clock(start = Date.UTC(2026, 9, 20)) {
  let time = start;
  const now = () => time;
  now.tick = (ms = 1000) => { time += ms; };
  return now;
}

test("add, has, remove and restore at the same position", () => {
  const store = createStore(memoryStorage());
  store.add(book(1));
  store.add(book(2));
  store.add(book(3));
  assert.deepEqual(store.books.map((b) => b.key), ["/works/OL3W", "/works/OL2W", "/works/OL1W"]);
  const index = store.indexOf("/works/OL2W");
  const removed = store.remove("/works/OL2W");
  assert.ok(!store.has("/works/OL2W"));
  store.restore(removed, index);
  assert.deepEqual(store.books.map((b) => b.key), ["/works/OL3W", "/works/OL2W", "/works/OL1W"]);
});

test("data survives a reload from storage", () => {
  const storage = memoryStorage();
  createStore(storage).add(book(1), "reading");
  const reloaded = createStore(storage);
  assert.equal(reloaded.get("/works/OL1W").status, "reading");
});

test("status changes set and clear finishedAt", () => {
  const now = clock();
  const store = createStore(memoryStorage(), { now });
  store.add(book(1));
  assert.equal(store.get("/works/OL1W").finishedAt, null);
  now.tick();
  store.setStatus("/works/OL1W", "read");
  const finished = store.get("/works/OL1W").finishedAt;
  assert.equal(finished, now());
  now.tick();
  store.update("/works/OL1W", { myRating: 5 });
  assert.equal(store.get("/works/OL1W").finishedAt, finished, "rating does not move the finish date");
  store.setStatus("/works/OL1W", "want");
  assert.equal(store.get("/works/OL1W").finishedAt, null);
  assert.equal(store.setStatus("/works/OL1W", "burned"), null);
});

test("ratings are clamped and notes are limited", () => {
  const store = createStore(memoryStorage());
  store.add(book(1));
  store.update("/works/OL1W", { myRating: 9, note: "x".repeat(5000) });
  assert.equal(store.get("/works/OL1W").myRating, 5);
  assert.equal(store.get("/works/OL1W").note.length, 2000);
});

test("counts and stats", () => {
  const now = clock();
  const store = createStore(memoryStorage(), { now });
  store.add(book(1), "read");
  store.add(book(2), "read");
  store.add(book(3), "reading");
  store.update("/works/OL1W", { myRating: 4 });
  store.update("/works/OL2W", { myRating: 5 });
  assert.deepEqual(store.counts(), { all: 3, want: 0, reading: 1, read: 2 });
  assert.deepEqual(store.stats(2026), { total: 3, readThisYear: 2, pagesRead: 300, averageRating: 4.5 });
  assert.equal(store.stats(2025).readThisYear, 0);
});

test("recent searches are unique, newest first and capped", () => {
  const store = createStore(memoryStorage());
  ["a", "b", "A", "c", "d", "e", "f", "g"].forEach((q) => store.addRecent(q));
  assert.deepEqual(store.recent, ["g", "f", "e", "d", "c", "A"]);
  store.clearRecent();
  assert.deepEqual(store.recent, []);
});

test("migrates the version 1 list from the thesis app", () => {
  const legacy = [{ key: "/works/OL7W", title: "Na Drini ćuprija", author_name: ["Ivo Andrić"], first_publish_year: 1945, cover_i: 1 }];
  const store = createStore(memoryStorage({ [LEGACY_KEY]: JSON.stringify(legacy) }));
  const migrated = store.get("/works/OL7W");
  assert.equal(migrated.title, "Na Drini ćuprija");
  assert.deepEqual(migrated.authors, ["Ivo Andrić"]);
  assert.equal(migrated.status, "want");
});

test("corrupted storage starts with an empty shelf", () => {
  const store = createStore(memoryStorage({ [STORAGE_KEY]: "{not json" }));
  assert.equal(store.books.length, 0);
});

test("export and import round-trip; import merges by newest copy", () => {
  const now = clock();
  const a = createStore(memoryStorage(), { now });
  a.add(book(1), "read");
  a.add(book(2));
  const exported = a.exportJson();

  const b = createStore(memoryStorage(), { now });
  b.add(book(2), "reading");
  now.tick(5000);
  b.update("/works/OL2W", { note: "newer here" });
  const result = b.importJson(exported);
  assert.deepEqual(result, { added: 1, updated: 0, skipped: 1 });
  assert.equal(b.get("/works/OL2W").note, "newer here");
  assert.ok(b.has("/works/OL1W"));
});

test("import rejects files that are not backups", () => {
  const store = createStore(memoryStorage());
  assert.throws(() => store.importJson("nope"), /invalid-json/);
  assert.throws(() => store.importJson('{"x":1}'), /invalid-format/);
  const result = store.importJson(JSON.stringify([{ key: "/works/../../x", title: "bad" }, { title: "no key" }]));
  assert.deepEqual(result, { added: 0, updated: 0, skipped: 2 });
});

test("sanitizeShelfBook strips unknown fields", () => {
  const clean = sanitizeShelfBook({ ...book(1), status: "read", evil: "<script>", myRating: 3 });
  assert.equal(clean.evil, undefined);
  assert.equal(clean.status, "read");
  assert.equal(clean.myRating, 3);
});
