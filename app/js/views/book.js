/**
 * One book: cover, facts, description and subjects from the Works API,
 * plus the reader's own status, rating and note.
 */

import { OfflineError, openLibraryUrl } from "../api.js";
import { STATUSES } from "../store.js";
import { searchHash } from "../router.js";
import { coverHtml, emptyStateHtml, icon, starsHtml } from "../ui.js";
import { debounce, escapeHtml as esc, formatNumber, languageName, localeFor } from "../util.js";

export function renderBook(root, { id }, ctx) {
  const { t, lang, store, api, signal } = ctx;
  const key = `/works/${id}`;
  let book = ctx.workCache.get(key) || store.get(key);
  let details = null;
  let detailsState = "loading"; // loading | ready | offline | error

  let notePending = false;
  const saveNote = debounce((value) => {
    notePending = false;
    store.update(key, { note: value });
    const status = root.querySelector("#note-status");
    if (status) status.textContent = t("book.noteSaved");
  }, 600);

  function paint() {
    if (!book) {
      root.innerHTML = `<div class="container book-loading" aria-busy="true"><p>${t("search.loading")}</p></div>`;
      return;
    }
    ctx.setTitle(book.title);
    const languages = book.languages.map((code) => languageName(code, lang));
    const facts = [
      book.year && [t("book.firstPublished"), book.year],
      book.editions && [t("book.editions"), formatNumber(book.editions, lang)],
      book.pages && [t("book.pages"), formatNumber(book.pages, lang)],
      book.rating && [t("book.communityRating"),
        `${starsHtml(book.rating)} <span>${formatNumber(book.rating, lang, { minimumFractionDigits: 1 })}</span>
         <span class="facts__muted">(${t("book.ratingCount", { n: book.ratingCount, count: formatNumber(book.ratingCount, lang) })})</span>`],
    ].filter(Boolean);

    const readable = book.ebook === "public" || book.ebook === "borrowable";

    root.innerHTML = `
      <article class="book">
        <div class="container">
          <a class="back-link" href="#/" data-action="back">${icon("arrow-left")} ${t("book.back")}</a>
          <div class="book__layout">
            <div class="book__cover">
              ${coverHtml({ ...book, coverId: book.coverId || details?.coverId }, { size: "L", eager: true, alt: t("book.coverAlt", { title: book.title }) })}
            </div>
            <div class="book__main">
              <h1 class="book__title" tabindex="-1">${esc(book.title)}</h1>
              <p class="book__authors">
                ${book.authors.length
                  ? book.authors.map((a) => `<a href="${searchHash({ author: a })}">${esc(a)}</a>`).join(", ")
                  : t("book.unknownAuthor")}
              </p>
              ${facts.length ? `<dl class="facts">${facts.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join("")}</dl>` : ""}
              <section class="shelf-panel" id="shelf-panel" aria-labelledby="shelf-panel-title"></section>
              <div class="book__actions">
                ${readable ? `<a class="btn btn-secondary" href="${openLibraryUrl(key)}" target="_blank" rel="noopener">${icon("book-open")} ${t(book.ebook === "public" ? "book.readFree" : "book.borrow")}</a>` : ""}
                <a class="btn btn-quiet" href="${openLibraryUrl(key)}" target="_blank" rel="noopener">${icon("external")} ${t("book.openLibrary")}</a>
                <button class="btn btn-quiet" type="button" data-action="share">${icon("share")} ${t("book.share")}</button>
              </div>
            </div>
          </div>

          <section class="book__about" aria-labelledby="about-title">
            <h2 class="section__title" id="about-title">${t("book.about")}</h2>
            <div class="prose" id="description">${descriptionHtml()}</div>
            ${details?.subjects?.length ? `
              <h3 class="book__subhead">${t("book.subjects")}</h3>
              <ul class="chip-list">
                ${details.subjects.map((s) => `<li><a class="chip" href="${searchHash({ subject: s })}">${esc(s)}</a></li>`).join("")}
              </ul>` : ""}
            ${languages.length ? `
              <h3 class="book__subhead">${t("book.languages")}</h3>
              <p class="book__languages">${esc(languages.join(", "))}</p>` : ""}
          </section>
        </div>
      </article>`;

    paintShelfPanel();
  }

  function descriptionHtml() {
    if (detailsState === "loading") return `<span class="skeleton-line"></span><span class="skeleton-line"></span><span class="skeleton-line skeleton-line--short"></span>`;
    if (detailsState === "offline") return `<p class="muted">${t("book.descriptionOffline")}</p>`;
    const text = details?.description || details?.firstSentence;
    if (!text) return `<p class="muted">${t("book.noDescription")}</p>`;
    return text.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  }

  function paintShelfPanel() {
    const panel = root.querySelector("#shelf-panel");
    if (!panel) return;
    const saved = store.get(key);

    if (!saved) {
      panel.innerHTML = `
        <h2 class="shelf-panel__title" id="shelf-panel-title">${t("book.addTitle")}</h2>
        <div class="segmented">
          ${STATUSES.map((s) => `<button class="segmented__btn" type="button" data-action="add" data-status="${s}">${t(`status.${s}`)}</button>`).join("")}
        </div>`;
      return;
    }

    const added = new Intl.DateTimeFormat(localeFor(lang), { dateStyle: "medium" }).format(saved.addedAt);
    panel.innerHTML = `
      <h2 class="shelf-panel__title" id="shelf-panel-title">${t("book.onShelf")}</h2>
      <div class="segmented" role="group" aria-labelledby="shelf-panel-title">
        ${STATUSES.map((s) => `
          <button class="segmented__btn" type="button" data-action="status" data-status="${s}" aria-pressed="${saved.status === s}">
            ${saved.status === s ? icon("check") : ""}${t(`status.${s}`)}
          </button>`).join("")}
      </div>
      <div class="rating-input" role="group" aria-label="${esc(t("book.yourRating"))}">
        <span class="rating-input__label" aria-hidden="true">${t("book.yourRating")}</span>
        ${[1, 2, 3, 4, 5].map((n) => `
          <button type="button" class="star-btn" data-action="rate" data-value="${n}"
                  aria-pressed="${saved.myRating === n}" aria-label="${esc(t("book.rateN", { n }))}">
            ${icon(n <= saved.myRating ? "star-fill" : "star")}
          </button>`).join("")}
      </div>
      <label class="field field--note">
        <span class="field__label">${t("book.note")}</span>
        <textarea id="note" rows="3" maxlength="2000" placeholder="${esc(t("book.notePlaceholder"))}">${esc(saved.note)}</textarea>
        <span class="field__hint" id="note-status" aria-live="polite"></span>
      </label>
      <p class="shelf-panel__meta">
        <span>${t("book.addedOn", { date: added })}</span>
        <button class="link-btn link-btn--danger" type="button" data-action="remove">${t("book.remove")}</button>
      </p>`;

    panel.querySelector("#note").addEventListener("input", (event) => {
      panel.querySelector("#note-status").textContent = "";
      notePending = true;
      saveNote(event.target.value);
    });
  }

  /* ---------- loading ---------- */

  paint();

  if (!book) {
    api.workSummary(id, signal)
      .then((summary) => {
        if (summary) {
          book = summary;
          ctx.workCache.set(key, summary);
          paint();
        } else if (detailsState !== "loading" && !book) {
          notFound();
        }
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        if (!book && detailsState !== "loading") notFound(error instanceof OfflineError);
      });
  }

  api.workDetails(id, signal)
    .then((result) => {
      details = result;
      detailsState = "ready";
      if (!book && result.title) {
        book = { key, title: result.title, authors: [], year: null, coverId: result.coverId, editions: null, pages: null, rating: null, ratingCount: 0, languages: [], ebook: "no_ebook" };
      }
      if (book) paint();
    })
    .catch((error) => {
      if (error.name === "AbortError") return;
      detailsState = error instanceof OfflineError ? "offline" : "error";
      if (book) {
        const box = root.querySelector("#description");
        if (box) box.innerHTML = descriptionHtml();
      } else {
        notFound(error instanceof OfflineError);
      }
    });

  function notFound(offline = false) {
    ctx.setTitle(t("notFound.title"));
    root.innerHTML = `<div class="container">${emptyStateHtml({
      title: offline ? t("error.offlineTitle") : t("book.notFound"),
      text: offline ? t("book.offlineUnknown") : t("book.notFoundText"),
      actions: `<a class="btn btn-primary" href="#/">${t("nav.discover")}</a>`,
    })}</div>`;
  }

  /* ---------- actions ---------- */

  async function share() {
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: book.title, text: `${book.title} – ${book.authors.join(", ")}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      ctx.toast(t("book.linkCopied"));
    } catch (error) {
      if (error?.name !== "AbortError") ctx.toast(t("book.shareFailed"));
    }
  }

  return {
    onAction(action, target) {
      if (!book) return;
      const note = root.querySelector("#note");
      if (notePending && note) saveNote.flush(note.value); // don't lose typing when the panel repaints
      switch (action) {
        case "add":
          store.add(book, target.dataset.status);
          ctx.requestPersistence();
          ctx.toast(t("toast.addedAs", { status: t(`status.${target.dataset.status}`) }));
          paintShelfPanel();
          root.querySelector('[data-action="status"][aria-pressed="true"]')?.focus();
          break;
        case "status":
          store.setStatus(key, target.dataset.status);
          paintShelfPanel();
          root.querySelector(`[data-action="status"][data-status="${target.dataset.status}"]`)?.focus();
          break;
        case "rate": {
          const value = Number(target.dataset.value);
          const current = store.get(key)?.myRating;
          store.update(key, { myRating: current === value ? 0 : value });
          paintShelfPanel();
          root.querySelector(`[data-action="rate"][data-value="${value}"]`)?.focus();
          break;
        }
        case "remove": {
          const index = store.indexOf(key);
          const removed = store.remove(key);
          paintShelfPanel();
          ctx.toast(t("toast.removed"), {
            action: t("toast.undo"),
            onAction: () => { store.restore(removed, index); paintShelfPanel(); },
          });
          root.querySelector('[data-action="add"]')?.focus();
          break;
        }
        case "share":
          share();
          break;
        default:
      }
    },
    destroy() {
      const note = root.querySelector("#note");
      if (notePending && note) saveNote.flush(note.value);
    },
  };
}
