// components/footer.js — site footer.

import { h } from '../utils/dom.js';
import { navigate } from '../router.js';

export function renderFooter() {
  const links = [
    { route: '/about', label: 'About' },
    { route: '/contact', label: 'Contact' },
    { route: '/settings', label: 'Settings' },
  ];
  const linksEl = h('div', { class: 'footer-links' });
  for (const l of links) {
    linksEl.append(h('a', { href: `#${l.route}`, onclick: (e) => { e.preventDefault(); navigate(l.route); } }, l.label));
  }
  return h('footer', { class: 'footer' },
    h('div', { class: 'container footer-inner' },
      h('div', { class: 'footer-copy' }, '© ', new Date().getFullYear(), ' SeniorCare Connect'),
      linksEl
    )
  );
}
