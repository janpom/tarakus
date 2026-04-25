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
- Typ hry: První, Druhá, Třetí (preferanc), Čtvrtá (sólo), Varšava
- Vydražitel + partner / pozice talonu podle typu
- Zavazující hlášky pagát/valát (vydražitel/obrana) + tiché varianty
- Prozrazující hlášky per hráč: 8 hlášek ve dvou skupinách (počet taroků, trul/honéry) s exkluzivitou v rámci skupiny i mezi hráči (s výjimkou Trul + Královské honéry)
- Fleky (flek / re / tutti) zvlášť pro hru, pagát a valát
- Slidery pro oči (rozdělení 70 mezi týmy) a shoz protistrany při valátu
- Varšava: 4 propojené slidery, součet vždy 70
- Vyúčtování: per-hráč rozpis transakcí + součet týmu, delta pillíře pro každého hráče
- Celkové skóre + historie sehrávek (mřížka delt 2×2 mirrorující rozesazení)
- Volba měny: **koruny** (např. 1,50 Kč) nebo **body** (5 hal = 1 bod)
- localStorage persistence, reset hry zachová jména hráčů
- Herní strop 20 Kč, sazby dle Vysočiny

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
