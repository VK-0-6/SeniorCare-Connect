// router.js — hash-based router.
// Hash routing works in static hosting and Capacitor WebView without server config.

import { el, clear } from './utils/dom.js';
import { emit } from './utils/eventBus.js';

let routes = new Map();
let notFoundHandler = null;
let beforeEachHooks = [];

export function registerRoute(path, handler) {
  routes.set(path, handler);
}

export function setNotFound(handler) {
  notFoundHandler = handler;
}

export function beforeEach(hook) {
  beforeEachHooks.push(hook);
}

export function currentRoute() {
  const hash = window.location.hash.replace(/^#/, '');
  return hash || '/';
}

export function navigate(path) {
  if (currentRoute() === path) {
    render();
    return;
  }
  window.location.hash = path;
}

async function runHooks(path) {
  for (const hook of beforeEachHooks) {
    const result = await hook(path);
    if (result === false) return false;
    if (typeof result === 'string') {
      navigate(result);
      return false;
    }
  }
  return true;
}

export async function render() {
  const path = currentRoute();
  const app = el('app');
  if (!app) return;

  const proceed = await runHooks(path);
  if (!proceed) return;

  const handler = routes.get(path) || notFoundHandler;
  clear(app);
  app.classList.remove('page-enter');
  void app.offsetWidth; // restart animation
  app.classList.add('page-enter');

  try {
    const view = await handler();
    if (view) app.append(view);
  } catch (err) {
    console.error(`Route "${path}" failed:`, err);
    app.append(renderError(err));
  }
  emit('route:change', path);
  window.scrollTo(0, 0);
}

function renderError(err) {
  const div = document.createElement('div');
  div.className = 'container';
  div.innerHTML = `<div class="card" style="margin:2rem 0"><h2>Something went wrong</h2><p class="text-muted">${err.message || 'Unexpected error'}</p></div>`;
  return div;
}

export function initRouter() {
  window.addEventListener('hashchange', render);
  if (!window.location.hash) window.location.hash = '/';
  render();
}
