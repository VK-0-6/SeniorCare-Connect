// components/navbar.js — top navigation bar.
// Renders different links depending on auth state.

import { h, icon } from '../utils/dom.js';
import { navigate, currentRoute } from '../router.js';
import { getCachedUser } from '../services/authService.js';

const PUBLIC_LINKS = [
  { route: '/', label: 'Home' },
  { route: '/about', label: 'About' },
  { route: '/contact', label: 'Contact' },
];

const AUTH_LINKS = [
  { route: '/login', label: 'Sign In' },
  { route: '/register', label: 'Get Started', variant: 'primary' },
];

export function renderNavbar() {
  // getCachedUser() is synchronous — returns null when logged out.
  const user = getCachedUser();
  const links = user
    ? [{ route: '/dashboard', label: 'Dashboard' }, ...PUBLIC_LINKS.slice(1)]
    : PUBLIC_LINKS;

  const linksEl = h('nav', { class: 'navbar-links', 'aria-label': 'Main' });
  for (const link of links) {
    linksEl.append(h('a', {
      class: `navbar-link ${currentRoute() === link.route ? 'active' : ''}`,
      href: `#${link.route}`,
      onclick: (e) => { e.preventDefault(); navigate(link.route); },
    }, link.label));
  }
  if (!user) {
    for (const link of AUTH_LINKS) {
      linksEl.append(h('a', {
        class: `navbar-link ${link.variant === 'primary' ? 'btn btn-primary' : ''}`,
        href: `#${link.route}`,
        onclick: (e) => { e.preventDefault(); navigate(link.route); },
      }, link.label));
    }
  }

  const brand = h('a', { class: 'navbar-brand', href: '#/', onclick: (e) => { e.preventDefault(); navigate('/'); } },
    h('img', { class: 'navbar-brand-icon', src: '/favicon.svg', alt: '' }),
    h('span', {}, 'SeniorCare Connect')
  );

  const toggle = h('button', {
    class: 'btn btn-ghost btn-icon navbar-toggle',
    'aria-label': 'Toggle menu',
    'aria-expanded': 'false',
    onclick: (e) => {
      const open = linksEl.classList.toggle('open');
      e.currentTarget.setAttribute('aria-expanded', String(open));
    },
  }, icon('menu'));

  return h('header', { class: 'navbar' },
    h('div', { class: 'container navbar-inner' }, brand, toggle, linksEl)
  );
}
