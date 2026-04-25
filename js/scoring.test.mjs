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
// Vydražitel 0, partner 2. Uhrali 50:20. diff=15, sazba=5. hodnota=75 hal.
// Vítěz team1 [0,2], každý dostane 75 od každého z team2 [1,3] → ±150.
{
  const r = scoreSehravka({
    type: 'prvni', vydrazitel: 0, partner: 2, forhont: 0,
    tretiPozice: null, hlasky: {}, flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 50, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  eq('1.pov 50:20 sum 0', sumDelta(r.delta), 0);
  eq('1.pov 50:20 hráč 0', r.delta[0], 150);
  eq('1.pov 50:20 hráč 1', r.delta[1], -150);
}

// ---- 1. Povinnost prohra 18:52 ----
// diff=17, sazba=5, hodnota=85. Team2 vyhrává. ±170.
{
  const r = scoreSehravka({
    type: 'prvni', vydrazitel: 0, partner: 2, forhont: 0,
    tretiPozice: null, hlasky: {}, flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 18, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  eq('1.pov 18:52 sum 0', sumDelta(r.delta), 0);
  eq('1.pov 18:52 hráč 0', r.delta[0], -170);
  eq('1.pov 18:52 hráč 1', r.delta[1], 170);
}

// ---- Preferanc 2. karty 40 očí ----
// diff=5, sazba=10, hodnota=50. Solo dostane 50 od 3 soupeřů → +150, ostatní -50.
{
  const r = scoreSehravka({
    type: 'treti', vydrazitel: 0, partner: null, forhont: 0,
    tretiPozice: 2, hlasky: {}, flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 40, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  eq('preferanc 40 sum 0', sumDelta(r.delta), 0);
  eq('preferanc 40 vydraž', r.delta[0], 150);
  eq('preferanc 40 soupeř', r.delta[1], -50);
}

// ---- Flek zdvojnásobí hodnotu hry ----
// 50:20, flek=1 (×2). hodnota = 15*5*2 = 150. ±300.
{
  const r = scoreSehravka({
    type: 'prvni', vydrazitel: 0, partner: 2, forhont: 0,
    tretiPozice: null, hlasky: {}, flekHry: 1, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 50, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  eq('flek hráč 0', r.delta[0], 300);
  eq('flek hráč 1', r.delta[1], -300);
}

// ---- Hláška (team-based) ----
// Hráč 1 v team2=[1,3] hlásí trul (20). Team2 dostane od team1 každý.
// 35:35 bez fleku: hodnota hry = 1*5 = 5. Team1 platí (vydražitel platí).
// Hra: hráč 0 -10, hráč 2 -10, hráč 1 +10, hráč 3 +10.
// Hláška: team2 +40/+40 vs team1 -40/-40.
// Total: 0: -50. 1: +50. 2: -50. 3: +50.
{
  const r = scoreSehravka({
    type: 'prvni', vydrazitel: 0, partner: 2, forhont: 0,
    tretiPozice: null,
    hlasky: { 1: { trul: true } },
    flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 35, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  eq('hláška sum 0', sumDelta(r.delta), 0);
  eq('hláška hráč 1', r.delta[1], 50);
  eq('hláška hráč 3', r.delta[3], 50);
}

// ---- Hláška při sólu ----
// Preferanc, vydražitel 0 hlásí trul. Solo team. 40 očí, 2. karty.
// Hra: 0 +150, ostatní -50 každý.
// Hláška: 0 +60, ostatní -20 každý.
{
  const r = scoreSehravka({
    type: 'treti', vydrazitel: 0, partner: null, forhont: 0,
    tretiPozice: 2,
    hlasky: { 0: { trul: true } },
    flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 40, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  eq('sólo hláška sum 0', sumDelta(r.delta), 0);
  eq('sólo hláška vydraž', r.delta[0], 210);
  eq('sólo hláška obránce', r.delta[1], -70);
}

// ---- Pagát hlášený ----
// Hra 50:20 → ±150. Pagát hlášený 2 Kč = 200 hal × 1 = 200. Team1 dostává.
// Pagát: 0 +400, 2 +400, 1 -400, 3 -400.
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
  eq('pagát hlášený sum 0', sumDelta(r.delta), 0);
  eq('pagát hlášený hráč 0', r.delta[0], 150 + 400);
  eq('pagát hlášený hráč 1', r.delta[1], -150 - 400);
}

// ---- Varšava ----
// Oči 40 (forhont) / 20 / 10 / 0.
// A platí B 4Kč, C 4Kč, D 6Kč. Total A -1400.
{
  const r = scoreSehravka({
    type: 'varsava', forhont: 0,
    vysledek: { ociHrace: [40, 20, 10, 0] },
  }, players);
  eq('varšava sum 0', sumDelta(r.delta), 0);
  eq('varšava A (forhont)', r.delta[0], -1400);
  eq('varšava D (bez zdvihu)', r.delta[3], 600);
}

// ---- teamy ----
eq('teams 3.pov', determineTeams('treti', [0, 1, 2, 3], 2, null), [[2], [0, 1, 3]]);
eq('teams 1.pov', determineTeams('prvni', [0, 1, 2, 3], 0, 2), [[0, 2], [1, 3]]);
eq('teams 1.pov sám', determineTeams('prvni', [0, 1, 2, 3], 0, 0), [[0], [1, 2, 3]]);

console.log(failed === 0 ? '\nVŠE OK' : `\n${failed} TESTŮ SELHALO`);
process.exit(failed ? 1 : 0);
