import { h } from '../ui.js';
import { formatHal } from '../state.js';
import { determineTeams } from '../scoring.js';

export function viewSummary(state, actions) {
  const s = state.current;
  const result = s.computed;
  const players = state.players;

  return h('div', { class: 'summary' },
    h('header', { class: 'app-header' },
      h('h1', {}, 'Vyúčtování sehrávky'),
      h('span', { class: 'spacer' }),
    ),
    h('section', { class: 'recap' },
      h('h2', {}, s.typeLabel ?? 'Sehrávka'),
      s.vydrazitel != null
        ? h('p', {}, 'Vydražitel: ', h('strong', {}, players[s.vydrazitel]))
        : null,
    ),
    breakdownSection(state, result),
    h('section', { class: 'totals' },
      h('h3', {}, 'Delta této sehrávky'),
      h('div', { class: 'grid2x2' },
        ...players.map((name, i) => {
          const d = result.delta[i] ?? 0;
          return h('div', { class: `player-card slot-${i} ${d > 0 ? 'pos' : d < 0 ? 'neg' : ''}` },
            h('div', { class: 'player-name' }, name),
            h('div', { class: 'player-total' }, formatHal(d)),
          );
        }),
      ),
    ),
    h('section', { class: 'actions' },
      h('button', { class: 'ghost', onclick: actions.backToWizard }, '← Upravit'),
      h('button', { class: 'primary big', onclick: actions.commitSehravka }, 'Potvrdit & další'),
    ),
  );
}

// Rozpis: 2 kontejnery (týmy) pro non-Varšavu, 4 pro Varšavu.
// Každý kontejner ukazuje rows s hodnotou pro danou skupinu.
function breakdownSection(state, result) {
  const s = state.current;
  const players = state.players;
  const ids = players.map((_, i) => i);
  const rows = result.rows ?? [];

  let groups; // Array<{ title, members: number[] }>
  if (s.type === 'varsava') {
    groups = ids.map(i => ({ title: players[i], members: [i] }));
  } else {
    const [team1, team2] = determineTeams(s.type, ids, s.vydrazitel, s.partner);
    groups = [
      { title: team1.length === 1 ? 'Vydražitel' : 'Vydražitelský tým', members: team1 },
      { title: team2.length === 1 ? 'Obrana' : 'Obrana (soupeři)', members: team2 },
    ];
  }

  const containerClass = groups.length === 4 ? 'teams teams-4' : 'teams teams-2';
  return h('section', { class: 'breakdown' },
    h('h3', {}, 'Rozpis'),
    h('div', { class: containerClass },
      ...groups.map(g => breakdownGroup(g, rows, players)),
    ),
  );
}

function breakdownGroup(group, rows, players) {
  const memberSet = new Set(group.members);
  const items = [];
  let total = 0;
  for (const r of rows) {
    const sign = r.winners?.some(i => memberSet.has(i))
      ? +1
      : r.losers?.some(i => memberSet.has(i)) ? -1 : 0;
    if (sign === 0) continue;
    // Celková částka pro skupinu v této řádce: počet zasažených členů × (value × počet protistrany)
    const side = sign > 0 ? r.winners : r.losers;
    const other = sign > 0 ? r.losers : r.winners;
    const inGroup = side.filter(i => memberSet.has(i)).length;
    const delta = sign * inGroup * (other?.length ?? 0) * (r.value ?? 0);
    total += delta;
    items.push({ label: r.label, value: delta });
  }
  return h('div', { class: `team-card ${total > 0 ? 'pos' : total < 0 ? 'neg' : ''}` },
    h('div', { class: 'team-title' },
      h('span', {}, group.title),
      h('span', { class: 'member-names' },
        group.members.length > 1 ? group.members.map(i => players[i]).join(' + ') : '',
      ),
    ),
    items.length === 0
      ? h('div', { class: 'hint small' }, '—')
      : h('ul', { class: 'rows' },
          ...items.map(it => h('li', {},
            h('span', { class: 'row-label' }, it.label),
            h('span', { class: `row-value ${it.value > 0 ? 'pos' : it.value < 0 ? 'neg' : ''}` },
              formatHal(it.value),
            ),
          )),
        ),
    h('div', { class: 'team-sum' },
      h('span', {}, 'Součet'),
      h('span', { class: 'player-total' }, formatHal(total)),
    ),
  );
}
