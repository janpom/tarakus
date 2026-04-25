// Globální state + localStorage persistence.
// Stav hry:
// {
//   players: string[4],
//   totals: number[4],          // celkové delta v haléřích
//   povinnostIdx: number,       // 0..3, hráč na povinnosti (forhont)
//   sehravky: Sehravka[],       // historie
//   current: SehravkaDraft | null  // rozdělaná sehrávka
// }

const KEY = 'tarakus:v1';

const EMPTY = {
  players: null,           // null = setup fáze
  totals: [0, 0, 0, 0],
  povinnostIdx: 0,
  sehravky: [],
  current: null,
};

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const data = JSON.parse(raw);
    return { ...EMPTY, ...data };
  } catch {
    return { ...EMPTY };
  }
}

export function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function reset() {
  localStorage.removeItem(KEY);
}

// Rotace povinnosti proti směru hodinových ručiček
// Grid 2×2 — indexy rozmístěné takto:
//   0   1
//   3   2
// CCW pořadí: 0 → 3 → 2 → 1 → 0
export const CCW_ORDER = [0, 3, 2, 1];

export function nextPovinnost(idx) {
  const i = CCW_ORDER.indexOf(idx);
  return CCW_ORDER[(i + 1) % 4];
}

export function formatHal(hal) {
  const sign = hal < 0 ? '−' : hal > 0 ? '+' : '';
  const abs = Math.abs(hal);
  const kc = Math.floor(abs / 100);
  const h = abs % 100;
  return `${sign}${kc},${String(h).padStart(2, '0')} Kč`;
}
