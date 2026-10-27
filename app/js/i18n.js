/**
 * Serbian (Latin) and English UI strings.
 *
 * A value is either a string with {placeholders} or an object of plural
 * forms ({ one, few, other }) chosen with Intl.PluralRules from `n`.
 */

import { localeFor } from "./util.js";

export const MESSAGES = {
  sr: {
    "app.skip": "Preskoči na sadržaj",
    "app.offline": "Nema interneta. Polica i ranije otvorene stranice i dalje rade.",
    "app.install": "Instaliraj",
    "theme.toDark": "Uključi tamni režim",
    "theme.toLight": "Uključi svetli režim",
    "lang.switch": "Switch to English",
    "footer.text": "Knjigoteka je progresivna web aplikacija. Radi i bez interneta i može da se instalira.",
    "footer.source": "Podaci: Open Library",
    "footer.made": "Napravio Nikola Vojvodić",

    "nav.label": "Glavna navigacija",
    "nav.discover": "Otkrij",
    "nav.search": "Pretraga",
    "nav.shelf": "Moja polica",

    "home.docTitle": "Otkrij knjige",
    "home.title": "Šta čitaš sledeće?",
    "home.lead": "Pretraži katalog Open Library, sačuvaj knjige na svoju policu i prati šta si pročitao. Sve sačuvano radi i bez interneta.",
    "home.recent": "Nedavno",
    "home.clearRecent": "Obriši",
    "home.openShelf": "Otvori moju policu",
    "home.shelfCaption": { one: "{count} knjiga na tvojoj polici", few: "{count} knjige na tvojoj polici", other: "{count} knjiga na tvojoj polici" },
    "home.shelfEmpty": "Tvoja polica čeka prvu knjigu",
    "home.topics": "Teme",
    "home.reading": "Trenutno čitaš",
    "home.trending": "Popularno danas",
    "home.trendingNote": "Knjige koje čitaoci Open Library najviše otvaraju danas",

    "topic.fantasy": "Fantastika",
    "topic.scifi": "Naučna fantastika",
    "topic.mystery": "Misterija i krimi",
    "topic.love": "Ljubavni romani",
    "topic.history": "Istorija",
    "topic.philosophy": "Filozofija",
    "topic.poetry": "Poezija",
    "topic.biography": "Biografije",
    "topic.psychology": "Psihologija",
    "topic.children": "Za decu",

    "search.label": "Pretraži knjige",
    "search.placeholder": "Naslov, autor ili tema",
    "search.shortcut": "Pritisni / za pretragu",
    "search.submit": "Traži",
    "search.title": "Pretraga",
    "search.titleFor": "Rezultati za „{q}”",
    "search.loading": "Učitavam…",
    "search.count": { one: "Prikazano {shown} od {total} rezultata", few: "Prikazano {shown} od {total} rezultata", other: "Prikazano {shown} od {total} rezultata" },
    "search.more": "Prikaži još",
    "search.end": "To su svi rezultati.",
    "search.emptyTitle": "Nema rezultata",
    "search.emptyText": "Proveri pravopis ili probaj kraći pojam, na primer samo prezime autora.",
    "search.emptyWithFilters": "Nijedna knjiga ne odgovara pojmu i izabranim filterima. Ukloni filtere da proširiš pretragu.",
    "search.startTitle": "Šta tražiš?",
    "search.startText": "Upiši naslov, autora ili temu, ili izaberi jednu od tema.",

    "sort.label": "Redosled",
    "sort.relevance": "Najrelevantnije",
    "sort.rating": "Najbolje ocenjene",
    "sort.editions": "Najviše izdanja",
    "sort.new": "Najnovije",
    "sort.old": "Najstarije",

    "filters.title": "Filteri",
    "filters.language": "Jezik izdanja",
    "filters.anyLanguage": "Bilo koji jezik",
    "filters.year": "Godina prvog izdanja",
    "filters.from": "Od",
    "filters.to": "Do",
    "filters.ebooks": "Samo knjige koje mogu da se čitaju online",
    "filters.ebooksShort": "Čitanje online",
    "filters.apply": "Primeni",
    "filters.reset": "Ukloni filtere",
    "filters.active": "Aktivni filteri",
    "filters.remove": "Ukloni filter: {label}",
    "filters.topic": "Tema",
    "filters.author": "Autor",

    "error.offlineTitle": "Nema interneta",
    "error.offlineSearch": "Ova pretraga nije ranije sačuvana. Ranije pretrage i tvoja polica rade i bez interneta.",
    "error.apiTitle": "Open Library ne odgovara",
    "error.apiText": "Servis je trenutno spor ili nedostupan. Pokušaj ponovo za koji trenutak.",
    "error.retry": "Pokušaj ponovo",

    "card.add": "Sačuvaj na policu: {title}",
    "card.remove": "Ukloni sa police: {title}",

    "book.unknownAuthor": "Nepoznat autor",
    "book.firstPublished": "Prvo izdanje",
    "book.editions": "Broj izdanja",
    "book.pages": "Strana (prosečno)",
    "book.communityRating": "Ocena čitalaca",
    "book.ratingCount": { one: "{count} ocena", few: "{count} ocene", other: "{count} ocena" },
    "book.readFree": "Čitaj besplatno",
    "book.borrow": "Pozajmi online",
    "book.openLibrary": "Open Library",
    "book.share": "Podeli",
    "book.back": "Nazad",
    "book.coverAlt": "Korica knjige {title}",
    "book.about": "O knjizi",
    "book.subjects": "Teme",
    "book.languages": "Dostupna izdanja na jezicima",
    "book.descriptionOffline": "Opis nije dostupan bez interneta.",
    "book.noDescription": "Open Library nema opis za ovu knjigu.",
    "book.addTitle": "Dodaj na policu",
    "book.onShelf": "Na tvojoj polici",
    "book.yourRating": "Tvoja ocena",
    "book.rateN": { one: "Oceni sa {n} zvezdicom", few: "Oceni sa {n} zvezdice", other: "Oceni sa {n} zvezdica" },
    "book.note": "Beleška",
    "book.notePlaceholder": "Utisak, omiljeni citat, kome da je preporučiš",
    "book.noteSaved": "Sačuvano",
    "book.addedOn": "Dodato {date}",
    "book.remove": "Ukloni sa police",
    "book.notFound": "Knjiga nije pronađena",
    "book.notFoundText": "Link je možda pogrešan ili je knjiga uklonjena iz Open Library kataloga.",
    "book.offlineUnknown": "Ova knjiga nije ranije otvorena na ovom uređaju, pa nije dostupna bez interneta.",
    "book.linkCopied": "Link je kopiran",
    "book.shareFailed": "Deljenje nije uspelo",

    "notFound.title": "Stranica ne postoji",
    "notFound.text": "Adresa nije ispravna. Vrati se na početnu stranu.",

    "status.want": "Želim da pročitam",
    "status.reading": "Čitam",
    "status.read": "Pročitano",

    "toast.added": "Sačuvano na policu",
    "toast.addedAs": "Sačuvano na policu: {status}",
    "toast.removed": "Uklonjeno sa police",
    "toast.undo": "Poništi",

    "shelf.title": "Moja polica",
    "shelf.filterLabel": "Prikaži po statusu",
    "shelf.viewLabel": "Način prikaza",
    "shelf.viewSpines": "Prikaz police",
    "shelf.viewGrid": "Prikaz korica",
    "shelf.statTotal": "Knjiga na polici",
    "shelf.statReadYear": "Pročitano u {year}.",
    "shelf.statPages": "Pročitanih strana",
    "shelf.statRating": "Prosečna ocena",
    "shelf.all": "Sve",
    "shelf.emptyStatusTitle": "Ovde još nema knjiga",
    "shelf.emptyStatusText": "Promeni status knjige na njenoj stranici i pojaviće se ovde.",
    "shelf.showAll": "Prikaži sve",
    "shelf.emptyTitle": "Polica je prazna",
    "shelf.emptyText": "Pronađi knjigu i dodirni znak za čuvanje. Sačuvane knjige su dostupne i bez interneta.",
    "shelf.emptyAction": "Pronađi knjigu",

    "shelfSort.added": "Poslednje dodate",
    "shelfSort.title": "Naslov",
    "shelfSort.author": "Autor",
    "shelfSort.rating": "Moja ocena",

    "backup.title": "Rezervna kopija",
    "backup.text": "Polica se čuva samo u ovom pregledaču. Izvezi je u fajl da je preneseš na drugi uređaj ili sačuvaš.",
    "backup.export": "Izvezi policu",
    "backup.import": "Uvezi iz fajla",
    "backup.imported": "Uvezeno: {added} novih, {updated} ažuriranih",
    "backup.importFailed": "Fajl nije ispravna rezervna kopija Knjigoteke",
    "backup.exported": { one: "Izvezena {n} knjiga", few: "Izvezene {n} knjige", other: "Izvezeno {n} knjiga" },

    "pwa.backOnline": "Ponovo si na internetu",
    "pwa.updateReady": "Dostupna je nova verzija aplikacije",
    "pwa.updateAction": "Osveži",
    "pwa.installed": "Knjigoteka je instalirana",
  },

  en: {
    "app.skip": "Skip to content",
    "app.offline": "You're offline. Your shelf and pages you've opened before still work.",
    "app.install": "Install",
    "theme.toDark": "Switch to dark mode",
    "theme.toLight": "Switch to light mode",
    "lang.switch": "Prebaci na srpski",
    "footer.text": "Knjigoteka is a progressive web app. It works offline and can be installed.",
    "footer.source": "Data: Open Library",
    "footer.made": "Made by Nikola Vojvodić",

    "nav.label": "Main navigation",
    "nav.discover": "Discover",
    "nav.search": "Search",
    "nav.shelf": "My shelf",

    "home.docTitle": "Discover books",
    "home.title": "What are you reading next?",
    "home.lead": "Search the Open Library catalogue, save books to your shelf and keep track of what you've read. Everything you save works offline.",
    "home.recent": "Recent",
    "home.clearRecent": "Clear",
    "home.openShelf": "Open my shelf",
    "home.shelfCaption": { one: "{count} book on your shelf", other: "{count} books on your shelf" },
    "home.shelfEmpty": "Your shelf is waiting for its first book",
    "home.topics": "Topics",
    "home.reading": "Currently reading",
    "home.trending": "Popular today",
    "home.trendingNote": "Books Open Library readers are opening most today",

    "topic.fantasy": "Fantasy",
    "topic.scifi": "Science fiction",
    "topic.mystery": "Mystery and crime",
    "topic.love": "Romance",
    "topic.history": "History",
    "topic.philosophy": "Philosophy",
    "topic.poetry": "Poetry",
    "topic.biography": "Biography",
    "topic.psychology": "Psychology",
    "topic.children": "Children's books",

    "search.label": "Search books",
    "search.placeholder": "Title, author or topic",
    "search.shortcut": "Press / to search",
    "search.submit": "Search",
    "search.title": "Search",
    "search.titleFor": "Results for “{q}”",
    "search.loading": "Loading…",
    "search.count": { one: "Showing {shown} of {total} result", other: "Showing {shown} of {total} results" },
    "search.more": "Show more",
    "search.end": "That's every result.",
    "search.emptyTitle": "No results",
    "search.emptyText": "Check the spelling or try a shorter term, such as just the author's surname.",
    "search.emptyWithFilters": "No book matches both the term and your filters. Remove the filters to widen the search.",
    "search.startTitle": "What are you looking for?",
    "search.startText": "Type a title, author or topic, or pick one of the topics.",

    "sort.label": "Sort by",
    "sort.relevance": "Most relevant",
    "sort.rating": "Highest rated",
    "sort.editions": "Most editions",
    "sort.new": "Newest",
    "sort.old": "Oldest",

    "filters.title": "Filters",
    "filters.language": "Edition language",
    "filters.anyLanguage": "Any language",
    "filters.year": "First published",
    "filters.from": "From",
    "filters.to": "To",
    "filters.ebooks": "Only books you can read online",
    "filters.ebooksShort": "Read online",
    "filters.apply": "Apply",
    "filters.reset": "Remove filters",
    "filters.active": "Active filters",
    "filters.remove": "Remove filter: {label}",
    "filters.topic": "Topic",
    "filters.author": "Author",

    "error.offlineTitle": "You're offline",
    "error.offlineSearch": "This search wasn't saved earlier. Previous searches and your shelf work offline.",
    "error.apiTitle": "Open Library isn't responding",
    "error.apiText": "The service is slow or unavailable right now. Try again in a moment.",
    "error.retry": "Try again",

    "card.add": "Save to shelf: {title}",
    "card.remove": "Remove from shelf: {title}",

    "book.unknownAuthor": "Unknown author",
    "book.firstPublished": "First published",
    "book.editions": "Editions",
    "book.pages": "Pages (median)",
    "book.communityRating": "Reader rating",
    "book.ratingCount": { one: "{count} rating", other: "{count} ratings" },
    "book.readFree": "Read for free",
    "book.borrow": "Borrow online",
    "book.openLibrary": "Open Library",
    "book.share": "Share",
    "book.back": "Back",
    "book.coverAlt": "Cover of {title}",
    "book.about": "About this book",
    "book.subjects": "Subjects",
    "book.languages": "Editions available in",
    "book.descriptionOffline": "The description isn't available offline.",
    "book.noDescription": "Open Library has no description for this book.",
    "book.addTitle": "Add to shelf",
    "book.onShelf": "On your shelf",
    "book.yourRating": "Your rating",
    "book.rateN": { one: "Rate {n} star", other: "Rate {n} stars" },
    "book.note": "Note",
    "book.notePlaceholder": "Thoughts, a favourite quote, who to recommend it to",
    "book.noteSaved": "Saved",
    "book.addedOn": "Added {date}",
    "book.remove": "Remove from shelf",
    "book.notFound": "Book not found",
    "book.notFoundText": "The link may be wrong, or the book was removed from the Open Library catalogue.",
    "book.offlineUnknown": "This book hasn't been opened on this device before, so it isn't available offline.",
    "book.linkCopied": "Link copied",
    "book.shareFailed": "Couldn't share",

    "notFound.title": "Page not found",
    "notFound.text": "This address doesn't exist. Go back to the start page.",

    "status.want": "Want to read",
    "status.reading": "Reading",
    "status.read": "Read",

    "toast.added": "Saved to shelf",
    "toast.addedAs": "Saved to shelf: {status}",
    "toast.removed": "Removed from shelf",
    "toast.undo": "Undo",

    "shelf.title": "My shelf",
    "shelf.filterLabel": "Show by status",
    "shelf.viewLabel": "View",
    "shelf.viewSpines": "Shelf view",
    "shelf.viewGrid": "Cover view",
    "shelf.statTotal": "Books on shelf",
    "shelf.statReadYear": "Read in {year}",
    "shelf.statPages": "Pages read",
    "shelf.statRating": "Average rating",
    "shelf.all": "All",
    "shelf.emptyStatusTitle": "No books here yet",
    "shelf.emptyStatusText": "Change a book's status on its page and it will show up here.",
    "shelf.showAll": "Show all",
    "shelf.emptyTitle": "Your shelf is empty",
    "shelf.emptyText": "Find a book and tap the bookmark. Saved books are available offline.",
    "shelf.emptyAction": "Find a book",

    "shelfSort.added": "Recently added",
    "shelfSort.title": "Title",
    "shelfSort.author": "Author",
    "shelfSort.rating": "My rating",

    "backup.title": "Backup",
    "backup.text": "Your shelf is stored only in this browser. Export it to a file to move it to another device or keep a copy.",
    "backup.export": "Export shelf",
    "backup.import": "Import from file",
    "backup.imported": "Imported: {added} new, {updated} updated",
    "backup.importFailed": "That file isn't a valid Knjigoteka backup",
    "backup.exported": { one: "Exported {n} book", other: "Exported {n} books" },

    "pwa.backOnline": "You're back online",
    "pwa.updateReady": "A new version is available",
    "pwa.updateAction": "Reload",
    "pwa.installed": "Knjigoteka is installed",
  },
};

export const LANGUAGES = Object.keys(MESSAGES);

/**
 * Picks the interface language for a first visit from the browser's
 * preferred languages: Serbian for readers of Serbian and the closely
 * related languages (Croatian, Bosnian, Montenegrin), English for everyone else.
 */
const SERBIAN_FAMILY = ["sr", "hr", "bs", "sh", "cnr"];
export function detectLanguage(preferred = []) {
  for (const tag of preferred) {
    const primary = String(tag || "").toLowerCase().split(/[-_]/)[0];
    if (SERBIAN_FAMILY.includes(primary)) return "sr";
    if (LANGUAGES.includes(primary)) return primary;
  }
  return "en";
}

export function createI18n(initial = "sr") {
  let lang = LANGUAGES.includes(initial) ? initial : "sr";
  let rules = new Intl.PluralRules(localeFor(lang));

  function t(key, vars = {}) {
    let value = MESSAGES[lang][key] ?? MESSAGES.sr[key] ?? key;
    if (typeof value === "object") {
      const n = Number(vars.n ?? vars.count ?? 0);
      value = value[rules.select(n)] ?? value.other;
    }
    return value.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? `{${name}}`));
  }

  return {
    get lang() {
      return lang;
    },
    setLang(next) {
      if (!LANGUAGES.includes(next)) return;
      lang = next;
      rules = new Intl.PluralRules(localeFor(lang));
    },
    t,
  };
}
