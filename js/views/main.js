import { h } from '../ui.js';
import { formatHal, computeRole } from '../state.js';
import { GAME_INFO } from '../constants.js';

function pname(name, role) {
  return h('span', { class: `pname ${role}` }, name);
}

function historyItem(s, num, players) {
  const prefix = num < 10 ? ' #' : '#';
  const forhontEl = pname(players[s.forhont], computeRole(s.forhont, s.vydrazitel, s.forhont));
  const vydrazEl = (s.vydrazitel != null && s.vydrazitel !== s.forhont)
    ? pname(players[s.vydrazitel], computeRole(s.forhont, s.vydrazitel, s.vydrazitel))
    : null;
  return h('li', { class: 'hist-item' },
    h('div', { class: 'hist-num' }, `${prefix}${num}`),
    h('div', { class: 'hist-meta' },
      h('div', { class: 'hist-type' }, s.typeLabel ?? GAME_INFO[s.type]?.full ?? GAME_INFO[s.type]?.short),
      h('div', { class: 'hist-actors' },
        forhontEl,
        vydrazEl ? ' · ' : null,
        vydrazEl,
      ),
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

function startSwapDrag(e, srcIdx, onSwap) {
  if (e.button != null && e.button !== 0) return;
  const el = e.currentTarget;
  const startX = e.clientX;
  const startY = e.clientY;
  let dragging = false;
  let lastTarget = null;
  const onMove = (ev) => {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    if (!dragging && Math.hypot(dx, dy) < 6) return;
    if (!dragging) {
      dragging = true;
      el.classList.add('dragging');
    }
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    el.style.pointerEvents = 'none';
    const under = document.elementFromPoint(ev.clientX, ev.clientY);
    el.style.pointerEvents = '';
    const card = under?.closest?.('.player-card');
    if (lastTarget && lastTarget !== card) lastTarget.classList.remove('drop-target');
    if (card && card !== el) {
      card.classList.add('drop-target');
      lastTarget = card;
    } else {
      lastTarget = null;
    }
  };
  const cleanup = () => {
    el.releasePointerCapture?.(e.pointerId);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onUp);
    el.classList.remove('dragging');
    el.style.transform = '';
    if (lastTarget) lastTarget.classList.remove('drop-target');
  };
  const onUp = () => {
    const target = lastTarget;
    const didDrag = dragging;
    cleanup();
    if (didDrag && target) {
      const destIdx = Number(target.dataset.slot);
      if (!Number.isNaN(destIdx)) onSwap(srcIdx, destIdx);
    }
  };
  el.setPointerCapture?.(e.pointerId);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
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
        class: `player-card slot-${i} swappable ${i === povId ? 'povinnost' : ''}`,
        'data-slot': i,
        onpointerdown: (e) => startSwapDrag(e, i, actions.swapSlots),
      },
        h('div', { class: 'player-name' },
          pname(state.players[i], computeRole(povId, null, i)),
        ),
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
