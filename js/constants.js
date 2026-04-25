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

// Hlášky – prozrazující (v haléřích).
// `count` = počet taroků, jen u skupin podle počtu (taroky/taročky/barvičky/barvy).
// `short` = krátký popisek pro chip (jinak `label`).
export const MALE_HLASKY = {
  trul:     { label: 'Trul',     value: 20 },
  honery:   { label: 'Honéry',   value: 20 },
  tarocky:  { label: 'Taročky',  value: 20, count: '8–9' },
  barvicky: { label: 'Barvičky', value: 20, count: '1–2' },
};

export const VELKE_HLASKY = {
  taroky:           { label: 'Taroky',           value: 40, count: '10+' },
  kralovske_honery: { label: 'Královské honéry', value: 40, short: 'Král. honéry' },
  trul_honery:      { label: 'Trul honéry',      value: 40 },
  barvy:            { label: 'Barvy',            value: 40, count: '0' },
};

// Pořadí pro zobrazení v UI – 1. řádek podle počtu, 2. řádek podle trulu/honér.
export const HLASKA_ORDER = [
  'taroky', 'tarocky', 'barvy', 'barvicky',
  'honery', 'kralovske_honery', 'trul', 'trul_honery',
];

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

// Exklusivní skupiny hlášek – v každé skupině lze u jednoho hráče zaškrtnout max 1.
export const HLASKA_GROUPS = {
  count: ['barvicky', 'tarocky', 'taroky', 'barvy'], // počet taroků
  trul: ['trul', 'honery', 'kralovske_honery', 'trul_honery'], // trul/honéry
};

// Cross-player kompatibilita uvnitř trul-skupiny.
// Pokud hráč X aktivuje hlášku K, ostatní hráči si mohou ponechat jen ty hlášky,
// které jsou ve TRUL_COMPAT[K]. Cokoli jiného z trul-skupiny se vyčistí.
export const TRUL_COMPAT = {
  trul: ['kralovske_honery'],
  kralovske_honery: ['trul'],
  honery: [],
  trul_honery: [],
};

// Pozice talonu pro preferanc
export const TRETI_POZICE = {
  1: 'v prvních',
  2: 've druhých',
  3: 've třetích',
};
