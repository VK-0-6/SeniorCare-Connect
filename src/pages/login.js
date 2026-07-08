// pages/login.js — sign in with email/password.

import { h } from '../utils/dom.js';
import { pageLayout } from '../components/pageLayout.js';
import { field } from '../components/formField.js';
import { spinner } from '../components/spinner.js';
import toast from '../components/toast.js';
import { signIn } from '../services/authService.js';
import { navigate } from '../router.js';
import { isSupabaseConfigured } from '../services/supabaseClient.js';

export function loginPage() {
  const card = h('div', { class: 'card auth-card' });
  card.append(h('h1', { class: 'auth-title' }, 'Welcome back'));
  card.append(h('p', { class: 'auth-subtitle' }, 'Sign in to your SeniorCare account'));

  if (!isSupabaseConfigured) {
    card.append(h('div', { class: 'badge badge-warning', style: { marginBottom: 'var(--space-4)' } },
      'Demo mode: Supabase not configured. Sign in is disabled.'
    ));
  }

  const form = h('form', { class: 'stack' });
  const email = field({ label: 'Email', name: 'email', type: 'email', placeholder: 'you@example.com', required: true });
  const password = field({ label: 'Password', name: 'password', type: 'password', placeholder: 'Your password', required: true });
  form.append(email.group, password.group);

  const submit = h('button', { class: 'btn btn-primary btn-block btn-lg', type: 'submit' }, 'Sign In');
  form.append(submit);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured) { toast.error('Not configured', 'Supabase env vars are missing.'); return; }
    submit.disabled = true;
    submit.replaceChildren(spinner(false));
    try {
      await signIn({ email: email.control.value.trim(), password: password.control.value });
      toast.success('Signed in', 'Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Sign in failed', err.message);
      submit.disabled = false;
      submit.textContent = 'Sign In';
    }
  });

  card.append(form);
  card.append(h('p', { class: 'auth-alt' },
    'New here? ',
    h('a', { href: '#/register', onclick: (e) => { e.preventDefault(); navigate('/register'); } }, 'Create an account')
  ));

  return pageLayout(h('div', { class: 'auth-wrap' }, card));
}
