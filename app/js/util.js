/**
 * Small, dependency-free helpers. Everything here is pure so it can be
 * unit-tested in Node without a browser.
 */

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes text before it is placed inside an HTML template (XSS protection). */
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/** "/works/OL45804W" -> "OL45804W" */
export function workId(key) {
  return String(key ?? "").split("/").filter(Boolean).pop() || "";
}

export function isWorkId(id) {
  return /^OL\d+W$/.test(String(id));
}

/** Deterministic 32-bit FNV-1a hash, used to give each book a stable colour/size. */
export function hashString(text) {
  let hash = 2166136261;
  const str = String(text ?? "");
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function truncate(text, max) {
  const str = String(text ?? "");
  return str.length > max ? `${str.slice(0, max - 1).trimEnd()}…` : str;
}

export function debounce(fn, wait) {
  let timer = null;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  debounced.flush = (...args) => {
    clearTimeout(timer);
    fn(...args);
  };
  return debounced;
}

export function localeFor(lang) {
  return lang === "en" ? "en-GB" : "sr-Latn-RS";
}

export function formatNumber(value, lang, options) {
  return new Intl.NumberFormat(localeFor(lang), options).format(value);
}

/** MARC bibliographic codes that differ from the ISO 639-2/T codes Intl understands. */
const MARC_TO_ISO = {
  ger: "de", fre: "fr", chi: "zh", dut: "nl", cze: "cs", gre: "el", rum: "ro",
  mac: "mk", per: "fa", arm: "hy", geo: "ka", ice: "is", alb: "sq", baq: "eu",
  bur: "my", wel: "cy", slo: "sk", tib: "bo", mao: "mi", may: "ms", scc: "sr", scr: "hr",
};

/** Turns an Open Library language code ("srp", "ger") into a readable name. */
export function languageName(code, lang) {
  const raw = String(code ?? "").toLowerCase();
  if (!raw) return "";
  const iso = MARC_TO_ISO[raw] || raw;
  try {
    const names = new Intl.DisplayNames([localeFor(lang)], { type: "language" });
    const name = names.of(iso);
    if (name && name.toLowerCase() !== iso) return name.charAt(0).toLocaleUpperCase(localeFor(lang)) + name.slice(1);
  } catch {
    /* unknown code – fall through */
  }
  return raw.toUpperCase();
}

/** Today's date as YYYY-MM-DD, used for export file names. */
export function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
