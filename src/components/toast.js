// components/toast.js — toast notifications (singleton container).
// Usage: toast.show({ title, body, type: 'success' | 'error' | 'warning' | 'info' });

import { h } from '../utils/dom.js';

let container;

function ensureContainer() {
  if (container) return container;
  container = h('div', { class: 'toast-container', 'aria-live': 'polite', 'aria-atomic': 'true' });
  document.body.append(container);
  return container;
}

export function show({ title, body, type = 'info', duration = 4000 }) {
  const node = h('div', { class: `toast toast-${type}`, role: 'status' });
  if (title) node.append(h('div', { class: 'toast-title' }, title));
  if (body) node.append(h('div', { class: 'toast-body' }, body));
  ensureContainer().append(node);
  if (duration > 0) {
    setTimeout(() => {
      node.style.opacity = '0';
      setTimeout(() => node.remove(), 200);
    }, duration);
  }
  return node;
}

export const toast = {
  show,
  success: (title, body) => show({ title, body, type: 'success' }),
  error: (title, body) => show({ title, body, type: 'error', duration: 6000 }),
  warning: (title, body) => show({ title, body, type: 'warning' }),
  info: (title, body) => show({ title, body, type: 'info' }),
};

export default toast;
