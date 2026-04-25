import { load, save, reset, nextPovinnost, setMode } from './state.js';
import { GAME_LABELS, HLASKA_GROUPS, TRUL_COMPAT } from './constants.js';
import { scoreSehravka } from './scoring.js';
import { h, mount } from './ui.js';
import { viewSetup } from './views/setup.js';
import { viewMain } from './views/main.js';
import { viewSehravka } from './views/sehravka.js';
import { viewSummary } from './views/summary.js';
import { viewDialog } from './views/dialog.js';

let state = load();
let dialog = null;

const root = document.getElementById('app');

function render() {
  setMode(state.mode ?? 'kc');
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
  if (dialog) {
    view = h('div', { class: 'app-root' }, view, viewDialog(dialog, dialogActions));
  }
  mount(root, view);
}

function syncDruhaPagat(draft) {
  const curPag = draft.vysledek?.pagat ?? null;
  draft.vysledek = {
    ...draft.vysledek,
    pagat: { uhran: curPag?.uhran ?? null, player: draft.vydrazitel ?? null },
  };
}

function showDialog(opts) {
  dialog = opts;
  render();
}

const dialogActions = {
  close() { dialog = null; render(); },
  confirm() {
    const onConfirm = dialog?.onConfirm;
    dialog = null;
    render();
    onConfirm?.();
  },
};

const actions = {
  startGame(names, mode) {
    state = {
      ...state,
      players: names,
      mode: mode === 'kc' ? 'kc' : 'body',
      totals: [0, 0, 0, 0],
      povinnostIdx: 0,
      sehravky: [],
      current: null,
    };
    render();
  },

  resetGame() {
    showDialog({
      title: 'Začít novou hru?',
      message: 'Aktuální skóre i historie sehrávek budou smazány.',
      confirmLabel: 'Začít znovu',
      destructive: true,
      onConfirm: () => {
        const prev = state.players;
        const prevMode = state.mode;
        reset();
        state = load();
        state.previousPlayers = prev;
        state.mode = prevMode ?? 'body';
        render();
      },
    });
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
      step: 0,
      hlaskyTab: 0,
    };
    render();
  },

  nextStep() {
    const c = state.current;
    const steps = c.type === 'varsava'
      ? ['drazba', 'vysledek']
      : ['drazba', 'hlasky', 'vysledek'];
    const next = (c.step ?? 0) + 1;
    if (next >= steps.length) {
      actions.computeSehravka();
      return;
    }
    c.step = next;
    render();
  },

  prevStep() {
    const c = state.current;
    c.step = Math.max(0, (c.step ?? 0) - 1);
    render();
  },

  jumpToStep(idx) {
    state.current.step = Math.max(0, idx);
    render();
  },

  setHlaskyTab(idx) {
    state.current.hlaskyTab = idx;
    render();
  },

  cancelSehravka() {
    showDialog({
      title: 'Zrušit sehrávku?',
      message: 'Zadané údaje nebudou uloženy.',
      confirmLabel: 'Zrušit sehrávku',
      cancelLabel: 'Pokračovat',
      destructive: true,
      onConfirm: () => {
        state.current = null;
        render();
      },
    });
  },

  updateDraft(patch) {
    Object.assign(state.current, patch);
    if ('vydrazitel' in patch && state.current.type === 'druha') {
      syncDruhaPagat(state.current);
    }
    if ('type' in patch) {
      const t = patch.type;
      if (t !== 'prvni' && t !== 'druha') {
        state.current.partner = null;
      }
      if (t !== 'treti') state.current.tretiPozice = null;
      if (t === 'varsava') {
        state.current.vydrazitel = null;
        // Inicializuj oči Varšavy tak, aby součet byl 70 (default 0/0/0/70).
        const oci = state.current.vysledek?.ociHrace ?? [0, 0, 0, 0];
        const sum = oci.reduce((a, b) => a + b, 0);
        if (sum !== 70) {
          state.current.vysledek = { ...state.current.vysledek, ociHrace: [0, 0, 0, 70] };
        }
      } else if (t === 'prvni') {
        // 1. povinnost: vydražitel = forhont, vždy.
        state.current.vydrazitel = state.current.forhont;
      } else if (t === 'druha') {
        // 2. povinnost: vydražitel ≠ forhont. Pokud byl forhont, reset.
        if (state.current.vydrazitel === state.current.forhont || state.current.vydrazitel == null) {
          state.current.vydrazitel = null;
        }
        // Pagát vždy hlásí vydražitel (závazek 2. povinnosti).
        syncDruhaPagat(state.current);
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
    if (on) {
      for (const [groupName, group] of Object.entries(HLASKA_GROUPS)) {
        if (!group.includes(key)) continue;
        // Per-hráč: max 1 hláška ze skupiny.
        for (const other of group) if (other !== key) h[playerId][other] = false;
        // Cross-player exkluzivita pro trul-skupinu, s výjimkou kompatibilních párů
        // (např. Trul + Královské honéry mohou být současně).
        if (groupName === 'trul') {
          const allowed = new Set(TRUL_COMPAT[key] ?? []);
          for (const otherPid of Object.keys(h)) {
            if (Number(otherPid) === playerId) continue;
            for (const k of group) {
              if (h[otherPid] && h[otherPid][k] && !allowed.has(k)) {
                h[otherPid][k] = false;
              }
            }
          }
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
    const c = state.current;
    delete c.computed;
    const steps = c.type === 'varsava' ? 2 : 3;
    c.step = steps - 1;
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
