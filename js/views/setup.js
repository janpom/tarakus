import { h } from '../ui.js';

export function viewSetup(state, actions) {
  const inputs = [];
  return h('form', {
    class: 'setup',
    onsubmit: (e) => {
      e.preventDefault();
      const names = inputs.map(i => i.value.trim());
      if (names.some(n => !n)) return;
      actions.startGame(names);
    },
  },
    h('h1', {}, 'Tarakus'),
    h('div', { class: 'grid2x2 setup-grid' },
      ...[0, 1, 2, 3].map(i => {
        const input = h('input', {
          type: 'text',
          placeholder: `Hráč ${i + 1}`,
          required: true,
          autocomplete: 'off',
          value: state.players?.[i] ?? '',
        });
        inputs.push(input);
        return h('div', { class: `player-slot slot-${i}` }, input);
      }),
    ),
    h('button', { type: 'submit', class: 'primary big' }, 'Začít'),
  );
}
