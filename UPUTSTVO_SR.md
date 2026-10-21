# Knjigoteka 2.0 – šta je novo i kako da je objaviš

## Šta je novo u odnosu na verziju iz diplomskog

| Diplomski (v1) | Portfolio (v2) |
|---|---|
| Pretraga, 24 rezultata | Pretraga + sortiranje, filteri (jezik, godina, „čitaj online”), „Prikaži još” |
| Modal sa 4 podatka | Posebna stranica knjige sa opisom i temama (Works API), ocenom čitalaca, deljenjem |
| „Moja lista” | **Moja polica**: statusi (želim / čitam / pročitano), tvoja ocena 1–5, beleška, statistika |
| Kartice | Prikaz **police sa hrbatima knjiga** + prikaz korica |
| Bez rezervne kopije | Izvoz/uvoz police u JSON fajl |
| Samo srpski, samo svetla tema | Srpski i engleski, svetli i tamni režim |
| Bez adresa za ekrane | Svaki ekran ima svoj link (može da se podeli, radi „Nazad”) |
| Bootstrap | Sopstveni CSS (design tokeni), lokalni fontovi Literata + Atkinson Hyperlegible |
| Keš v1 ručno | Tri keša, vremensko ograničenje mreže, ograničena veličina, poruka „Dostupna je nova verzija” |
| Bez testova | 39 unit testova + 32 end-to-end testa (Playwright), uključujući oflajn rad i proveru pristupačnosti |
| Ručno postavljanje | GitHub Actions: testovi pa automatsko objavljivanje na GitHub Pages |

Tvoja stara lista iz v1 se automatski prenosi na policu pri prvom otvaranju.

## Kako da je objaviš (15 minuta)

1. Na GitHub-u napravi novi javni repozitorijum `knjigoteka`.
2. Raspakuj zip i otpremi **sve** fajlove (i skriveni folder `.github`). Najlakše preko GitHub Desktop-a ili:
   ```bash
   git init && git add . && git commit -m "Knjigoteka 2.0"
   git branch -M main
   git remote add origin https://github.com/TVOJ-NALOG/knjigoteka.git
   git push -u origin main
   ```
3. Na GitHub-u: **Settings → Pages → Source: GitHub Actions**.
4. U kartici **Actions** sačekaj da prođu testovi i objava (zeleno). Aplikacija je na `https://TVOJ-NALOG.github.io/knjigoteka/`.

## Šta moraš sam da zameniš

- Ako jednog dana objaviš, u `README.md` dodaj link na demo.
- **Slike ekrana**: one u `docs/` i `app/screenshots/` napravljene su sa test podacima, pa su korice generisane (bez pravih slika). Kad objaviš, napravi prave snimke sa pravim koricama i zameni ih (iste dimenzije i nazivi).
- Kad nešto menjaš u kodu aplikacije, povećaj `VERSION` u `app/sw.js` (npr. `2.0.1`), da instalirane kopije dobiju novu verziju.

## Pokretanje kod tebe

```bash
npm install
npm start          # http://localhost:8080
npm test           # unit testovi
npx playwright install chromium
npm run test:e2e   # end-to-end testovi
```

## Kako da je predstaviš na razgovoru za posao (3 rečenice)

> „Knjigoteka je PWA koju sam započeo kao diplomski, pa je prepravio u portfolio projekat. Napisana je bez frejmvorka, u ES modulima, sa jasno odvojenim slojevima: API klijent, skladište, ruter i prikazi, pa su ključni delovi pokriveni unit testovima, a tokovi korisnika end-to-end testovima. Najzanimljiviji deo je oflajn rad: servisni radnik koristi tri različite strategije keširanja i nudi korisniku da sam osveži aplikaciju kad stigne nova verzija.”

Pitanja koja verovatno dolaze i gde je odgovor u kodu:
- *Zašto bez React-a?* – mala aplikacija, nula zavisnosti, nema build koraka; pokazuje da razumeš DOM, događaje i module (`app.js`, delegiranje događaja).
- *Kako sprečavaš XSS?* – `escapeHtml()` u `util.js` za sve podatke sa API-ja + Content-Security-Policy u `index.html`.
- *Šta ako se lokalno skladište obriše?* – izvoz/uvoz JSON-a i `navigator.storage.persist()` (`pwa.js`).
- *Kako testiraš bez interneta?* – `tests/e2e/mock-api.js` presreće zahteve i vraća fixture fajlove.
