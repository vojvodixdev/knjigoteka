/* © 2026 Nikola Vojvodić · https://vojvodixdev.github.io/ · All rights reserved, see LICENSE. [nv:2919f35f44] */
/**
 * Search results with sorting, filters and "show more" pagination.
 * All search state lives in the URL, so results can be shared and
 * the back button returns to exactly the same list.
 */

import { OfflineError, PAGE_SIZE, SORTS } from "../api.js";
import { activeFilterCount, hasSearch, searchHash } from "../router.js";
import { bookCardHtml, emptyStateHtml, icon, searchFormHtml, skeletonCards } from "../ui.js";
import { escapeHtml as esc, formatNumber, languageName } from "../util.js";
import { TOPICS } from "./home.js";

/** Languages offered in the filter (Open Library uses MARC codes). */
export const FILTER_LANGUAGES = ["srp", "hrv", "bos", "eng", "ger", "fre", "rus", "spa", "ita"];

export function renderSearch(root, initialParams, ctx) {
  const { t, lang } = ctx;
  let params = initialParams;
  let page = 1;
  let shown = 0;
  let total = 0;
  let request = null;

  root.innerHTML = `
    <section class="search-head">
      <div class="container">
        <h1 class="page-title" tabindex="-1" id="search-title"></h1>
        ${searchFormHtml(t, params.q)}
        <div class="toolbar">
          <p class="toolbar__count" id="result-count"></p>
          <div class="toolbar__controls">
            <label class="select-field">
              <span class="select-field__label">${t("sort.label")}</span>
              <select id="sort-select">
                ${SORTS.map((s) => `<option value="${s}">${t(`sort.${s}`)}</option>`).join("")}
              </select>
            </label>
            <button class="btn btn-quiet" type="button" id="filters-toggle" aria-expanded="false" aria-controls="filters">
              ${icon("filter")} <span>${t("filters.title")}</span> <span class="count-badge" id="filters-count" hidden></span>
            </button>
          </div>
        </div>
        <form class="filters" id="filters" hidden>
          <label class="field">
            <span class="field__label">${t("filters.language")}</span>
            <select name="lang">
              <option value="">${t("filters.anyLanguage")}</option>
              ${FILTER_LANGUAGES.map((code) => `<option value="${code}">${esc(languageName(code, lang))}</option>`).join("")}
            </select>
          </label>
          <fieldset class="field field--range">
            <legend class="field__label">${t("filters.year")}</legend>
            <input name="from" type="number" inputmode="numeric" min="-3000" max="2100" placeholder="${t("filters.from")}" aria-label="${t("filters.from")}">
            <span aria-hidden="true">–</span>
            <input name="to" type="number" inputmode="numeric" min="-3000" max="2100" placeholder="${t("filters.to")}" aria-label="${t("filters.to")}">
          </fieldset>
          <label class="check">
            <input name="ebooks" type="checkbox">
            <span>${t("filters.ebooks")}</span>
          </label>
          <div class="filters__actions">
            <button class="btn btn-primary" type="submit">${t("filters.apply")}</button>
            <button class="btn btn-quiet" type="button" data-action="reset-filters">${t("filters.reset")}</button>
          </div>
        </form>
        <ul class="chip-list active-filters" id="active-filters" aria-label="${t("filters.active")}"></ul>
      </div>
    </section>
    <section class="container results" aria-labelledby="search-title">
      <ul class="book-grid" id="results"></ul>
      <div class="results__more" id="more"></div>
    </section>`;

  const el = {
    title: root.querySelector("#search-title"),
    count: root.querySelector("#result-count"),
    sort: root.querySelector("#sort-select"),
    filtersToggle: root.querySelector("#filters-toggle"),
    filtersCount: root.querySelector("#filters-count"),
    filters: root.querySelector("#filters"),
    active: root.querySelector("#active-filters"),
    results: root.querySelector("#results"),
    more: root.querySelector("#more"),
    toolbar: root.querySelector(".toolbar"),
  };

  /* ---------- controls ---------- */

  el.sort.addEventListener("change", () => ctx.go(searchHash({ ...params, sort: el.sort.value })));

  el.filtersToggle.addEventListener("click", () => {
    const open = el.filters.hidden;
    el.filters.hidden = !open;
    el.filtersToggle.setAttribute("aria-expanded", String(open));
    if (open) el.filters.querySelector("select").focus();
  });

  el.filters.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(el.filters);
    let from = String(form.get("from") || "");
    let to = String(form.get("to") || "");
    if (from && to && Number(from) > Number(to)) [from, to] = [to, from];
    el.filters.hidden = true;
    el.filtersToggle.setAttribute("aria-expanded", "false");
    ctx.go(searchHash({ ...params, lang: form.get("lang"), from, to, ebooks: form.get("ebooks") === "on" }));
  });

  el.filters.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      el.filters.hidden = true;
      el.filtersToggle.setAttribute("aria-expanded", "false");
      el.filtersToggle.focus();
    }
  });

  function syncControls() {
    const input = root.querySelector("#search-input");
    if (input && document.activeElement !== input) input.value = params.q;
    el.sort.value = params.sort;
    const fields = el.filters.elements; // not el.filters.lang – that is the form's own lang attribute
    fields.namedItem("lang").value = params.lang;
    fields.namedItem("from").value = params.from;
    fields.namedItem("to").value = params.to;
    fields.namedItem("ebooks").checked = params.ebooks;

    const n = activeFilterCount(params);
    el.filtersCount.hidden = n === 0;
    el.filtersCount.textContent = String(n);

    const chips = [];
    const chip = (label, without) =>
      `<li><a class="chip chip--removable" href="${searchHash({ ...params, ...without })}" aria-label="${esc(t("filters.remove", { label }))}">${esc(label)} ${icon("x")}</a></li>`;
    if (params.subject) chips.push(chip(`${t("filters.topic")}: ${topicLabel(params.subject)}`, { subject: "" }));
    if (params.author) chips.push(chip(`${t("filters.author")}: ${params.author}`, { author: "" }));
    if (params.lang) chips.push(chip(languageName(params.lang, lang), { lang: "" }));
    if (params.from || params.to) chips.push(chip(`${params.from || "…"}–${params.to || "…"}`, { from: "", to: "" }));
    if (params.ebooks) chips.push(chip(t("filters.ebooksShort"), { ebooks: false }));
    el.active.innerHTML = chips.join("");
    el.active.hidden = chips.length === 0;
  }

  function topicLabel(subject) {
    const topic = TOPICS.find(([s]) => s === subject);
    return topic ? t(topic[1]) : subject;
  }

  function heading() {
    if (params.q) return t("search.titleFor", { q: params.q });
    if (params.author) return params.author;
    if (params.subject) return topicLabel(params.subject);
    return t("search.title");
  }

  /* ---------- fetching ---------- */

  async function run(nextPage = 1) {
    request?.abort();
    request = new AbortController();
    const signal = AbortSignal.any ? AbortSignal.any([request.signal, ctx.signal]) : request.signal;
    page = nextPage;

    if (page === 1) {
      shown = 0;
      el.results.setAttribute("aria-busy", "true");
      el.results.innerHTML = skeletonCards(12);
      el.more.innerHTML = "";
      el.count.textContent = t("search.loading");
    } else {
      el.more.innerHTML = `<p class="results__loading">${t("search.loading")}</p>`;
    }

    try {
      const result = await ctx.api.search({ ...params, page }, signal);
      result.items.forEach((b) => ctx.workCache.set(b.key, b));
      total = result.total;

      if (page === 1 && params.q) ctx.store.addRecent(params.q);

      if (page === 1 && result.items.length === 0) {
        el.results.innerHTML = "";
        el.count.textContent = "";
        el.more.innerHTML = emptyStateHtml({
          title: t("search.emptyTitle"),
          text: activeFilterCount(params) ? t("search.emptyWithFilters") : t("search.emptyText"),
          actions: activeFilterCount(params)
            ? `<button class="btn btn-primary" type="button" data-action="reset-filters">${t("filters.reset")}</button>`
            : "",
        });
        ctx.announce(t("search.emptyTitle"));
        return;
      }

      const html = result.items.map((b) => bookCardHtml(b, ctx)).join("");
      if (page === 1) el.results.innerHTML = html;
      else el.results.insertAdjacentHTML("beforeend", html);
      shown += result.items.length;

      const countText = t("search.count", { shown: formatNumber(shown, lang), total: formatNumber(total, lang), n: total });
      el.count.textContent = countText;
      if (page === 1) ctx.announce(countText);

      const hasMore = shown < total && result.items.length === PAGE_SIZE;
      el.more.innerHTML = hasMore
        ? `<button class="btn btn-secondary btn-wide" type="button" data-action="more">${t("search.more")}</button>`
        : shown > PAGE_SIZE ? `<p class="results__end">${t("search.end")}</p>` : "";

      if (page === 1) ctx.restoreScroll();
      else el.results.children[shown - result.items.length]?.querySelector("a")?.focus({ preventScroll: true });
    } catch (error) {
      if (error.name === "AbortError") return;
      el.count.textContent = "";
      if (page === 1) el.results.innerHTML = "";
      const offline = error instanceof OfflineError;
      el.more.innerHTML = emptyStateHtml({
        title: offline ? t("error.offlineTitle") : t("error.apiTitle"),
        text: offline ? t("error.offlineSearch") : t("error.apiText"),
        actions: offline
          ? `<a class="btn btn-primary" href="#/shelf">${t("nav.shelf")}</a>`
          : `<button class="btn btn-primary" type="button" data-action="retry">${t("error.retry")}</button>`,
      });
      ctx.announce(offline ? t("error.offlineTitle") : t("error.apiTitle"));
    } finally {
      el.results.removeAttribute("aria-busy");
    }
  }

  function show(next) {
    params = next;
    el.title.textContent = heading();
    ctx.setTitle(heading());
    syncControls();

    if (!hasSearch(params)) {
      el.toolbar.hidden = true;
      el.results.innerHTML = "";
      el.more.innerHTML = emptyStateHtml({
        title: t("search.startTitle"),
        text: t("search.startText"),
        actions: `<ul class="chip-list">${TOPICS.slice(0, 6).map(([subject, key]) =>
          `<li><a class="chip chip--topic" href="${searchHash({ subject })}">${t(key)}</a></li>`).join("")}</ul>`,
      });
      return;
    }
    el.toolbar.hidden = false;
    run(1);
  }

  show(params);

  return {
    update: show,
    onAction(action) {
      if (action === "more") run(page + 1);
      if (action === "retry") run(page);
      if (action === "reset-filters") ctx.go(searchHash({ ...params, lang: "", from: "", to: "", ebooks: false }));
    },
    destroy() {
      request?.abort();
    },
  };
}
