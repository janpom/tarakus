import { h } from '../ui.js';

// Renders an iOS-style alert. `dialog`:
//   { title, message?, confirmLabel, cancelLabel?, destructive?, onConfirm }
export function viewDialog(dialog, actions) {
  return h('div', { class: 'dialog-overlay', onclick: actions.close },
    h('div', {
      class: 'dialog-card',
      onclick: (e) => e.stopPropagation(),
    },
      h('div', { class: 'dialog-body' },
        h('div', { class: 'dialog-title' }, dialog.title),
        dialog.message
          ? h('div', { class: 'dialog-message' }, dialog.message)
          : null,
      ),
      h('div', { class: `dialog-actions ${dialog.layout === 'stack' ? 'stack' : ''}` },
        h('button', {
          class: 'dialog-btn cancel',
          type: 'button',
          onclick: actions.close,
        }, dialog.cancelLabel ?? 'Zrušit'),
        h('button', {
          class: `dialog-btn confirm ${dialog.destructive ? 'destructive' : ''}`,
          type: 'button',
          onclick: actions.confirm,
        }, dialog.confirmLabel ?? 'OK'),
      ),
    ),
  );
}
