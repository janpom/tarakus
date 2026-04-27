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

// ---- 1. Povinnost 2v2 ----
// Vydražitel 0, partner 2. 50:20. diff=15, sazba=5, hodnota=75 hal.
// Každý člen vítězného týmu +75, každý člen poraženého -75.
{
  const r = scoreSehravka({
    type: 'prvni', vydrazitel: 0, partner: 2, forhont: 0,
    tretiPozice: null, hlasky: {}, flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 50, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  eq('1.pov 50:20 sum 0', sumDelta(r.delta), 0);
  eq('1.pov 50:20 hráč 0', r.delta[0], 75);
  eq('1.pov 50:20 hráč 1', r.delta[1], -75);
}

// ---- 1. Povinnost prohra 18:52 ----
{
  const r = scoreSehravka({
    type: 'prvni', vydrazitel: 0, partner: 2, forhont: 0,
    tretiPozice: null, hlasky: {}, flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 18, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  // diff=17, hodnota=85. Team2 wins. Per-member ±85.
  eq('1.pov 18:52 sum 0', sumDelta(r.delta), 0);
  eq('1.pov 18:52 hráč 0', r.delta[0], -85);
  eq('1.pov 18:52 hráč 1', r.delta[1], 85);
}

// ---- Preferanc 1v3 ----
// 40 očí, 2.karty, sazba=10, diff=5, hodnota=50.
// Solo +50×3 = +150, každý obránce -50.
{
  const r = scoreSehravka({
    type: 'treti', vydrazitel: 0, partner: null, forhont: 0,
    tretiPozice: 2, hlasky: {}, flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 40, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  eq('preferanc 1v3 sum 0', sumDelta(r.delta), 0);
  eq('preferanc 1v3 vydraž (+150)', r.delta[0], 150);
  eq('preferanc 1v3 obránce (-50)', r.delta[1], -50);
}

// ---- Flek zdvojnásobí 2v2 ----
{
  const r = scoreSehravka({
    type: 'prvni', vydrazitel: 0, partner: 2, forhont: 0,
    tretiPozice: null, hlasky: {}, flekHry: 1, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 50, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  // hodnota = 75*2 = 150. Per-member ±150.
  eq('flek 2v2 hráč 0', r.delta[0], 150);
  eq('flek 2v2 hráč 1', r.delta[1], -150);
}

// ---- Hláška ve 2v2 ----
// Hráč 1 (team2=[1,3]) hlásí trul (20). Hláška jde týmu 2.
// Per-member ±20.
{
  const r = scoreSehravka({
    type: 'prvni', vydrazitel: 0, partner: 2, forhont: 0,
    tretiPozice: null,
    hlasky: { 1: { trul: true } },
    flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 35, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  // Hra 35:35 bez fleku → vydražitel platí 1 oko = 5 hal × 1 (per-member).
  // Team2 wins. delta hra: 0: -5, 2: -5, 1: +5, 3: +5.
  // Hláška: team2 +20 each, team1 -20 each.
  // Total: 0: -25, 1: +25, 2: -25, 3: +25.
  eq('hláška 2v2 sum 0', sumDelta(r.delta), 0);
  eq('hláška 2v2 hráč 1', r.delta[1], 25);
  eq('hláška 2v2 hráč 3', r.delta[3], 25);
}

// ---- Hláška při sólu (1v3) ----
// Preferanc, vydraž 0 hlásí trul. Solo team. Solo +20×3, každý obránce -20.
// Hra 40:30 diff=5, sazba=10, hodnota=50. Solo +150, obránce -50.
{
  const r = scoreSehravka({
    type: 'treti', vydrazitel: 0, partner: null, forhont: 0,
    tretiPozice: 2,
    hlasky: { 0: { trul: true } },
    flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: { ociT1: 40, pagat: null, valat: null, shozProtiValat: 0 },
  }, players);
  // Hra: 0 +150, 1-3 -50 each.
  // Hláška: 0 +60, 1-3 -20 each.
  // Total: 0 = +210, 1 = -70.
  eq('sólo hláška sum 0', sumDelta(r.delta), 0);
  eq('sólo hláška vydraž', r.delta[0], 210);
  eq('sólo hláška obránce', r.delta[1], -70);
}

// ---- Pagát hlášený ve 2v2 ----
// Hra 50:20 → ±75. Pagát hlášen vydražitelem (player=0), uhrán. 200 hal × 1 = 200 per-member.
{
  const r = scoreSehravka({
    type: 'prvni', vydrazitel: 0, partner: 2, forhont: 0,
    tretiPozice: null, hlasky: {}, flekHry: 0, flekPagat: 0, flekValat: 0,
    vysledek: {
      ociT1: 50,
      pagat: { uhran: true, player: 0 },
      valat: null, shozProtiValat: 0,
    },
  }, players);
  eq('pagát 2v2 sum 0', sumDelta(r.delta), 0);
  eq('pagát 2v2 hráč 0', r.delta[0], 75 + 200);
  eq('pagát 2v2 hráč 1', r.delta[1], -75 - 200);
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
