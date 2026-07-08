// pages/notFound.js — 404 page.

import { h } from '../utils/dom.js';
import { pageLayout } from '../components/pageLayout.js';
import { navigate } from '../router.js';

export function notFoundPage() {
  const content = h('div', { class: 'empty-state', style: { minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' } },
    h('div', { class: 'empty-state-icon', style: { fontSize: '80px' } }, '🔍'),
    h('h1', { class: 'empty-state-title', style: { fontSize: 'var(--font-size-2xl)' } }, 'Page not found'),
    h('p', { class: 'text-muted', style: { marginBottom: 'var(--space-5)' } }, 'The page you are looking for does not exist or has moved.'),
    h('div', {},
      h('button', { class: 'btn btn-primary btn-lg', onclick: () => navigate('/') }, 'Back to Home')
    )
  );
  return pageLayout(content);
}
