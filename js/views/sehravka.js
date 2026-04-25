import { h } from '../ui.js';
import {
  GAME_INFO, MALE_HLASKY, VELKE_HLASKY, FLEK_LABELS, TRETI_POZICE, HLASKA_ORDER,
} from '../constants.js';

const HLASKA_DEFS = { ...MALE_HLASKY, ...VELKE_HLASKY };

const STEPS_NORMAL = [
  { id: 'drazba', title: 'Dražba' },
  { id: 'hlasky', title: 'Hlášky a fleky' },
  { id: 'vysledek', title: 'Výsledek' },
];
const STEPS_VARSAVA = [
  { id: 'drazba', title: 'Varšava' },
  { id: 'vysledek', title: 'Výsledek' },
];

function stepsFor(type) {
  return type === 'varsava' ? STEPS_VARSAVA : STEPS_NORMAL;
}

export function viewSehravka(state, actions) {
  const d = state.current;
  const steps = stepsFor(d.type);
  const stepIdx = Math.min(d.step ?? 0, steps.length - 1);
  const step = steps[stepIdx];

  let content;
  if (step.id === 'drazba') content = stepDrazba(state, actions);
  else if (step.id === 'hlasky') content = stepHlaskyFleky(state, actions);
  else if (step.id === 'vysledek') content = stepVysledek(state, actions);

  const err = validateStep(step.id, state);
  const isLast = stepIdx === steps.length - 1;

  return h('div', { class: 'wizard' },
    h('header', { class: 'wizard-header' },
      stepIdx > 0
        ? h('button', { class: 'icon-btn', onclick: actions.prevStep, 'aria-label': 'Zpět' },
            h('span', { class: 'ico' }, '←'))
        : h('button', { class: 'icon-btn', onclick: actions.cancelSehravka, 'aria-label': 'Zrušit' },
            h('span', { class: 'ico' }, '✕')),
      h('div', { class: 'wizard-title' },
        h('h1', {}, step.title),
        h('div', { class: 'step-dots' },
          ...steps.map((s, i) => h('button', {
            class: `dot ${i === stepIdx ? 'active' : i < stepIdx ? 'done' : ''}`,
            type: 'button',
            onclick: i < stepIdx ? () => actions.jumpToStep(i) : undefined,
            'aria-label': s.title,
          })),
        ),
      ),
      h('span', { class: 'icon-btn invisible' }),
    ),
    h('main', { class: 'wizard-content' }, content),
    h('footer', { class: 'wizard-footer' },
      err ? h('div', { class: 'err-bar' }, err) : null,
      h('button', {
        class: 'primary big',
        disabled: err ? true : null,
        onclick: actions.nextStep,
      }, isLast ? 'Vypočítat vyúčtování' : 'Pokračovat →'),
    ),
  );
}

// ===== Krok 1: Dražba =====
function stepDrazba(state, actions) {
  const d = state.current;
  const players = state.players;
  const isVarsava = d.type === 'varsava';

  return h('div', { class: 'panel' },
    field('Typ hry (povinnost)',
      h('div', { class: 'chips wrap-2 type-chips' },
        ...Object.entries(GAME_INFO).map(([k, info]) => h('button', {
          class: `chip lbl ${d.type === k ? 'active' : ''}`,
          type: 'button',
          onclick: () => actions.updateDraft({ type: k }),
        },
          h('span', { class: 'lbl-main' }, info.short),
          info.alt ? h('span', { class: 'lbl-sub' }, info.alt) : null,
        )),
      ),
    ),

    isVarsava
      ? field('Forhont', infoChip(`${players[d.forhont]} vyhlašuje Varšavu`))
      : null,

    d.type && !isVarsava ? vydrazitelField(state, actions) : null,

    (d.type === 'prvni' || d.type === 'druha') ? partnerField(state, actions) : null,
    d.type === 'treti' ? talonField(state, actions) : null,

    d.type && !isVarsava ? zavazujiciField(state, actions) : null,
  );
}

function vydrazitelField(state, actions) {
  const d = state.current;
  const players = state.players;
  if (d.type === 'prvni') {
    return field('Vydražitel', infoChip(`${players[d.forhont]} (povinně forhont)`));
  }
  const canPick = d.type === 'druha'
    ? players.map((_, i) => i).filter(i => i !== d.forhont)
    : players.map((_, i) => i);
  return field('Vydražitel',
    h('div', { class: 'chips' },
      ...canPick.map(i => h('button', {
        class: `chip ${d.vydrazitel === i ? 'active' : ''}`,
        type: 'button',
        onclick: () => actions.updateDraft({ vydrazitel: i }),
      }, players[i])),
    ),
  );
}

function partnerField(state, actions) {
  const d = state.current;
  const players = state.players;
  return field('Partner (držitel volaného taroku)',
    h('div', { class: 'chips' },
      ...players.map((name, i) => h('button', {
        class: `chip ${d.partner === i ? 'active' : ''}`,
        type: 'button',
        onclick: () => actions.updateDraft({ partner: i }),
      }, name)),
    ),
  );
}

function talonField(state, actions) {
  const d = state.current;
  return field('Pozice talonu',
    h('div', { class: 'chips' },
      ...Object.entries(TRETI_POZICE).map(([k, label]) => h('button', {
        class: `chip ${d.tretiPozice === Number(k) ? 'active' : ''}`,
        type: 'button',
        onclick: () => actions.updateDraft({ tretiPozice: Number(k) }),
      }, label)),
    ),
  );
}

function zavazujiciField(state, actions) {
  const d = state.current;
  const setHl = (key) => (val) => {
    const cur = d.vysledek?.[key] ?? null;
    const curHl = cur?.hlaseno ?? null;
    // Druhé kliknutí na stejný chip = odznačit.
    const newHl = curHl === val ? null : val;
    if (newHl === null) {
      if (cur?.uhran === true) actions.updateVysledek({ [key]: { uhran: true, hlaseno: null } });
      else actions.updateVysledek({ [key]: null });
    } else {
      actions.updateVysledek({ [key]: { uhran: cur?.uhran ?? null, hlaseno: newHl } });
    }
  };
  const pagHl = d.vysledek?.pagat?.hlaseno ?? null;
  const valHl = d.vysledek?.valat?.hlaseno ?? null;
  return field('Zavazující hlášky',
    h('div', { class: 'row-stack' },
      h('div', { class: 'labeled-row' },
        h('span', { class: 'row-label' }, 'Pagát'),
        h('div', { class: 'chips' },
          hlChip(pagHl, 'vydr', 'vydražitel', () => setHl('pagat')('vydr')),
          hlChip(pagHl, 'prot', 'obrana', () => setHl('pagat')('prot')),
        ),
      ),
      h('div', { class: 'labeled-row' },
        h('span', { class: 'row-label' }, 'Valát'),
        h('div', { class: 'chips' },
          hlChip(valHl, 'vydr', 'vydražitel', () => setHl('valat')('vydr')),
          hlChip(valHl, 'prot', 'obrana', () => setHl('valat')('prot')),
        ),
      ),
    ),
  );
}

// ===== Krok 2: Hlášky + Fleky =====
function stepHlaskyFleky(state, actions) {
  const d = state.current;
  const tabIdx = d.hlaskyTab ?? 0;
  const pagHl = d.vysledek?.pagat?.hlaseno ?? null;
  const valHl = d.vysledek?.valat?.hlaseno ?? null;

  return h('div', { class: 'panel' },
    // Prozrazující hlášky — tabs
    field('Prozrazující hlášky',
      h('div', { class: 'tabs' },
        ...state.players.map((name, i) => {
          const playerHlasky = d.hlasky?.[i] ?? {};
          const selected = HLASKA_ORDER.filter(k => playerHlasky[k]);
          return h('button', {
            class: `tab ${i === tabIdx ? 'active' : ''}`,
            type: 'button',
            onclick: () => actions.setHlaskyTab(i),
          },
            h('span', { class: 'tab-name' }, name),
            ...selected.map(k => h('span', { class: 'tab-hlaska' }, HLASKA_DEFS[k].short ?? HLASKA_DEFS[k].label)),
          );
        }),
      ),
      hlaskyPanel(state, actions, tabIdx),
    ),
    // Fleky
    field('Flekování',
      h('div', { class: 'row-stack' },
        flekRow('Hra', d.flekHry ?? 0, v => actions.updateDraft({ flekHry: v })),
        pagHl ? flekRow('Pagát', d.flekPagat ?? 0, v => actions.updateDraft({ flekPagat: v })) : null,
        valHl ? flekRow('Valát', d.flekValat ?? 0, v => actions.updateDraft({ flekValat: v })) : null,
      ),
    ),
  );
}

function hlaskyPanel(state, actions, playerIdx) {
  const d = state.current;
  const h1 = d.hlasky?.[playerIdx] ?? {};
  return h('div', { class: 'hlasky-grid' },
    ...HLASKA_ORDER.map(key => {
      const def = HLASKA_DEFS[key];
      const on = !!h1[key];
      return h('button', {
        class: `chip lbl ${on ? 'active' : ''}`,
        type: 'button',
        onclick: () => actions.toggleHlaska(playerIdx, key, !on),
      },
        h('span', { class: 'lbl-main' }, def.short ?? def.label),
        def.count ? h('span', { class: 'lbl-sub' }, `${def.count} t.`) : null,
      );
    }),
  );
}

function flekRow(label, val, setVal) {
  return h('div', { class: 'labeled-row' },
    h('span', { class: 'row-label' }, label),
    h('div', { class: 'chips' },
      ...FLEK_LABELS.slice(1).map((lbl, idx) => {
        const i = idx + 1;
        return h('button', {
          class: `chip ${val === i ? 'active' : ''}`,
          type: 'button',
          onclick: () => setVal(val === i ? 0 : i),
        }, lbl);
      }),
    ),
  );
}

// ===== Krok 3: Výsledek =====
function stepVysledek(state, actions) {
  const d = state.current;
  if (d.type === 'varsava') return vysledekVarsava(state, actions);
  return vysledekNormal(state, actions);
}

function vysledekNormal(state, actions) {
  const d = state.current;
  const ociT1 = d.vysledek?.ociT1 ?? 35;
  return h('div', { class: 'panel' },
    field('Oči (součet 70)',
      ociSlider(ociT1, 70, ['Vydražitel', 'Obrana'], v => actions.updateVysledek({ ociT1: v })),
    ),
    pagatValatVysledek(state, actions),
  );
}

function ociSlider(value, total, labels, setVal) {
  const left = h('div', { class: `oci-team ${value >= 36 ? 'win' : ''}` },
    h('span', { class: 'oci-label' }, labels[0]),
    h('span', { class: 'oci-num' }, value),
  );
  const right = h('div', { class: `oci-team ${(total - value) >= 36 ? 'win' : ''}` },
    h('span', { class: 'oci-label' }, labels[1]),
    h('span', { class: 'oci-num' }, total - value),
  );
  const leftNum = left.querySelector('.oci-num');
  const rightNum = right.querySelector('.oci-num');
  const slider = h('input', {
    type: 'range', min: 0, max: total, step: 1, value,
    class: 'slider',
  });
  slider.addEventListener('input', () => {
    const v = Number(slider.value);
    leftNum.textContent = v;
    rightNum.textContent = total - v;
    left.classList.toggle('win', v >= 36);
    right.classList.toggle('win', (total - v) >= 36);
  });
  slider.addEventListener('change', () => setVal(Number(slider.value)));
  return h('div', { class: 'oci-slider' },
    h('div', { class: 'oci-readout' }, left, right),
    slider,
  );
}

function pagatValatVysledek(state, actions) {
  const d = state.current;
  const pagHl = d.vysledek?.pagat?.hlaseno ?? null;
  const valHl = d.vysledek?.valat?.hlaseno ?? null;
  const pagU = d.vysledek?.pagat?.uhran ?? null;
  const valU = d.vysledek?.valat?.uhran ?? null;

  const setU = (key, hl) => (uhran) => {
    if (uhran === null) {
      if (hl) actions.updateVysledek({ [key]: { uhran: null, hlaseno: hl } });
      else actions.updateVysledek({ [key]: null });
    } else {
      actions.updateVysledek({ [key]: { uhran, hlaseno: hl } });
    }
  };

  return field('Pagát a valát',
    h('div', { class: 'row-stack' },
      h('div', { class: 'labeled-row' },
        h('span', { class: 'row-label' },
          'Pagát', pagHl ? h('span', { class: 'row-meta' }, `· ${pagHl === 'vydr' ? 'vydr.' : 'obr.'}`) : null,
        ),
        h('div', { class: 'chips' },
          hlChip(pagU, null, '—', () => setU('pagat', pagHl)(null)),
          hlChip(pagU, true, 'uhrán', () => setU('pagat', pagHl)(true)),
          pagHl ? hlChip(pagU, false, 'neuhrán', () => setU('pagat', pagHl)(false)) : null,
        ),
      ),
      h('div', { class: 'labeled-row' },
        h('span', { class: 'row-label' },
          'Valát', valHl ? h('span', { class: 'row-meta' }, `· ${valHl === 'vydr' ? 'vydr.' : 'obr.'}`) : null,
        ),
        h('div', { class: 'chips' },
          hlChip(valU, null, '—', () => setU('valat', valHl)(null)),
          hlChip(valU, true, 'uhrán', () => setU('valat', valHl)(true)),
          valHl ? hlChip(valU, false, 'neuhrán', () => setU('valat', valHl)(false)) : null,
        ),
      ),
      valU === true
        ? h('div', { class: 'labeled-row' },
            h('span', { class: 'row-label' }, 'Shoz protistrany'),
            h('input', {
              type: 'number', min: 0, max: 35, step: 1,
              value: d.vysledek.shozProtiValat ?? 0,
              oninput: (e) => actions.updateVysledek({
                shozProtiValat: Math.max(0, Math.min(35, Number(e.target.value) || 0)),
              }),
            }),
          )
        : null,
    ),
  );
}

function vysledekVarsava(state, actions) {
  const d = state.current;
  const oci = d.vysledek?.ociHrace ?? [0, 0, 0, 0];
  const sum = oci.reduce((a, b) => a + b, 0);
  return h('div', { class: 'panel' },
    field('Oči hráčů (součet 70)',
      h('div', { class: 'varsava-grid' },
        ...state.players.map((name, i) => h('div', {
          class: `varsava-row ${i === d.forhont ? 'forhont' : ''}`,
        },
          h('span', { class: 'v-name' }, name, i === d.forhont ? h('span', { class: 'badge-inline' }, 'F') : null),
          h('input', {
            type: 'number', min: 0, max: 70, step: 1,
            value: oci[i],
            oninput: (e) => {
              const v = Math.max(0, Math.min(70, Number(e.target.value) || 0));
              const next = oci.slice();
              next[i] = v;
              actions.updateVysledek({ ociHrace: next });
            },
          }),
        )),
      ),
      h('div', { class: `sum-indicator ${sum === 70 ? 'ok' : 'err'}` }, `Σ ${sum} / 70`),
    ),
  );
}

// ===== helpers =====
function field(label, ...children) {
  return h('div', { class: 'field' },
    h('div', { class: 'field-label' }, label),
    ...children,
  );
}

function hlChip(cur, val, label, onclick) {
  return h('button', {
    class: `chip ${cur === val ? 'active' : ''}`,
    type: 'button', onclick,
  }, label);
}

function infoChip(text) {
  return h('div', { class: 'info-chip' }, text);
}

// ===== validace =====
export function validateStep(stepId, state) {
  const d = state.current;
  if (stepId === 'drazba') {
    if (!d.type) return 'Vyber typ hry.';
    if (d.type === 'varsava') return null;
    if (d.vydrazitel == null) return 'Vyber vydražitele.';
    if ((d.type === 'prvni' || d.type === 'druha') && d.partner == null) return 'Vyber partnera.';
    if (d.type === 'treti' && !d.tretiPozice) return 'Vyber pozici talonu.';
    return null;
  }
  if (stepId === 'hlasky') return null;
  if (stepId === 'vysledek') {
    if (d.type === 'varsava') {
      const sum = (d.vysledek?.ociHrace ?? []).reduce((a, b) => a + b, 0);
      if (sum !== 70) return `Součet očí: ${sum}/70.`;
      return null;
    }
    if (d.vysledek?.pagat?.hlaseno && d.vysledek.pagat.uhran == null) return 'Pagát: uhrán nebo neuhrán?';
    if (d.vysledek?.valat?.hlaseno && d.vysledek.valat.uhran == null) return 'Valát: uhrán nebo neuhrán?';
    if (d.vysledek?.valat?.uhran === true && d.vysledek?.shozProtiValat == null) return 'Zadej shoz při valátu.';
    return null;
  }
  return null;
}

// Kompatibilita s původním API (app.js může volat validateDraft)
export function validateDraft(state) {
  const steps = state.current.type === 'varsava' ? ['drazba', 'vysledek'] : ['drazba', 'hlasky', 'vysledek'];
  for (const s of steps) {
    const e = validateStep(s, state);
    if (e) return e;
  }
  return null;
}
