// components/sidebar.js — dashboard sidebar navigation.

import { h } from '../utils/dom.js';
import { navigate, currentRoute } from '../router.js';

const SECTIONS = [
  {
    title: 'Health',
    links: [
      { route: '/dashboard', label: 'Dashboard', icon: 'home' },
      { route: '/medicines', label: 'Medicines', icon: 'pill' },
      { route: '/medicines/history', label: 'Reminder History', icon: 'info' },
      { route: '/health', label: 'Health Profile', icon: 'heart' },
      { route: '/qr', label: 'QR Health Card', icon: 'qr' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { route: '/ai-reader', label: 'AI Medicine Reader', icon: 'ai' },
      { route: '/sos', label: 'Emergency SOS', icon: 'sos' },
      { route: '/contacts', label: 'Trusted Contacts', icon: 'users' },
    ],
  },
  {
    title: 'Account',
    links: [
      { route: '/settings', label: 'Settings', icon: 'settings' },
      { route: '/about', label: 'About', icon: 'info' },
      { route: '/contact', label: 'Contact', icon: 'mail' },
    ],
  },
];

export function renderSidebar() {
  const nav = h('nav', { 'aria-label': 'Dashboard' });
  for (const section of SECTIONS) {
    nav.append(h('div', { class: 'sidebar-section-title' }, section.title));
    for (const link of section.links) {
      nav.append(h('a', {
        class: `sidebar-link ${currentRoute() === link.route ? 'active' : ''}`,
        href: `#${link.route}`,
        onclick: (e) => { e.preventDefault(); navigate(link.route); },
      }, link.label));
    }
  }
  return h('aside', { class: 'sidebar' }, nav);
}