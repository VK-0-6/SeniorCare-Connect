// components/emptyState.js — reusable empty-state block.

import { h } from '../utils/dom.js';

export function emptyState({ icon = '📭', title = 'Nothing here yet', message = '', action = null }) {
  return h('div', { class: 'empty-state' },
    h('div', { class: 'empty-state-icon' }, icon),
    h('div', { class: 'empty-state-title' }, title),
    message ? h('p', {}, message) : null,
    action ? h('div', { style: { marginTop: 'var(--space-4)' } }, action) : null
  );
}
