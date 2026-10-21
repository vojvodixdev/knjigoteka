import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mockOpenLibrary } from "./mock-api.js";

const errors = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await mockOpenLibrary(page);
});

test.afterEach(() => {
  expect(errors, "no JavaScript errors").toEqual([]);
});

async function search(page, term = "andrić") {
  await page.getByRole("searchbox").fill(term);
  await page.getByRole("searchbox").press("Enter");
  await expect(page.locator(".book-card:not(.is-skeleton)").first()).toBeVisible();
}

test("home shows topics and today's popular books", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Šta čitaš sledeće?");
  await expect(page.getByRole("link", { name: "Fantastika", exact: true })).toHaveAttribute("href", "#/search?subject=fantasy");
  await expect(page.locator("#trending .book-card")).toHaveCount(10);
  await expect(page.locator("#trending")).toContainText("The Hobbit");
});

test("search, show more and reach the end", async ({ page }) => {
  await page.goto("/");
  await search(page);
  await expect(page).toHaveURL(/#\/search\?q=andri%C4%87$/);
  await expect(page.locator("#results .book-card")).toHaveCount(24);
  await expect(page.locator("#result-count")).toHaveText("Prikazano 24 od 30 rezultata");
  await page.getByRole("button", { name: "Prikaži još" }).click();
  await expect(page.locator("#results .book-card")).toHaveCount(30);
  await expect(page.getByText("To su svi rezultati.")).toBeVisible();
});

test("sort and filters live in the URL", async ({ page }) => {
  await page.goto("/#/search?q=andri%C4%87");
  await page.getByLabel("Redosled").selectOption("new");
  await expect(page).toHaveURL(/sort=new/);

  await page.getByRole("button", { name: /Filteri/ }).click();
  await page.getByLabel("Jezik izdanja").selectOption("srp");
  await page.getByLabel("Od", { exact: true }).fill("1950");
  await page.getByLabel("Do", { exact: true }).fill("1900");
  await page.getByRole("button", { name: "Primeni" }).click();
  await expect(page).toHaveURL(/lang=srp&from=1900&to=1950/); // range is swapped into order
  await expect(page.locator("#filters-count")).toHaveText("2");

  await page.getByRole("link", { name: /Ukloni filter: Srpski/ }).click();
  await expect(page).not.toHaveURL(/lang=/);
  await expect(page.locator("#filters-count")).toHaveText("1");
});

test("empty results explain what to do", async ({ page }) => {
  await page.goto("/#/search?q=nemanema");
  await expect(page.getByRole("heading", { name: "Nema rezultata" })).toBeVisible();
});

test("API failure offers a retry", async ({ page }) => {
  await page.unroute("https://openlibrary.org/**");
  await mockOpenLibrary(page, { failSearch: true });
  await page.goto("/#/search?q=andri%C4%87");
  await expect(page.getByRole("heading", { name: "Open Library ne odgovara" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pokušaj ponovo" })).toBeVisible();
  errors.length = 0; // the failed request is logged by the browser on purpose
});

test("save from a card, then undo", async ({ page }) => {
  await page.goto("/#/search?q=andri%C4%87");
  const save = page.getByRole("button", { name: "Sačuvaj na policu: Na Drini ćuprija" });
  await save.click();
  await expect(page.getByRole("button", { name: "Ukloni sa police: Na Drini ćuprija" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#shelf-count")).toHaveText("1");
  await page.getByRole("button", { name: "Poništi" }).click();
  await expect(page.locator("#shelf-count")).toHaveText("0");
});

test("book page: status, rating and note are remembered", async ({ page }) => {
  await page.goto("/#/search?q=andri%C4%87");
  await page.getByRole("link", { name: /Na Drini ćuprija/ }).first().click();
  await expect(page).toHaveURL(/#\/book\/OL9000001W$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Na Drini ćuprija");
  await expect(page.locator("#description")).toContainText("Hronika višegradskog mosta");
  await expect(page.locator("#description")).not.toContainText("Source:");

  await page.getByRole("button", { name: "Čitam", exact: true }).click(); // adds the book as "reading"
  await page.getByRole("button", { name: "Oceni sa 4 zvezdice" }).click();
  await page.getByLabel("Beleška").fill("Poglavlje o mostu na kraju.");
  await expect(page.getByText("Sačuvano", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Čitam", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Oceni sa 4 zvezdice" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Beleška")).toHaveValue("Poglavlje o mostu na kraju.");

  await page.getByRole("link", { name: "History" }).click();
  await expect(page).toHaveURL(/subject=History/);
});

test("a shared book link works without visiting search first", async ({ page }) => {
  await page.goto("/#/book/OL9000002W");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prokleta avlija");
  await page.getByRole("link", { name: "Nazad" }).click();
  await expect(page).toHaveURL(/#\/$/);
});

test("shelf: tabs, views, export and import", async ({ page }) => {
  await page.goto("/#/search?q=andri%C4%87");
  for (const title of ["Na Drini ćuprija", "Prokleta avlija", "Travnička hronika"]) {
    await page.getByRole("button", { name: `Sačuvaj na policu: ${title}` }).click();
  }
  await page.getByRole("link", { name: /Prokleta avlija/ }).first().click();
  await page.getByRole("button", { name: "Pročitano" }).click();

  await page.goto("/#/shelf");
  await expect(page.locator(".bookcase .spine")).toHaveCount(3);
  await page.getByRole("link", { name: /Pročitano\s*1/ }).click();
  await expect(page.locator(".bookcase .spine")).toHaveCount(1);
  await page.getByRole("button", { name: "Prikaz korica" }).click();
  await expect(page).toHaveURL(/status=read&view=grid/);
  await expect(page.locator(".shelf-body .book-card")).toHaveCount(1);

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Izvezi policu" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^knjigoteka-\d{4}-\d{2}-\d{2}\.json$/);
  const backup = JSON.parse(await (await download.createReadStream()).toArray().then((c) => Buffer.concat(c).toString()));
  expect(backup.books).toHaveLength(3);

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator("#shelf-count")).toHaveText("0");
  await page.locator("#import-file").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.locator("#shelf-count")).toHaveText("3");
});

test("language and theme are remembered", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to English" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What are you reading next?");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("pressing / focuses search", async ({ page }) => {
  await page.goto("/#/shelf");
  await page.keyboard.press("/");
  await expect(page.getByRole("searchbox")).toBeFocused();
});

for (const path of ["/", "/#/search?q=andri%C4%87", "/#/book/OL9000001W", "/#/shelf"]) {
  test(`no automatically detectable accessibility issues on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}
