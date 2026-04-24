// Smoke test scoring.js. Run: node js/scoring.test.mjs
import { scoreSehravka, determineTeams } from './scoring.js';

const players = ['A', 'B', 'C', 'D'];
let failed = 0;

function eq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) { failed++; console.error(`FAIL: ${label}\n  actual:   ${JSON.stringify(actual)}\n  expected: ${JSON.stringify(expected)}`); }
  else console.log(`OK:   ${label}`);
}

function sumDelta(d) { return Object.values(d).reduce((a, b) => a + b, 0); }

// ---- 1. Povinnost ----
// Vydražitel 0, partner 2. Uhrali 50:20. Bez hlášek, bez fleku.
// diff = 50-35 = 15. sazba = 5. hodnota = 15*5 = 75, zaokrouhleno na 80 hal.
// Vítěz = team1 (0,2). Každý z team2 (1,3) platí každému z team1 80 hal.
// Delta: 0: +80+80=+160, 2: +160, 1: -80-80=-160, 3: -160. Sum = 0.
{
  const r = scoreSehravka({
    type: 'prvni', vydrazitel: 0, partner: 2, forhont: 0,
    tretiPozice: null, hlasky: {}, flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 50, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  eq('1.pov 50:20 delta sum 0', sumDelta(r.delta), 0);
  eq('1.pov 50:20 hráč 0', r.delta[0], 160);
  eq('1.pov 50:20 hráč 1', r.delta[1], -160);
  eq('1.pov 50:20 hráč 2', r.delta[2], 160);
  eq('1.pov 50:20 hráč 3', r.delta[3], -160);
}

// ---- 1. Povinnost prohra ----
// 18:52. diff=17. 17*5=85, zaokrouhleno 90. Team2 vyhrál. Každý z team2 dostane od každého z team1 90.
// Delta: 0: -180, 2: -180, 1: +180, 3: +180.
{
  const r = scoreSehravka({
    type: 'prvni', vydrazitel: 0, partner: 2, forhont: 0,
    tretiPozice: null, hlasky: {}, flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 18, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  eq('1.pov 18:52 delta sum 0', sumDelta(r.delta), 0);
  eq('1.pov 18:52 hráč 0', r.delta[0], -180);
  eq('1.pov 18:52 hráč 1', r.delta[1], 180);
}

// ---- Preferanc 3. povinnost (druhé karty) 40 očí ----
// diff=5, sazba=10, 5*10=50 hal. Solo vs 3. Vydražitel dostane od 3 soupeřů 50.
// Delta: 0: +150, 1: -50, 2: -50, 3: -50.
{
  const r = scoreSehravka({
    type: 'treti', vydrazitel: 0, partner: null, forhont: 0,
    tretiPozice: 2, hlasky: {}, flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 40, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  eq('preferanc 2. karty 40 sum', sumDelta(r.delta), 0);
  eq('preferanc 2. karty 40 vydraž', r.delta[0], 150);
  eq('preferanc 2. karty 40 soupeř', r.delta[1], -50);
}

// ---- Flek zdvojnásobí ----
// 1. pov, vydražitel, ociT1=50, flek=1 → base 15*5=75, flek=*2 → 150, zaokrouhleno 150.
// Wait: 15*5*2 = 150. round to 150 (already multiple of 10). OK.
{
  const r = scoreSehravka({
    type: 'prvni', vydrazitel: 0, partner: 2, forhont: 0,
    tretiPozice: null, hlasky: {}, flekHry: 1, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 50, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  eq('1.pov 50:20 s flekem hráč 0', r.delta[0], 300);
  eq('1.pov 50:20 s flekem hráč 1', r.delta[1], -300);
}

// ---- Hlášky (tým-based) ----
// Hráč 1 hlásí trul (20 hal). Hráč 1 je v team2=[1,3]. Hláška jde týmu 2.
// splitPayment([1,3], [0,2], 20) → hráč 1: +40, hráč 3: +40, hráč 0: -40, hráč 2: -40.
{
  const r = scoreSehravka({
    type: 'prvni', vydrazitel: 0, partner: 2, forhont: 0,
    tretiPozice: null,
    hlasky: { 1: { trul: true } },
    flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 35, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  // Hra 35:35 bez fleku → vydražitel platí. hodnotaHry = 1*5 = 5, round=10.
  // Team2 vyhrává. Delta hra: 0: -20, 2: -20, 1: +20, 3: +20.
  // + hláška team2: +40/+40 vs -40/-40.
  // Hráč 0: -20 + -40 = -60. Hráč 1: +20 + +40 = +60. Hráč 2: -60. Hráč 3: +60.
  eq('hláška trul+rovnost sum', sumDelta(r.delta), 0);
  eq('hláška trul hráč 1', r.delta[1], 60);
  eq('hláška trul hráč 3 (partner announcera)', r.delta[3], 60);
}

// ---- Hláška při sólu (3. pov) ----
// Preferanc, vydražitel 0 hlásí trul. Jeho tým = jen on. 3 soupeři platí po 20.
// 40 očí, 2. karty. Hra: 0 +150, 1-3: -50 každý.
// Hláška: 0 +60, 1-3: -20 každý.
{
  const r = scoreSehravka({
    type: 'treti', vydrazitel: 0, partner: null, forhont: 0,
    tretiPozice: 2,
    hlasky: { 0: { trul: true } },
    flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 40, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  eq('sólo hláška sum', sumDelta(r.delta), 0);
  eq('sólo hláška vydraž.', r.delta[0], 150 + 60);
  eq('sólo hláška obránce', r.delta[1], -50 - 20);
}

// ---- Pagát hlášený ----
// 1. pov, pagát hlášen vydražitelem, uhrán. 2 Kč = 200 hal. Team1 dostává od každého z team2 200.
// Delta pagát: 0: +400, 2: +400, 1: -400, 3: -400.
{
  const r = scoreSehravka({
    type: 'prvni', vydrazitel: 0, partner: 2, forhont: 0,
    tretiPozice: null, hlasky: {}, flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: {
      ociT1: 50,
      pagat: { uhran: true, hlaseno: 'vydr' },
      valat: null, shozProtiValat: 0,
    },
  }, players);
  // Hra: +160/-160 (viz výše). Pagát: +400/-400.
  eq('pagát hlášený sum', sumDelta(r.delta), 0);
  eq('pagát hlášený hráč 0', r.delta[0], 160 + 400);
  eq('pagát hlášený hráč 1', r.delta[1], -160 - 400);
}

// ---- Varšava ----
// Oči: A=40 (forhont), B=20, C=10, D=0.
// A loser (forhont). Platí 4 Kč ostatním s méně očí, 6 Kč hráči s 0.
// A platí: B 4 Kč, C 4 Kč, D 6 Kč. Total A: -14 Kč = -1400 hal.
// B: +400, C: +400, D: +600.
{
  const r = scoreSehravka({
    type: 'varsava', forhont: 0,
    vysledek: { ociHrace: [40, 20, 10, 0] },
  }, players);
  eq('varšava forhont sum', sumDelta(r.delta), 0);
  eq('varšava A (forhont loser)', r.delta[0], -1400);
  eq('varšava D (bez zdvihu)', r.delta[3], 600);
}

// ---- teamy ----
eq('teams 3.pov', determineTeams('treti', [0, 1, 2, 3], 2, null), [[2], [0, 1, 3]]);
eq('teams 1.pov', determineTeams('prvni', [0, 1, 2, 3], 0, 2), [[0, 2], [1, 3]]);
eq('teams 1.pov sám', determineTeams('prvni', [0, 1, 2, 3], 0, 0), [[0], [1, 2, 3]]);

console.log(failed === 0 ? '\nVŠE OK' : `\n${failed} TESTŮ SELHALO`);
process.exit(failed ? 1 : 0);
