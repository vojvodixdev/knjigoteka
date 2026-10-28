/* © 2026 Nikola Vojvodić · https://vojvodixdev.github.io/ · All rights reserved, see LICENSE. [nv:2919f35f44] */
// Runs before the stylesheet paints, so a dark-mode user never sees a white flash.
(function () {
  var settings = {};
  try {
    settings = (JSON.parse(localStorage.getItem("knjigoteka:v2")) || {}).settings || {};
  } catch (e) { /* storage blocked */ }
  var dark = settings.theme ? settings.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  if (settings.lang) document.documentElement.lang = settings.lang;
})();
