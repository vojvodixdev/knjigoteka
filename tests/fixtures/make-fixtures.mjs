// Generates the mock Open Library responses used by the end-to-end tests.
// Run once with: node tests/fixtures/make-fixtures.mjs
import { writeFileSync } from "node:fs";

const doc = (n, title, author, year, extra = {}) => ({
  key: `/works/OL${9000000 + n}W`,
  title,
  author_name: [author],
  first_publish_year: year,
  edition_count: 3 + ((n * 7) % 40),
  language: ["srp", "hrv", "eng", "ger"].slice(0, 1 + (n % 4)),
  number_of_pages_median: 120 + ((n * 53) % 480),
  ratings_average: 3.4 + ((n * 13) % 15) / 10,
  ratings_count: 4 + ((n * 31) % 300),
  ebook_access: n % 5 === 0 ? "borrowable" : "no_ebook",
  ...extra,
});

const andric = [
  ["Na Drini ćuprija", 1945], ["Prokleta avlija", 1954], ["Travnička hronika", 1945],
  ["Gospođica", 1945], ["Ex Ponto", 1918], ["Znakovi pored puta", 1976],
  ["Most na Žepi", 1925], ["Anikina vremena", 1931], ["Jelena, žena koje nema", 1963],
  ["Omerpaša Latas", 1977], ["Pripovetke", 1924], ["Nemiri", 1920],
];
const docs = andric.map(([title, year], i) => doc(i + 1, title, "Ivo Andrić", year));
for (let i = 1; docs.length < 30; i += 1) docs.push(doc(100 + i, `Sabrana dela, knjiga ${i}`, "Ivo Andrić", 1963 + (i % 4)));

const search = (items, total) => ({ numFound: total, start: 0, docs: items });
writeFileSync(new URL("./search-page1.json", import.meta.url), JSON.stringify(search(docs.slice(0, 24), docs.length), null, 1));
writeFileSync(new URL("./search-page2.json", import.meta.url), JSON.stringify(search(docs.slice(24), docs.length), null, 1));
writeFileSync(new URL("./search-empty.json", import.meta.url), JSON.stringify(search([], 0)));

const classics = [
  ["1984", "George Orwell", 1949], ["The Hobbit", "J. R. R. Tolkien", 1937], ["Pride and Prejudice", "Jane Austen", 1813],
  ["Dune", "Frank Herbert", 1965], ["The Little Prince", "Antoine de Saint-Exupéry", 1943], ["Crime and Punishment", "Fyodor Dostoyevsky", 1866],
  ["One Hundred Years of Solitude", "Gabriel García Márquez", 1967], ["The Master and Margarita", "Mikhail Bulgakov", 1967],
  ["To Kill a Mockingbird", "Harper Lee", 1960], ["Frankenstein", "Mary Shelley", 1818],
];
const trending = { query: "trending", works: classics.map(([t, a, y], i) => doc(200 + i, t, a, y, { language: ["eng"] })) };
writeFileSync(new URL("./trending.json", import.meta.url), JSON.stringify(trending, null, 1));

const work = {
  key: "/works/OL9000001W",
  title: "Na Drini ćuprija",
  description: {
    type: "/type/text",
    value: "Hronika višegradskog mosta i ljudi koji su oko njega živeli gotovo četiri veka, od gradnje u šesnaestom veku do Prvog svetskog rata.\n\nKroz smenu generacija i vlasti most ostaje jedina stalna tačka u gradu.\n\n----------\nSource: test fixture",
  },
  subjects: ["Bosnia and Herzegovina", "History", "Bridges", "Fiction", "Višegrad"],
  covers: [-1],
};
writeFileSync(new URL("./work-OL9000001W.json", import.meta.url), JSON.stringify(work, null, 1));
console.log("fixtures written");
