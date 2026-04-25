// Herní typy
export const GAME_TYPES = {
  PRVNI: 'prvni',        // Základní povinnost
  DRUHA: 'druha',        // Druhá povinnost (pagát závazek)
  TRETI: 'treti',        // Preferanc
  CTVRTA: 'ctvrta',      // Sólo
  VARSAVA: 'varsava',
};

// Pro každý typ: short = krátký název do chipu, alt = alternativní název (preferanc, sólo),
// full = úplný název pro souhrny a historii.
export const GAME_INFO = {
  prvni:   { short: 'První',   alt: null,         full: 'První povinnost' },
  druha:   { short: 'Druhá',   alt: null,         full: 'Druhá povinnost' },
  treti:   { short: 'Třetí',   alt: 'preferanc',  full: 'Třetí povinnost' },
  ctvrta:  { short: 'Čtvrtá',  alt: 'sólo',       full: 'Čtvrtá povinnost' },
  varsava: { short: 'Varšava', alt: null,         full: 'Varšava' },
};

// Plné popisky pro souhrny a historii.
export const GAME_LABELS = Object.fromEntries(
  Object.entries(GAME_INFO).map(([k, v]) => [k, v.full]),
);

// Sazby v haléřích za jedno oko nad 35 (základní, bez fleku)
export const RATE_HAL = {
  prvni: 5,
  druha: 5,
  // Preferanc: podle pozice talonu
  treti_1: 5,
  treti_2: 10,
  treti_3: 20,
  ctvrta: 40,
};

// Hlášky – prozrazující (v haléřích)
export const MALE_HLASKY = {
  trul: { label: 'Trul', value: 20 },
  honery: { label: 'Honéry', value: 20 },
  tarocky: { label: 'Taročky (8–9)', value: 20 },
  barvicky: { label: 'Barvičky (0–2 taroky)', value: 20 },
};

export const VELKE_HLASKY = {
  taroky: { label: 'Taroky (10+)', value: 40 },
  kralovske_honery: { label: 'Královské honéry', value: 40 },
  trul_honery: { label: 'Trul honéry', value: 40 },
  barvy: { label: 'Barvy (bez taroku)', value: 40 },
};

// Hlášky – zavazující (v Kč)
// Pagát hlášený 2 Kč / tichý 1 Kč
// Valát hlášený 4 Kč / tichý 2 Kč
export const PAGAT_HLASENY_KC = 2;
export const PAGAT_TICHY_KC = 1;
export const VALAT_HLASENY_KC = 4;
export const VALAT_TICHY_KC = 2;

// Flek multiplier
export const FLEK_MULT = [1, 2, 4, 8]; // 0 = bez, 1 = flek, 2 = re, 3 = tutti

export const FLEK_LABELS = ['bez fleku', 'flek', 're', 'tutti'];

// Herní strop 20 Kč = 2000 haléřů
export const HERNI_STROP_HAL = 2000;

// Exklusivní skupiny hlášek – v každé skupině lze zaškrtnout max 1 hlášku.
export const HLASKA_GROUPS = {
  count: ['barvicky', 'tarocky', 'taroky', 'barvy'], // počet taroků
  trul: ['trul', 'honery', 'kralovske_honery', 'trul_honery'], // trul/honéry
};

// Pozice talonu pro preferanc
export const TRETI_POZICE = {
  1: 'v prvních (3)',
  2: 've druhých (3)',
  3: 've třetích (3)',
};
