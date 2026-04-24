import { h } from '../ui.js';
import {
  GAME_LABELS, MALE_HLASKY, VELKE_HLASKY, FLEK_LABELS, TRETI_POZICE,
} from '../constants.js';

export function viewSehravka(state, actions) {
  const d = state.current;
  const isVarsava = d.type === 'varsava';
  return h('div', { class: 'sehravka' },
    h('header', { class: 'app-header' },
      h('button', { class: 'ghost small', onclick: actions.cancelSehravka }, '✕'),
      h('h1', {}, 'Nová sehrávka'),
      h('span', { class: 'spacer' }),
    ),
    h('section', { class: 'step' },
      h('h2', {}, 'Typ hry'),
      h('div', { class: 'chips' },
        ...Object.entries(GAME_LABELS).map(([k, label]) => h('button', {
          class: `chip ${d.type === k ? 'active' : ''}`,
          type: 'button',
          onclick: () => actions.updateDraft({ type: k }),
        }, label)),
      ),
    ),
    d.type ? sectionVydrazitel(state, actions) : null,
    d.type && !isVarsava ? sectionZavazujici(state, actions) : null,
    d.type && !isVarsava ? sectionHlasky(state, actions) : null,
    d.type && !isVarsava ? sectionFleky(state, actions) : null,
    d.type && !isVarsava ? sectionVysledekNeVarsava(state, actions) : null,
    d.type && isVarsava ? sectionVysledekVarsava(state, actions) : null,
    d.type ? sectionSubmit(state, actions) : null,
  );
}

function sectionVydrazitel(state, actions) {
  const d = state.current;
  const players = state.players;

  if (d.type === 'varsava') {
    return h('section', { class: 'step' },
      h('h2', {}, 'Forhont'),
      h('div', { class: 'chips' },
        h('button', { class: 'chip active', type: 'button', disabled: true }, players[d.forhont]),
      ),
    );
  }
  if (d.type === 'prvni') {
    return h('section', { class: 'step' },
      h('h2', {}, 'Vydražitel'),
      h('div', { class: 'chips' },
        h('button', { class: 'chip active', type: 'button', disabled: true }, players[d.forhont]),
      ),
      partnerPicker(state, actions),
    );
  }
  const canPick = d.type === 'druha'
    ? players.map((_, i) => i !== d.forhont ? i : null).filter(i => i != null)
    : players.map((_, i) => i);

  return h('section', { class: 'step' },
    h('h2', {}, 'Vydražitel'),
    h('div', { class: 'chips' },
      ...canPick.map(i => h('button', {
        class: `chip ${d.vydrazitel === i ? 'active' : ''}`,
        type: 'button',
        onclick: () => actions.updateDraft({ vydrazitel: i }),
      }, players[i])),
    ),
    d.type === 'druha' ? partnerPicker(state, actions) : null,
    d.type === 'treti'
      ? h('div', { class: 'subsection' },
          h('h3', {}, 'Pozice talonu'),
          h('div', { class: 'chips' },
            ...Object.entries(TRETI_POZICE).map(([k, label]) => h('button', {
              class: `chip ${d.tretiPozice === Number(k) ? 'active' : ''}`,
              type: 'button',
              onclick: () => actions.updateDraft({ tretiPozice: Number(k) }),
            }, label)),
          ),
        )
      : null,
  );
}

function partnerPicker(state, actions) {
  const d = state.current;
  const players = state.players;
  return h('div', { class: 'subsection' },
    h('h3', {}, 'Partner'),
    h('div', { class: 'chips' },
      ...players.map((name, i) => h('button', {
        class: `chip ${d.partner === i ? 'active' : ''}`,
        type: 'button',
        onclick: () => actions.updateDraft({ partner: i }),
      }, name)),
    ),
  );
}

function sectionHlasky(state, actions) {
  const d = state.current;
  const players = state.players;
  const allHlasky = { ...MALE_HLASKY, ...VELKE_HLASKY };
  return h('section', { class: 'step' },
    h('h2', {}, 'Prozrazující hlášky'),
    ...players.map((name, i) => h('div', { class: 'hlasky-player' },
      h('h3', {}, name),
      h('div', { class: 'checkbox-grid' },
        ...Object.entries(allHlasky).map(([key, def]) => {
          const checked = !!(d.hlasky?.[i]?.[key]);
          return h('label', { class: `check ${checked ? 'on' : ''}` },
            h('input', {
              type: 'checkbox',
              checked: checked || null,
              onchange: (e) => actions.toggleHlaska(i, key, e.target.checked),
            }),
            h('span', {}, def.label),
          );
        }),
      ),
    )),
  );
}

function sectionZavazujici(state, actions) {
  const d = state.current;
  const pagHl = d.vysledek?.pagat?.hlaseno ?? null;
  const valHl = d.vysledek?.valat?.hlaseno ?? null;

  const setHl = (key) => (val) => {
    const cur = d.vysledek?.[key] ?? null;
    if (val === null) {
      if (cur?.uhran === true) actions.updateVysledek({ [key]: { uhran: true, hlaseno: null } });
      else actions.updateVysledek({ [key]: null });
    } else {
      actions.updateVysledek({ [key]: { uhran: cur?.uhran ?? null, hlaseno: val } });
    }
  };

  return h('section', { class: 'step' },
    h('h2', {}, 'Zavazující hlášky'),
    h('div', { class: 'flek-row' },
      h('span', { class: 'flek-label' }, 'Pagát'),
      h('div', { class: 'chips' },
        hlChip(pagHl, null, '–', () => setHl('pagat')(null)),
        hlChip(pagHl, 'vydr', 'vydr.', () => setHl('pagat')('vydr')),
        hlChip(pagHl, 'prot', 'prot.', () => setHl('pagat')('prot')),
      ),
    ),
    h('div', { class: 'flek-row' },
      h('span', { class: 'flek-label' }, 'Valát'),
      h('div', { class: 'chips' },
        hlChip(valHl, null, '–', () => setHl('valat')(null)),
        hlChip(valHl, 'vydr', 'vydr.', () => setHl('valat')('vydr')),
        hlChip(valHl, 'prot', 'prot.', () => setHl('valat')('prot')),
      ),
    ),
  );
}

function hlChip(cur, val, label, onclick) {
  return h('button', {
    class: `chip ${cur === val ? 'active' : ''}`,
    type: 'button', onclick,
  }, label);
}

function sectionFleky(state, actions) {
  const d = state.current;
  const pagHl = d.vysledek?.pagat?.hlaseno ?? null;
  const valHl = d.vysledek?.valat?.hlaseno ?? null;
  return h('section', { class: 'step' },
    h('h2', {}, 'Flekování'),
    flekRow('Hra', d.flekHry ?? 0, v => actions.updateDraft({ flekHry: v })),
    pagHl ? flekRow('Pagát', d.flekPagat ?? 0, v => actions.updateDraft({ flekPagat: v })) : null,
    valHl ? flekRow('Valát', d.flekValat ?? 0, v => actions.updateDraft({ flekValat: v })) : null,
  );
}

function flekRow(label, val, setVal) {
  return h('div', { class: 'flek-row' },
    h('span', { class: 'flek-label' }, label),
    h('div', { class: 'chips' },
      ...FLEK_LABELS.map((lbl, i) => h('button', {
        class: `chip ${val === i ? 'active' : ''}`,
        type: 'button',
        onclick: () => setVal(i),
      }, lbl)),
    ),
  );
}

function sectionVysledekNeVarsava(state, actions) {
  const d = state.current;
  const ociT1 = d.vysledek?.ociT1 ?? 35;
  return h('section', { class: 'step' },
    h('h2', {}, 'Výsledek'),
    ociSlider(ociT1, 70, ['Vydražitel', 'Obrana'], v => actions.updateVysledek({ ociT1: v })),
    pagatValatVysledek(state, actions),
  );
}

function ociSlider(value, total, labels, setVal) {
  // Aby drag fungoval, slider se nerenderuje znovu při každém pohybu –
  // oninput pouze přepisuje text readoutu, onchange commituje do state.
  const left = h('span', { class: `oci-val ${value >= 36 ? 'win' : ''}` }, `${labels[0]}: ${value}`);
  const right = h('span', { class: `oci-val ${(total - value) >= 36 ? 'win' : ''}` }, `${labels[1]}: ${total - value}`);
  const slider = h('input', {
    type: 'range', min: 0, max: total, step: 1, value,
  });
  slider.addEventListener('input', () => {
    const v = Number(slider.value);
    left.textContent = `${labels[0]}: ${v}`;
    right.textContent = `${labels[1]}: ${total - v}`;
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

  return h('div', {},
    h('div', { class: 'flek-row' },
      h('span', { class: 'flek-label' }, 'Pagát'),
      h('div', { class: 'chips' },
        hlChip(pagU, null, '–', () => setU('pagat', pagHl)(null)),
        hlChip(pagU, true, 'uhrán', () => setU('pagat', pagHl)(true)),
        pagHl ? hlChip(pagU, false, 'neuhrán', () => setU('pagat', pagHl)(false)) : null,
      ),
    ),
    h('div', { class: 'flek-row' },
      h('span', { class: 'flek-label' }, 'Valát'),
      h('div', { class: 'chips' },
        hlChip(valU, null, '–', () => setU('valat', valHl)(null)),
        hlChip(valU, true, 'uhrán', () => setU('valat', valHl)(true)),
        valHl ? hlChip(valU, false, 'neuhrán', () => setU('valat', valHl)(false)) : null,
      ),
    ),
    valU === true
      ? h('div', { class: 'sub-opt' },
          h('span', {}, 'Shoz protistrany:'),
          h('input', {
            type: 'number', min: 0, max: 35, step: 1,
            value: d.vysledek.shozProtiValat ?? 0,
            oninput: (e) => actions.updateVysledek({
              shozProtiValat: Math.max(0, Math.min(35, Number(e.target.value) || 0)),
            }),
          }),
        )
      : null,
  );
}

function sectionVysledekVarsava(state, actions) {
  const d = state.current;
  const oci = d.vysledek?.ociHrace ?? [0, 0, 0, 0];
  const sum = oci.reduce((a, b) => a + b, 0);
  return h('section', { class: 'step' },
    h('h2', {}, 'Výsledek'),
    ...state.players.map((name, i) => h('div', { class: 'oci-row' },
      h('span', { class: 'oci-row-name' },
        i === d.forhont ? `${name} (F)` : name,
      ),
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
    h('div', { class: `sum ${sum === 70 ? 'ok' : 'err'}` }, `Σ ${sum}/70`),
  );
}

function sectionSubmit(state, actions) {
  const err = validateDraft(state);
  return h('section', { class: 'step submit-step' },
    err ? h('div', { class: 'err' }, err) : null,
    h('button', {
      class: 'primary big',
      disabled: err ? true : null,
      onclick: actions.computeSehravka,
    }, 'Vypočítat'),
  );
}

export function validateDraft(state) {
  const d = state.current;
  if (!d.type) return 'Vyber typ hry.';
  if (d.type === 'varsava') {
    const oci = d.vysledek?.ociHrace ?? [0, 0, 0, 0];
    const sum = oci.reduce((a, b) => a + b, 0);
    if (sum !== 70) return `Součet očí musí být 70 (${sum}).`;
    return null;
  }
  if (d.vydrazitel == null) return 'Vyber vydražitele.';
  if ((d.type === 'prvni' || d.type === 'druha') && d.partner == null) {
    return 'Vyber partnera.';
  }
  if (d.type === 'treti' && !d.tretiPozice) return 'Vyber pozici talonu.';
  if (d.vysledek?.ociT1 == null) return 'Zadej oči.';
  if (d.vysledek?.pagat?.hlaseno && d.vysledek.pagat.uhran == null) {
    return 'Pagát: uhrán/neuhrán.';
  }
  if (d.vysledek?.valat?.hlaseno && d.vysledek.valat.uhran == null) {
    return 'Valát: uhrán/neuhrán.';
  }
  if (d.vysledek?.valat?.uhran === true && d.vysledek?.shozProtiValat == null) {
    return 'Zadej shoz při valátu.';
  }
  return null;
}
