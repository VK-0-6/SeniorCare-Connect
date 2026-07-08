// pages/about.js — About page.

import { h, icon } from '../utils/dom.js';
import { pageLayout } from '../components/pageLayout.js';

export function aboutPage() {
  const content = h('div', { class: 'stack-lg' },
    h('div', { class: 'page-header' },
      h('h1', {}, 'About SeniorCare Connect'),
      h('p', { class: 'text-muted' }, 'A simple, safe health companion built for seniors.')
    ),
    h('div', { class: 'card' },
      h('h3', {}, 'Our mission'),
      h('p', { class: 'text-muted' },
        'SeniorCare Connect helps older adults manage their medicines, emergencies, and health information with confidence. ' +
        'We design every screen to be easy to read, easy to tap, and easy to understand — because technology should help, not confuse.'
      )
    ),
    h('div', { class: 'card' },
      h('h3', {}, 'What is included'),
      h('ul', { class: 'list' },
        listItem('Medicine reminders with daily or weekly schedules'),
        listItem('Emergency SOS with trusted contacts and live location'),
        listItem('A digital health profile and shareable QR health card'),
        listItem('An AI medicine reader that explains medicines in plain language'),
        listItem('Voice navigation and reminders for hands-free use')
      )
    ),
    h('div', { class: 'card' },
      h('h3', {}, 'Accessibility'),
      h('p', { class: 'text-muted' },
        'Large fonts, high contrast, and simple navigation are built in. ' +
        'You can increase the font size or switch to dark mode anytime in Settings.'
      )
    )
  );
  return pageLayout(content);
}

function listItem(text) {
  return h('li', { class: 'list-item' }, icon('check'), h('span', {}, text));
}
