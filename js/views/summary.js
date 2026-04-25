import { h } from '../ui.js';
import { formatHal } from '../state.js';
import { determineTeams } from '../scoring.js';

export function viewSummary(state, actions) {
  const s = state.current;
  const result = s.computed;
  const players = state.players;

  return h('div', { class: 'summary wizard' },
    h('header', { class: 'wizard-header' },
      h('button', { class: 'icon-btn', onclick: actions.backToWizard, 'aria-label': 'Upravit' },
        h('span', { class: 'ico' }, '←')),
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
    groups = ids.map(i => ({ title: players[i], members: [i], multiplier: 1 }));
  } else {
    const [team1, team2] = determineTeams(s.type, ids, s.vydrazitel, s.partner);
    groups = [
      { title: team1.length === 1 ? 'Vydražitel' : 'Vydražitelský tým', members: team1, multiplier: team2.length },
      { title: team2.length === 1 ? 'Obrana' : 'Obrana', members: team2, multiplier: team1.length },
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
  const mult = group.multiplier ?? 1;
  const items = [];
  let rowSum = 0;
  for (const r of rows) {
    const sign = r.winners?.some(i => memberSet.has(i))
      ? +1
      : r.losers?.some(i => memberSet.has(i)) ? -1 : 0;
    if (sign === 0) continue;
    const value = sign * (r.value ?? 0);
    rowSum += value;
    items.push({ label: r.label, value });
  }
  const total = rowSum * mult;
  const sumLabel = mult > 1 ? `Součet × ${mult}` : 'Součet';
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
      h('span', {}, sumLabel),
      h('span', { class: 'player-total' }, formatHal(total)),
    ),
  );
}
