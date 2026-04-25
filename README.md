# Tarakus

Aplikace pro počítání skóre ve hře **taroky** (varianta Vysočina). Jedna HTML stránka, vanilla JavaScript (ES moduly), žádný build, žádný backend. Data v `localStorage`.

🌐 **Online**: <https://janpom.github.io/tarakus/>

## Spuštění lokálně

Otevři `index.html` v prohlížeči. Pro správnou funkci ES modulů přes `file://` některé prohlížeče vyžadují HTTP server:

```
python3 -m http.server 8000
# pak http://localhost:8000
```

## Deploy na GitHub Pages

1. Push do repa na GitHubu
2. Settings → Pages → Source: *Deploy from branch* → `main` / `/ (root)`
3. Stránka je dostupná na `https://<uzivatel>.github.io/<repo>/`

Soubor `.nojekyll` zakazuje Jekyll zpracování (potřeba pro adresáře začínající `_`).

## Pravidla

Implementace vychází z pravidel **Vysočina** (turnaje GP Povodí Křetínky a Svitavy). Viz *Obecná pravidla* a *Placení* v sekci [taroky.net/pravitar.html](http://taroky.net/pravitar.html).

### Co aplikace umí

- 4 hráči, rozmístění v mřížce 2×2 (proti směru hodinových ručiček: 1 4 / 2 3)
- Ukazatel povinnosti, automatická rotace proti směru hodinových ručiček
- Sehrávka jako 3-krokový průvodce (Dražba → Hlášky a fleky → Výsledek), Varšava ve 2 krocích
- Vpravo nahoře v hlavičce wizardu zkrácený typ hry (PRVNÍ / DRUHÁ / …)
- Typ hry: První, Druhá, Třetí (preferanc), Čtvrtá (sólo), Varšava
- Vydražitel se volí v Dražbě, partner až ve Výsledku (lze vyplňovat údaje průběžně během hry, kdy ještě partner není znám)
- Zavazující hlášky pagát/valát se přiřazují **konkrétnímu hráči** (kdokoliv ze 4 hráčů); 2. povinnost má pagát automaticky uzamčený na vydražitele
- Tichý pagát/valát (uhraný bez ohlášení) je samostatná volba ve Výsledku
- Prozrazující hlášky per hráč: 8 hlášek ve dvou skupinách (počet taroků, trul/honéry) s exkluzivitou v rámci skupiny i mezi hráči (s výjimkou Trul + Královské honéry)
- Fleky (flek / re / tutti) zvlášť pro hru, pagát a valát; pagát/valát fleky aktivní jen pokud je hláška přiřazena
- Slidery pro oči (rozdělení 70 mezi týmy) a shoz protistrany při valátu (max podle typu hry)
- Varšava: 4 propojené slidery, součet vždy 70
- Vyúčtování: per-hráč rozpis transakcí + součet týmu (násobitel × N pro asymetrické rozdělení), delta pillíře pro každého hráče
- Celkové skóre + historie sehrávek (mřížka delt 2×2 mirrorující rozesazení), položky historie zobrazují plný název hry + forhont · vydražitel
- Volba **body** (5 hal = 1 bod) nebo **koruny** (např. 1,50 Kč); volba se vybírá v setupu, výchozí *body*
- Barevné rozlišení rolí ve jménech hráčů: forhont (žlutá), vydražitel (růžová), oba současně (gradient) — průchozí ve všech sekcích aplikace
- iOS-style modální dialogy pro destruktivní akce (reset hry, zrušení sehrávky)
- localStorage persistence, reset hry zachová jména hráčů a zvolený režim měny
- Herní strop 20 Kč (400 b), sazby dle Vysočiny, bez zaokrouhlování

## Struktura

```
index.html          // single-page app
style.css           // mobile-first styling
assets/logo.png     // logo (favicon, setup, dashboard)
js/
  app.js            // entry, router, akce
  constants.js      // pravidla (sazby, hodnoty, skupiny hlášek)
  scoring.js        // pure výpočet delty sehrávky
  state.js          // state + localStorage + helpers
  ui.js             // DOM helpers (h, mount)
  views/
    setup.js        // zadání jmen
    main.js         // dashboard se skóre + historie
    sehravka.js     // 3-krokový wizard
    summary.js      // vyúčtování
  scoring.test.mjs  // smoke testy (node js/scoring.test.mjs)
```
