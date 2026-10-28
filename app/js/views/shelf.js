/* © 2026 Nikola Vojvodić · https://vojvodixdev.github.io/ · All rights reserved, see LICENSE. [nv:2919f35f44] */
/**
 * The reader's shelf: reading stats, status tabs, a bookcase (spines)
 * or grid view, and JSON backup/restore.
 */

import { STATUSES } from "../store.js";
import { SHELF_SORTS, shelfHash } from "../router.js";
import { bookCardHtml, emptyStateHtml, icon, spineHtml } from "../ui.js";
import { escapeHtml as esc, formatNumber, isoDate, localeFor } from "../util.js";

export function sortShelf(books, sort, lang = "sr") {
  const collator = new Intl.Collator(localeFor(lang), { sensitivity: "base" });
  const list = [...books];
  switch (sort) {
    case "title":
      return list.sort((a, b) => collator.compare(a.title, b.title));
    case "author":
      return list.sort((a, b) => collator.compare(a.authors[0] || "￿", b.authors[0] || "￿"));
    case "rating":
      return list.sort((a, b) => b.myRating - a.myRating || b.addedAt - a.addedAt);
    default:
      return list.sort((a, b) => b.addedAt - a.addedAt);
  }
}

export function renderShelf(root, initialParams, ctx) {
  const { t, lang, store } = ctx;
  let params = initialParams;
  ctx.setTitle(t("shelf.title"));

  root.innerHTML = `
    <section class="shelf-head">
      <div class="container">
        <h1 class="page-title" tabindex="-1">${t("shelf.title")}</h1>
        <dl class="stats" id="stats"></dl>
        <div class="shelf-controls">
          <nav class="tabs" aria-label="${esc(t("shelf.filterLabel"))}" id="status-tabs"></nav>
          <div class="shelf-controls__right">
            <label class="select-field">
              <span class="select-field__label">${t("sort.label")}</span>
              <select id="shelf-sort">
                ${SHELF_SORTS.map((s) => `<option value="${s}">${t(`shelfSort.${s}`)}</option>`).join("")}
              </select>
            </label>
            <div class="view-toggle" role="group" aria-label="${esc(t("shelf.viewLabel"))}">
              <button type="button" class="icon-btn" data-action="view" data-view="spines" aria-label="${esc(t("shelf.viewSpines"))}" title="${esc(t("shelf.viewSpines"))}">${icon("spines")}</button>
              <button type="button" class="icon-btn" data-action="view" data-view="grid" aria-label="${esc(t("shelf.viewGrid"))}" title="${esc(t("shelf.viewGrid"))}">${icon("grid")}</button>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="container shelf-body" id="shelf-body" aria-live="polite"></section>
    <section class="container backup" aria-labelledby="backup-title">
      <h2 class="section__title" id="backup-title">${t("backup.title")}</h2>
      <p class="backup__text">${t("backup.text")}</p>
      <div class="backup__actions">
        <button class="btn btn-secondary" type="button" data-action="export">${icon("download")} ${t("backup.export")}</button>
        <label class="btn btn-quiet file-btn">
          ${icon("upload")} ${t("backup.import")}
          <input type="file" id="import-file" accept="application/json,.json" class="visually-hidden">
        </label>
      </div>
    </section>`;

  const el = {
    stats: root.querySelector("#stats"),
    tabs: root.querySelector("#status-tabs"),
    sort: root.querySelector("#shelf-sort"),
    body: root.querySelector("#shelf-body"),
    file: root.querySelector("#import-file"),
  };

  el.sort.addEventListener("change", () => ctx.go(shelfHash({ ...params, sort: el.sort.value })));

  el.file.addEventListener("change", async () => {
    const file = el.file.files?.[0];
    el.file.value = "";
    if (!file) return;
    try {
      const result = store.importJson(await file.text());
      ctx.toast(t("backup.imported", { added: result.added, updated: result.updated }));
    } catch {
      ctx.toast(t("backup.importFailed"));
    }
  });

  function paint() {
    const counts = store.counts();
    const stats = store.stats();

    el.stats.innerHTML = [
      [t("shelf.statTotal"), formatNumber(stats.total, lang)],
      [t("shelf.statReadYear", { year: new Date().getFullYear() }), formatNumber(stats.readThisYear, lang)],
      [t("shelf.statPages"), formatNumber(stats.pagesRead, lang)],
      [t("shelf.statRating"), stats.averageRating ? formatNumber(stats.averageRating, lang, { maximumFractionDigits: 1 }) : "–"],
    ].map(([dt, dd]) => `<div class="stats__item"><dt>${dt}</dt><dd>${dd}</dd></div>`).join("");

    el.tabs.innerHTML = ["all", ...STATUSES].map((s) => `
      <a class="tab" href="${shelfHash({ ...params, status: s })}" ${params.status === s ? 'aria-current="page"' : ""}>
        ${t(s === "all" ? "shelf.all" : `status.${s}`)} <span class="tab__count">${counts[s]}</span>
      </a>`).join("");

    el.sort.value = params.sort;
    root.querySelectorAll('[data-action="view"]').forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === params.view)));

    const books = sortShelf(params.status === "all" ? store.books : store.books.filter((b) => b.status === params.status), params.sort, lang);

    if (!books.length) {
      el.body.innerHTML = store.books.length
        ? emptyStateHtml({ title: t("shelf.emptyStatusTitle"), text: t("shelf.emptyStatusText"), actions: `<a class="btn btn-secondary" href="${shelfHash({ ...params, status: "all" })}">${t("shelf.showAll")}</a>` })
        : emptyStateHtml({ title: t("shelf.emptyTitle"), text: t("shelf.emptyText"), actions: `<a class="btn btn-primary" href="#/">${t("shelf.emptyAction")}</a>` });
      return;
    }

    el.body.innerHTML = params.view === "grid"
      ? `<ul class="book-grid">${books.map((b) => bookCardHtml(b, ctx)).join("")}</ul>`
      : `<ul class="bookcase" role="list">${books.map((b) => spineHtml(b, t)).join("")}</ul>
         <p class="bookcase__legend">
           <span class="legend legend--reading">${t("status.reading")}</span>
           <span class="legend legend--read">${t("status.read")}</span>
         </p>`;
  }

  function exportShelf() {
    const blob = new Blob([store.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `knjigoteka-${isoDate()}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    ctx.toast(t("backup.exported", { n: store.books.length }));
  }

  const unsubscribe = store.subscribe(paint);
  paint();
  ctx.restoreScroll();

  return {
    update(next) {
      params = next;
      paint();
    },
    onAction(action, target) {
      if (action === "view") ctx.go(shelfHash({ ...params, view: target.dataset.view }));
      if (action === "export") exportShelf();
    },
    destroy: unsubscribe,
  };
}
