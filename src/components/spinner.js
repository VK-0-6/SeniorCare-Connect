// components/spinner.js — loading spinner + full-page loading state.

import { h } from '../utils/dom.js';

export function spinner(wrap = true) {
  const s = h('div', { class: 'spinner', role: 'status', 'aria-label': 'Loading' });
  return wrap ? h('div', { class: 'spinner-wrap' }, s) : s;
}

export function loadingPage() {
  return h('div', { class: 'spinner-wrap', style: { minHeight: '60vh' } }, spinner(false));
}
