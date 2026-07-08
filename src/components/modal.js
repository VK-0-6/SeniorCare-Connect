// components/modal.js — accessible modal dialog.
// openModal({ title, content, actions }) returns { close }.

import { h } from '../utils/dom.js';

export function openModal({ title, content, actions = [] }) {
  const overlay = h('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true' });
  const modal = h('div', { class: 'modal' });
  const header = h('div', { class: 'modal-header' },
    h('h2', {}, title || ''),
    h('button', { class: 'modal-close', 'aria-label': 'Close', onclick: close }, '×')
  );
  const body = h('div', { class: 'modal-body' });
  if (typeof content === 'string') body.innerHTML = content;
  else if (content) body.append(content);

  const footer = h('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: 'var(--space-5)' } });
  for (const a of actions) {
    footer.append(h('button', {
      class: `btn ${a.variant ? `btn-${a.variant}` : ''} ${a.block ? 'btn-block' : ''}`,
      onclick: () => a.onClick?.({ close }),
    }, a.label));
  }

  modal.append(header, body, footer);
  overlay.append(modal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.body.append(overlay);
  document.body.style.overflow = 'hidden';
  modal.querySelector('button, input, [tabindex]')?.focus();

  function close() {
    overlay.remove();
    document.body.style.overflow = '';
  }
  return { close };
}

export function confirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    openModal({
      title,
      content: h('p', { class: 'text-muted' }, message),
      actions: [
        { label: cancelLabel, onClick: ({ close }) => { close(); resolve(false); } },
        { label: confirmLabel, variant: danger ? 'danger' : 'primary', onClick: ({ close }) => { close(); resolve(true); } },
      ],
    });
  });
}
