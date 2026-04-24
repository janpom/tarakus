# Tarakus

Aplikace pro počítání skóre ve hře **taroky** (varianta Vysočina). Jedna HTML stránka, vanilla JavaScript (ES moduly), žádný build, žádný backend. Data v `localStorage`.

## Spuštění lokálně

Otevři `index.html` v prohlížeči. Pro správnou funkci ES modulů přes `file://` některé prohlížeče vyžadují HTTP server:

```
python3 -m http.server 8000
# pak http://localhost:8000
```

## Deploy na GitHub Pages

1. Push do repa na GitHubu
2. Settings → Pages → Source: *Deploy from branch* → `main` / `/ (root)`
3. Stránka bude k dispozici na `https://<uzivatel>.github.io/<repo>/`

Soubor `.nojekyll` zakazuje Jekyll zpracování (potřeba pro adresáře začínající `_`).

## Pravidla

Implementace vychází z pravidel **Vysočina** (turnaje GP Povodí Křetínky a Svitavy). Viz *Obecná pravidla* a *Placení* v sekci [taroky.net/pravitar.html](https://taroky.net/pravitar.html).

### Co aplikace umí

- 4 hráči, rozmístění v mřížce 2×2
- Ukazatel povinnosti, rotace proti směru hodinových ručiček
- Sehrávka: 1./2./3./4. povinnost + Varšava
- Vydražitel, volaný tarok, partner (pro 1./2.)
- Pozice talonu (preferanc)
- Zavazující hlášky (pagát, valát) + tiché
- Prozrazující hlášky (trul, honéry, taročky, barvičky, barvy, taroky, trul honéry, královské honéry) – per hráč
- Fleky (bez fleku / flek / re / tutti) zvlášť pro hru, pagát, valát
- Výsledek: oči týmu (součet = 70), uhrán/neuhrán pagát/valát, pro valát hodnota shozu
- Varšava: 4× oči (součet = 70), pravidlo *forhont platí více*
- Vyúčtování: rozdíl očí × sazba (zaokrouhleno nahoru na 10 hal.), plus hlášky, plus pagát/valát, krát flek
- Herní strop 20 Kč
- Celkové skóre + historie sehrávek

### Co aplikace NEumí (záměrně zjednodušeno)

- Vlastní licitaci – zadáváš výsledek dražby ručně (vydražitel, typ, volaný tarok)
- Hodnotu shozu při valátu – musíš zadat ručně (bodová hodnota karet, které protistrana nedostala do zdvihů)

## Struktura

```
index.html          // single-page app
style.css           // mobile-first styling
js/
  app.js            // entry, router, akce
  constants.js      // pravidla (sazby, hodnoty hlášek)
  scoring.js        // pure výpočet delty sehrávky
  state.js          // state + localStorage + helpers
  ui.js             // DOM helpers (h, mount)
  views/
    setup.js        // zadání jmen
    main.js         // dashboard se skóre + historie
    sehravka.js     // formulář nové sehrávky
    summary.js      // vyúčtování
```
