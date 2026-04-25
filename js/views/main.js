import { h } from '../ui.js';
import { formatHal } from '../state.js';
import { GAME_INFO } from '../constants.js';

export function viewMain(state, actions) {
  const povId = state.povinnostIdx;
  return h('div', { class: 'main-view' },
    h('header', { class: 'app-header' },
      h('h1', {}, 'Tarakus'),
      h('button', { class: 'ghost small', onclick: actions.resetGame }, '⟲'),
    ),
    h('section', { class: 'grid2x2 scoreboard' },
      ...[0, 1, 2, 3].map(i => h('div', {
        class: `player-card slot-${i} ${i === povId ? 'povinnost' : ''}`,
      },
        h('div', { class: 'player-name' }, state.players[i]),
        h('div', { class: 'player-total' }, formatHal(state.totals[i])),
        i === povId ? h('div', { class: 'badge' }, 'povinnost') : null,
      )),
    ),
    h('section', { class: 'actions' },
      h('button', { class: 'primary big', onclick: actions.startSehravka }, '+ Sehrávka'),
    ),
    state.sehravky.length > 0
      ? h('section', { class: 'history' },
          h('h2', {}, 'Historie'),
          h('ol', { class: 'history-list' },
            ...state.sehravky.slice().reverse().map((s, idx) => h('li', {},
              h('span', { class: 'hist-label' },
                `#${state.sehravky.length - idx} `,
                GAME_INFO[s.type]?.short ?? s.typeLabel,
                s.vydrazitel != null ? ` · ${state.players[s.vydrazitel]}` : '',
              ),
              h('span', { class: 'hist-deltas' },
                ...s.delta.map((d, i) => h('span', {
                  class: `d ${d > 0 ? 'pos' : d < 0 ? 'neg' : ''}`,
                }, `${state.players[i].slice(0, 3)} ${formatHal(d)}`)),
              ),
            )),
          ),
        )
      : null,
  );
}
