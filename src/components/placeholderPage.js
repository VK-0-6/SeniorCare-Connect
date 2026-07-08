// components/placeholderPage.js — consistent "coming soon" page for modules.
// Phase 1 ships placeholders; Phase 2+ fills in the real features.

import { h, icon } from '../utils/dom.js';
import { dashboardLayout } from './pageLayout.js';

export function placeholderPage({ title, description, iconName, features = [] }) {
  const header = h('div', { class: 'page-header' },
    h('div', { class: 'row-center' }, h('div', { class: 'widget-icon' }, icon(iconName)), h('h1', {}, title)),
    h('p', { class: 'text-muted' }, description)
  );

  const card = h('div', { class: 'card' },
    h('h3', {}, 'Coming soon'),
    h('p', { class: 'text-muted', style: { marginBottom: 'var(--space-4)' } },
      'This module is part of the SeniorCare Connect roadmap. The foundation is ready — the full feature lands in a later phase.'
    ),
    features.length
      ? h('div', {}, h('div', { class: 'form-label' }, 'Planned features'), h('ul', { class: 'list' }, ...features.map((f) => h('li', { class: 'list-item' }, icon('check'), h('span', {}, f)))))
      : null
  );

  return dashboardLayout(h('div', { class: 'stack-lg' }, header, card));
}
