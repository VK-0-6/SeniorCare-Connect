// components/pageLayout.js — wraps a page view with navbar + footer.
// withAuth wraps a handler so it redirects to /login when unauthenticated.

import { h } from '../utils/dom.js';
import { renderNavbar } from './navbar.js';
import { renderFooter } from './footer.js';
import { renderSidebar } from './sidebar.js';
import { getSession } from '../services/authService.js';
import { navigate } from '../router.js';

export function pageLayout(contentNode, { footer = true } = {}) {
  const main = h('main', { class: 'app-main' }, h('div', { class: 'container' }, contentNode));
  const shell = h('div', { class: 'app-shell' }, renderNavbar(), main);
  if (footer) shell.append(renderFooter());
  return shell;
}

export function withAuth(handler) {
  return async () => {
    const session = await getSession();
    if (!session) {
      navigate('/login');
      return h('div');
    }
    return handler();
  };
}

export function dashboardLayout(contentNode) {
  const main = h('main', { class: 'app-main' },
    h('div', { class: 'container dashboard-layout' }, renderSidebar(), h('div', {}, contentNode))
  );
  return h('div', { class: 'app-shell' }, renderNavbar(), main, renderFooter());
}
