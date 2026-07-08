// pages/contact.js — Contact page.

import { h, icon } from '../utils/dom.js';
import { pageLayout } from '../components/pageLayout.js';
import { field } from '../components/formField.js';
import toast from '../components/toast.js';

export function contactPage() {
  const content = h('div', { class: 'stack-lg' },
    h('div', { class: 'page-header' },
      h('h1', {}, 'Contact us'),
      h('p', { class: 'text-muted' }, 'We are here to help. Send us a message and we will get back to you.')
    ),
    h('div', { class: 'card', style: { maxWidth: '560px' } },
      h('form', { class: 'stack', onsubmit: (e) => {
        e.preventDefault();
        toast.success('Message sent', 'Thank you for reaching out. We will reply soon.');
        e.target.reset();
      } },
        field({ label: 'Your name', name: 'name', placeholder: 'Your name', required: true }),
        field({ label: 'Email', name: 'email', type: 'email', placeholder: 'you@example.com', required: true }),
        field({ label: 'Message', name: 'message', type: 'textarea', placeholder: 'How can we help?', required: true }),
        h('button', { class: 'btn btn-primary btn-block btn-lg', type: 'submit' }, 'Send Message')
      )
    ),
    h('div', { class: 'card' },
      h('h3', {}, 'Other ways to reach us'),
      h('ul', { class: 'list' },
        h('li', { class: 'list-item' }, icon('mail'), h('span', {}, 'support@seniorcareconnect.app')),
        h('li', { class: 'list-item' }, icon('info'), h('span', {}, 'Available Monday to Friday, 9am to 6pm'))
      )
    )
  );
  return pageLayout(content);
}
