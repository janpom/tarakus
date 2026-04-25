import { h } from '../ui.js';
import { formatHal } from '../state.js';
import { determineTeams } from '../scoring.js';

export function viewSummary(state, actions) {
  const s = state.current;
  const result = s.computed;
  const players = state.players;

  return h('div', { class: 'summary wizard' },
    h('header', { class: 'wizard-header' },
      h('button', { class: 'icon-btn', onclick: actions.backToWizard, 'aria-label': 'Upravit' }, '←'),
      h('div', { class: 'wizard-title' },
        h('h1', {}, 'Vyúčtování'),
        h('div', { class: 'step-dots' }, h('span', { class: 'dot done' }), h('span', { class: 'dot active' })),
      ),
      h('span', { class: 'icon-btn invisible' }),
    ),
    h('main', { class: 'wizard-content summary-content' },
      h('section', { class: 'recap' },
        h('h2', {}, s.typeLabel ?? 'Sehrávka'),
        s.vydrazitel != null
          ? h('p', {}, 'Vydražitel: ', h('strong', {}, players[s.vydrazitel]))
          : h('p', {}, 'Forhont: ', h('strong', {}, players[s.forhont])),
      ),
      deltasSection(state, result),
      breakdownSection(state, result),
    ),
    h('footer', { class: 'wizard-footer' },
      h('button', { class: 'primary big', onclick: actions.commitSehravka }, 'Potvrdit a pokračovat'),
    ),
  );
}

function deltasSection(state, result) {
  const players = state.players;
  return h('section', { class: 'field' },
    h('div', { class: 'field-label' }, 'Změna skóre'),
    h('div', { class: 'deltas' },
      ...players.map((name, i) => {
        const d = result.delta[i] ?? 0;
        return h('div', { class: `delta-pill ${d > 0 ? 'pos' : d < 0 ? 'neg' : ''}` },
          h('div', { class: 'd-name' }, name),
          h('div', { class: 'd-val' }, formatHal(d)),
        );
      }),
    ),
  );
}

function breakdownSection(state, result) {
  const s = state.current;
  const players = state.players;
  const ids = players.map((_, i) => i);
  const rows = result.rows ?? [];

  let groups;
  if (s.type === 'varsava') {
    groups = ids.map(i => ({ title: players[i], members: [i] }));
  } else {
    const [team1, team2] = determineTeams(s.type, ids, s.vydrazitel, s.partner);
    groups = [
      { title: team1.length === 1 ? 'Vydražitel' : 'Vydražitelský tým', members: team1 },
      { title: team2.length === 1 ? 'Obrana' : 'Obrana', members: team2 },
    ];
  }

  const klass = groups.length === 4 ? 'teams teams-4' : 'teams teams-2';
  return h('section', { class: 'field' },
    h('div', { class: 'field-label' }, 'Rozpis'),
    h('div', { class: klass },
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
      group.members.length > 1
        ? h('span', { class: 'member-names' }, group.members.map(i => players[i]).join(' + '))
        : h('span', { class: 'member-names' }, players[group.members[0]]),
    ),
    items.length === 0
      ? h('div', { class: 'row-label' }, '—')
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
