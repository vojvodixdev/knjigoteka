// Serves Open Library requests from local fixtures so tests are fast and deterministic.
import { readFileSync } from "node:fs";

const fixture = (name) => readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8");
const json = (body, status = 200) => ({ status, contentType: "application/json", body, headers: { "Access-Control-Allow-Origin": "*" } });

export async function mockOpenLibrary(target, { failSearch = false } = {}) {
  await target.route("https://openlibrary.org/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/search.json") {
      if (failSearch) return route.fulfill(json("{}", 500));
      const q = url.searchParams.get("q") || "";
      if (q.startsWith("key:")) {
        const id = q.split("/").pop();
        const all = [...JSON.parse(fixture("search-page1.json")).docs, ...JSON.parse(fixture("search-page2.json")).docs];
        return route.fulfill(json(JSON.stringify({ numFound: 1, docs: all.filter((d) => d.key.endsWith(id)) })));
      }
      if (q.includes("nemanema")) return route.fulfill(json(fixture("search-empty.json")));
      return route.fulfill(json(fixture(url.searchParams.get("page") === "2" ? "search-page2.json" : "search-page1.json")));
    }
    if (url.pathname.startsWith("/trending/")) return route.fulfill(json(fixture("trending.json")));
    const work = url.pathname.match(/^\/works\/(OL\d+W)\.json$/);
    if (work) {
      if (work[1] === "OL9000001W") return route.fulfill(json(fixture("work-OL9000001W.json")));
      return route.fulfill(json(JSON.stringify({ key: `/works/${work[1]}`, subjects: ["Fiction"] })));
    }
    return route.fulfill(json("{}", 404));
  });
  // Covers: answer 404 so the generated cloth covers are used (no external images in tests)
  await target.route("https://covers.openlibrary.org/**", (route) => route.fulfill({ status: 404, body: "" }));
}
