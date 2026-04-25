// Výpočet vyúčtování sehrávky. Vše v haléřích (1 Kč = 100 hal.)
// Output: { delta: { [playerId]: haleru }, rows: [{ label, value, winners, losers }] }
// Kladné delta = hráč dostává, záporné = hráč platí.

import {
  RATE_HAL, FLEK_MULT, FLEK_LABELS, MALE_HLASKY, VELKE_HLASKY,
  PAGAT_HLASENY_KC, PAGAT_TICHY_KC, VALAT_HLASENY_KC, VALAT_TICHY_KC,
  HERNI_STROP_HAL,
} from './constants.js';

function flekSuffix(flek) {
  if (!flek) return '';
  return `, ${FLEK_LABELS[flek] ?? ''}`;
}

const KC = 100;


function sazba(type, tretiPozice) {
  if (type === 'prvni' || type === 'druha') return RATE_HAL.prvni;
  if (type === 'treti') return RATE_HAL[`treti_${tretiPozice}`];
  if (type === 'ctvrta') return RATE_HAL.ctvrta;
  return 0;
}

function flekMult(flek) {
  return FLEK_MULT[flek ?? 0] ?? 1;
}

export function determineTeams(type, players, vydrazitel, partner) {
  if (type === 'treti' || type === 'ctvrta') {
    return [[vydrazitel], players.filter(p => p !== vydrazitel)];
  }
  // 1./2. povinnost. Pokud partner = vydražitel (volal svůj tarok), hraje sám.
  if (partner === vydrazitel || partner == null) {
    return [[vydrazitel], players.filter(p => p !== vydrazitel)];
  }
  const team1 = [vydrazitel, partner];
  const team2 = players.filter(p => !team1.includes(p));
  return [team1, team2];
}

// Každý vítěz dostává od každého soupeře `hodnota`. Součet = 0.
function splitPayment(winners, losers, hodnota) {
  const delta = {};
  for (const id of [...winners, ...losers]) delta[id] = 0;
  for (const w of winners) {
    for (const l of losers) {
      delta[w] += hodnota;
      delta[l] -= hodnota;
    }
  }
  return delta;
}

function addDelta(a, b) {
  for (const k in b) a[k] = (a[k] ?? 0) + b[k];
}

export function scoreSehravka(input, players) {
  if (input.type === 'varsava') return scoreVarsava(input, players);

  const { type, tretiPozice, vydrazitel, partner, hlasky, flekHry, flekPagat, flekValat } = input;
  const { ociT1, pagat, valat, shozProtiValat = 0 } = input.vysledek;

  const ids = players.map((_, i) => i);
  const [team1, team2] = determineTeams(type, ids, vydrazitel, partner);

  const rows = [];
  const delta = Object.fromEntries(ids.map(i => [i, 0]));

  // --- Hra ---
  const s = sazba(type, tretiPozice);
  const mHry = flekMult(flekHry);

  // Kdo vyhrál hru?
  let gameWinners, gameLosers, hodnotaHry, gameLabel;
  const valatTeam = valat ? (valat.hlaseno === 'prot' ? team2 : team1) : null;
  const valatOppo = valatTeam === team1 ? team2 : team1;

  if (valat?.uhran === true) {
    const diff = Math.max(0, 35 - (shozProtiValat ?? 0));
    hodnotaHry = Math.min(diff * s * mHry, HERNI_STROP_HAL);
    gameWinners = valatTeam;
    gameLosers = valatOppo;
    gameLabel = `Hra (valát uhrán${flekSuffix(flekHry)})`;
  } else if (valat?.uhran === false) {
    // Valát selhal → hru vyhrává protistrana valátu
    const diff = Math.abs(ociT1 - 35) || 1;
    hodnotaHry = Math.min(diff * s * mHry, HERNI_STROP_HAL);
    gameWinners = valatOppo;
    gameLosers = valatTeam;
    gameLabel = `Hra (valát selhal${flekSuffix(flekHry)})`;
  } else {
    const diff = Math.abs(ociT1 - 35);
    const effDiff = diff === 0 ? 1 : diff;
    hodnotaHry = Math.min(effDiff * s * mHry, HERNI_STROP_HAL);
    if (diff === 0) {
      // 35:35: bez fleku platí vydražitel, s flekem platí protistrana
      gameWinners = flekHry > 0 ? team1 : team2;
      gameLosers = flekHry > 0 ? team2 : team1;
      gameLabel = `Hra (35:35${flekSuffix(flekHry)})`;
    } else {
      const t1Vyhral = ociT1 >= 36;
      gameWinners = t1Vyhral ? team1 : team2;
      gameLosers = t1Vyhral ? team2 : team1;
      gameLabel = `Hra (${ociT1}:${70 - ociT1}${flekSuffix(flekHry)})`;
    }
  }

  if (hodnotaHry > 0) {
    addDelta(delta, splitPayment(gameWinners, gameLosers, hodnotaHry));
    rows.push({ label: gameLabel, value: hodnotaHry, winners: gameWinners, losers: gameLosers });
  }

  // --- Pagát ---
  if (pagat && pagat.uhran != null) {
    const ticky = !pagat.hlaseno;
    const pagatTeam = pagat.hlaseno === 'prot' ? team2 : team1;
    const pagatOppo = pagatTeam === team1 ? team2 : team1;
    const baseKc = ticky ? PAGAT_TICHY_KC : PAGAT_HLASENY_KC;
    const val = baseKc * KC * flekMult(ticky ? 0 : flekPagat);
    const uhran = pagat.uhran;
    const winners = uhran ? pagatTeam : pagatOppo;
    const losers = uhran ? pagatOppo : pagatTeam;
    addDelta(delta, splitPayment(winners, losers, val));
    rows.push({
      label: `Pagát ${ticky ? 'tichý' : 'hlášený'} ${uhran ? 'uhrán' : 'neuhrán'}${ticky ? '' : flekSuffix(flekPagat)}`,
      value: val, winners, losers,
    });
  }

  // --- Valát prémie (nad rámec hodnoty hry) ---
  if (valat && valat.uhran != null) {
    const ticky = !valat.hlaseno;
    const baseKc = ticky ? VALAT_TICHY_KC : VALAT_HLASENY_KC;
    const val = baseKc * KC * flekMult(ticky ? 0 : flekValat);
    const uhran = valat.uhran;
    const winners = uhran ? valatTeam : valatOppo;
    const losers = uhran ? valatOppo : valatTeam;
    addDelta(delta, splitPayment(winners, losers, val));
    rows.push({
      label: `Valát ${ticky ? 'tichý' : 'hlášený'} ${uhran ? 'uhrán' : 'neuhrán'}${ticky ? '' : flekSuffix(flekValat)} (prémie)`,
      value: val, winners, losers,
    });
  }

  // --- Prozrazující hlášky ---
  // Hláška se připočítává celému týmu announcera (při 1./2. pov. = 2 hráči,
  // při 3./4. pov. announcer sólo nebo obrana 3-členná).
  for (const pidStr of Object.keys(hlasky ?? {})) {
    const h = hlasky[pidStr];
    const id = Number(pidStr);
    const announcerTeam = team1.includes(id) ? team1 : team2;
    const oppoTeam = announcerTeam === team1 ? team2 : team1;
    for (const [key, sel] of Object.entries(h ?? {})) {
      if (!sel) continue;
      const def = MALE_HLASKY[key] ?? VELKE_HLASKY[key];
      if (!def) continue;
      addDelta(delta, splitPayment(announcerTeam, oppoTeam, def.value));
      rows.push({
        label: def.label,
        value: def.value, winners: announcerTeam, losers: oppoTeam,
      });
    }
  }

  return { delta, rows };
}

function scoreVarsava(input, players) {
  const ociHrace = input.vysledek.ociHrace;
  const forhont = input.forhont;
  const ids = players.map((_, i) => i);
  const delta = Object.fromEntries(ids.map(i => [i, 0]));
  const max = Math.max(...ociHrace);
  const losers = ids.filter(i => ociHrace[i] === max);
  const nonLosers = ids.filter(i => ociHrace[i] < max);
  const rows = [];

  for (const loser of losers) {
    const isForhont = loser === forhont;
    for (const nl of nonLosers) {
      const nlBezZdvihu = ociHrace[nl] === 0;
      const kc = isForhont
        ? (nlBezZdvihu ? 6 : 4)
        : (nlBezZdvihu ? 4 : 2);
      const val = kc * KC;
      delta[loser] -= val;
      delta[nl] += val;
      rows.push({
        label: `Varšava: ${players[loser]} → ${players[nl]} (${kc} Kč)`,
        value: val, winners: [nl], losers: [loser],
      });
    }
  }

  return { delta, rows };
}
