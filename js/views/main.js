import { h } from '../ui.js';
import { formatHal } from '../state.js';
import { GAME_INFO } from '../constants.js';

function historyItem(s, num, players) {
  return h('li', { class: 'hist-item' },
    h('div', { class: 'hist-num' }, `#${num}`),
    h('div', { class: 'hist-meta' },
      h('div', { class: 'hist-type' }, GAME_INFO[s.type]?.short ?? s.typeLabel),
      h('div', { class: 'hist-forhont' }, players[s.forhont]),
    ),
    h('div', { class: 'hist-grid grid2x2' },
      ...[0, 1, 2, 3].map(i => {
        const d = s.delta[i] ?? 0;
        return h('div', {
          class: `hist-cell slot-${i} ${d > 0 ? 'pos' : d < 0 ? 'neg' : ''}`,
        }, formatHal(d));
      }),
    ),
  );
}

export function viewMain(state, actions) {
  const povId = state.povinnostIdx;
  return h('div', { class: 'main-view' },
    h('header', { class: 'app-header' },
      h('img', { src: './assets/logo.png', alt: 'Tarakus', class: 'header-logo' }),
      h('button', { class: 'icon-btn', onclick: actions.resetGame, 'aria-label': 'Nová hra' },
        h('span', { class: 'ico' }, '↻'),
      ),
    ),
    h('section', { class: 'grid2x2 scoreboard' },
      ...[0, 1, 2, 3].map(i => h('div', {
        class: `player-card slot-${i} ${i === povId ? 'povinnost' : ''}`,
      },
        h('div', { class: 'player-name' }, state.players[i]),
        h('div', { class: 'player-total' }, formatHal(state.totals[i])),
      )),
    ),
    h('section', { class: 'actions' },
      h('button', { class: 'primary big', onclick: actions.startSehravka }, 'Nová sehrávka'),
    ),
    state.sehravky.length > 0
      ? h('section', { class: 'history' },
          h('h2', {}, 'Historie'),
          h('ol', { class: 'history-list' },
            ...state.sehravky.slice().reverse().map((s, idx) => historyItem(s, state.sehravky.length - idx, state.players)),
          ),
        )
      : null,
  );
}
