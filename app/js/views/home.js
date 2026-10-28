/* © 2026 Nikola Vojvodić · https://vojvodixdev.github.io/ · All rights reserved, see LICENSE. [nv:2919f35f44] */
/**
 * Home: search hero, topics, "currently reading" and today's trending books.
 */

import { searchHash, bookHash } from "../router.js";
import { bookCardHtml, coverHtml, decorativeSpines, searchFormHtml, skeletonCards, spineHtml } from "../ui.js";
import { escapeHtml as esc } from "../util.js";

/** Topics map a label key to the Open Library subject they search. */
export const TOPICS = [
  ["fantasy", "topic.fantasy"],
  ["science fiction", "topic.scifi"],
  ["mystery", "topic.mystery"],
  ["love", "topic.love"],
  ["history", "topic.history"],
  ["philosophy", "topic.philosophy"],
  ["poetry", "topic.poetry"],
  ["biography", "topic.biography"],
  ["psychology", "topic.psychology"],
  ["children", "topic.children"],
];

export function renderHome(root, _params, ctx) {
  const { t, store, api, signal } = ctx;
  ctx.setTitle(t("home.docTitle"));

  const reading = store.books.filter((b) => b.status === "reading").slice(0, 6);
  const shelfPreview = store.books.slice(0, 14);

  root.innerHTML = `
    <section class="hero">
      <div class="container hero__inner">
        <div class="hero__copy">
          <h1 class="hero__title" tabindex="-1">${t("home.title")}</h1>
          <p class="hero__lead">${t("home.lead")}</p>
          ${searchFormHtml(t, "", { large: true })}
          ${store.recent.length ? `
            <div class="recent">
              <span class="recent__label">${t("home.recent")}</span>
              <ul class="chip-list">
                ${store.recent.map((q) => `<li><a class="chip" href="${searchHash({ q })}">${esc(q)}</a></li>`).join("")}
              </ul>
              <button class="link-btn" type="button" data-action="clear-recent">${t("home.clearRecent")}</button>
            </div>` : ""}
        </div>
        <a class="hero__shelf" href="#/shelf" aria-label="${esc(t("home.openShelf"))}">
          <ul class="bookcase bookcase--hero" role="list">
            ${shelfPreview.length
              ? shelfPreview.map((b) => spineHtml(b, t, { link: false })).join("")
              : `<li class="spine-slot spine-slot--blank" aria-hidden="true">${decorativeSpines(11)}</li>`}
          </ul>
          <span class="hero__shelf-caption">${shelfPreview.length ? t("home.shelfCaption", { count: store.books.length }) : t("home.shelfEmpty")}</span>
        </a>
      </div>
    </section>

    <section class="section container" aria-labelledby="topics-title">
      <h2 class="section__title" id="topics-title">${t("home.topics")}</h2>
      <ul class="chip-list chip-list--topics">
        ${TOPICS.map(([subject, key]) => `<li><a class="chip chip--topic" href="${searchHash({ subject })}">${t(key)}</a></li>`).join("")}
      </ul>
    </section>

    ${reading.length ? `
      <section class="section container" aria-labelledby="reading-title">
        <h2 class="section__title" id="reading-title">${t("home.reading")}</h2>
        <ul class="reading-list">
          ${reading.map((b) => `
            <li>
              <a class="reading-item" href="${bookHash(b.key)}">
                ${coverHtml(b, { size: "S", className: "cover--small" })}
                <span class="reading-item__text">
                  <span class="reading-item__title">${esc(b.title)}</span>
                  <span class="reading-item__author">${esc(b.authors?.[0] || "")}</span>
                </span>
              </a>
            </li>`).join("")}
        </ul>
      </section>` : ""}

    <section class="section container" aria-labelledby="trending-title" id="trending-section">
      <div class="section__head">
        <h2 class="section__title" id="trending-title">${t("home.trending")}</h2>
        <p class="section__note">${t("home.trendingNote")}</p>
      </div>
      <ul class="book-row" id="trending">${skeletonCards(6)}</ul>
    </section>`;

  const list = root.querySelector("#trending");
  api.trending(signal)
    .then((books) => {
      books.forEach((b) => ctx.workCache.set(b.key, b));
      if (!books.length) throw new Error("empty");
      list.innerHTML = books.map((b) => bookCardHtml(b, ctx)).join("");
    })
    .catch((error) => {
      if (error.name === "AbortError") return;
      root.querySelector("#trending-section").hidden = true;
    });

  return {
    onAction(action) {
      if (action === "clear-recent") {
        store.clearRecent();
        root.querySelector(".recent")?.remove();
        ctx.searchInput()?.focus();
      }
    },
  };
}
