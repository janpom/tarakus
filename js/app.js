import { load, save, reset, nextPovinnost } from './state.js';
import { GAME_LABELS, HLASKA_GROUPS } from './constants.js';
import { scoreSehravka } from './scoring.js';
import { mount } from './ui.js';
import { viewSetup } from './views/setup.js';
import { viewMain } from './views/main.js';
import { viewSehravka } from './views/sehravka.js';
import { viewSummary } from './views/summary.js';

let state = load();

const root = document.getElementById('app');

function render() {
  save(state);
  let view;
  if (!state.players) {
    view = viewSetup(state, actions);
  } else if (state.current?.computed) {
    view = viewSummary(state, actions);
  } else if (state.current) {
    view = viewSehravka(state, actions);
  } else {
    view = viewMain(state, actions);
  }
  mount(root, view);
}

const actions = {
  startGame(names) {
    state = {
      ...state,
      players: names,
      totals: [0, 0, 0, 0],
      povinnostIdx: 0,
      sehravky: [],
      current: null,
    };
    render();
  },

  resetGame() {
    if (!confirm('Opravdu začít novou hru? Aktuální skóre bude smazáno.')) return;
    reset();
    state = load();
    render();
  },

  startSehravka() {
    state.current = {
      type: null,
      forhont: state.povinnostIdx,
      vydrazitel: state.povinnostIdx,
      partner: null,
      tretiPozice: null,
      hlasky: {},
      flekHry: 0, flekPagat: 0, flekValat: 0,
      vysledek: { ociT1: 35, pagat: null, valat: null, shozProtiValat: 0, ociHrace: [0, 0, 0, 0] },
    };
    render();
  },

  cancelSehravka() {
    if (!confirm('Zrušit rozpracovanou sehrávku?')) return;
    state.current = null;
    render();
  },

  updateDraft(patch) {
    Object.assign(state.current, patch);
    if ('type' in patch) {
      const t = patch.type;
      if (t !== 'prvni' && t !== 'druha') {
        state.current.partner = null;
      }
      if (t !== 'treti') state.current.tretiPozice = null;
      if (t === 'varsava') {
        state.current.vydrazitel = null;
      } else if (t === 'prvni') {
        // 1. povinnost: vydražitel = forhont, vždy.
        state.current.vydrazitel = state.current.forhont;
      } else if (t === 'druha') {
        // 2. povinnost: vydražitel ≠ forhont. Pokud byl forhont, reset.
        if (state.current.vydrazitel === state.current.forhont || state.current.vydrazitel == null) {
          state.current.vydrazitel = null;
        }
      } else if (state.current.vydrazitel == null) {
        state.current.vydrazitel = state.current.forhont;
      }
    }
    render();
  },

  toggleHlaska(playerId, key, on) {
    const h = state.current.hlasky ?? {};
    h[playerId] = h[playerId] ?? {};
    h[playerId][key] = on;
    // Skupinová exkluzivita – pokud zapínám, vypni ostatní hlášky ze stejné skupiny.
    if (on) {
      for (const group of Object.values(HLASKA_GROUPS)) {
        if (group.includes(key)) {
          for (const other of group) if (other !== key) h[playerId][other] = false;
        }
      }
    }
    state.current.hlasky = h;
    render();
  },

  updateVysledek(patch) {
    state.current.vysledek = { ...state.current.vysledek, ...patch };
    render();
  },

  computeSehravka() {
    const s = state.current;
    const input = {
      type: s.type,
      tretiPozice: s.tretiPozice,
      vydrazitel: s.vydrazitel,
      partner: s.partner,
      forhont: s.forhont,
      hlasky: s.hlasky,
      flekHry: s.flekHry,
      flekPagat: s.flekPagat,
      flekValat: s.flekValat,
      vysledek: s.vysledek,
    };
    const result = scoreSehravka(input, state.players);
    state.current.computed = result;
    state.current.typeLabel = GAME_LABELS[s.type];
    render();
  },

  backToWizard() {
    delete state.current.computed;
    render();
  },

  commitSehravka() {
    const s = state.current;
    const deltaArr = [0, 0, 0, 0].map((_, i) => s.computed.delta[i] ?? 0);
    for (let i = 0; i < 4; i++) state.totals[i] += deltaArr[i];
    state.sehravky.push({
      type: s.type,
      typeLabel: s.typeLabel,
      forhont: s.forhont,
      vydrazitel: s.vydrazitel,
      partner: s.partner,
      tretiPozice: s.tretiPozice,
      flekHry: s.flekHry, flekPagat: s.flekPagat, flekValat: s.flekValat,
      hlasky: s.hlasky,
      vysledek: s.vysledek,
      delta: deltaArr,
      rows: s.computed.rows,
      at: Date.now(),
    });
    state.povinnostIdx = nextPovinnost(state.povinnostIdx);
    state.current = null;
    render();
  },
};

render();
