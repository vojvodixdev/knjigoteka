import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, workId, isWorkId, hashString, truncate, languageName, formatNumber } from "../../app/js/util.js";

test("escapeHtml neutralises markup from the API", () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml("Tom & Jerry's"), "Tom &amp; Jerry&#39;s");
});

test("workId extracts and validates Open Library work ids", () => {
  assert.equal(workId("/works/OL45804W"), "OL45804W");
  assert.ok(isWorkId("OL45804W"));
  assert.ok(!isWorkId("OL45804M"));
  assert.ok(!isWorkId("../etc"));
});

test("hashString is stable", () => {
  assert.equal(hashString("/works/OL1W"), hashString("/works/OL1W"));
  assert.notEqual(hashString("/works/OL1W"), hashString("/works/OL2W"));
});

test("truncate adds an ellipsis only when needed", () => {
  assert.equal(truncate("Kratko", 10), "Kratko");
  assert.equal(truncate("Na Drini ćuprija", 9), "Na Drini…");
});

test("languageName handles MARC codes in both languages", () => {
  assert.equal(languageName("eng", "en"), "English");
  assert.equal(languageName("ger", "en"), "German");
  assert.equal(languageName("srp", "sr"), "Srpski");
  assert.equal(languageName("", "sr"), "");
});

test("formatNumber uses the locale's separators", () => {
  assert.equal(formatNumber(12345, "sr"), "12.345");
  assert.equal(formatNumber(12345, "en"), "12,345");
});
