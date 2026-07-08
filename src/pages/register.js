// pages/register.js — sign up with email/password.

import { h } from '../utils/dom.js';
import { pageLayout } from '../components/pageLayout.js';
import { field } from '../components/formField.js';
import { spinner } from '../components/spinner.js';
import toast from '../components/toast.js';
import { signUp } from '../services/authService.js';
import { navigate } from '../router.js';
import { isSupabaseConfigured } from '../services/supabaseClient.js';

export function registerPage() {
  const card = h('div', { class: 'card auth-card' });
  card.append(h('h1', { class: 'auth-title' }, 'Create your account'));
  card.append(h('p', { class: 'auth-subtitle' }, 'It only takes a minute to get started'));

  if (!isSupabaseConfigured) {
    card.append(h('div', { class: 'badge badge-warning', style: { marginBottom: 'var(--space-4)' } },
      'Demo mode: Supabase not configured. Sign up is disabled.'
    ));
  }

  const form = h('form', { class: 'stack' });
  const email = field({ label: 'Email', name: 'email', type: 'email', placeholder: 'you@example.com', required: true });
  const password = field({ label: 'Password', name: 'password', type: 'password', placeholder: 'At least 6 characters', required: true, hint: 'Use at least 6 characters.' });
  const confirm = field({ label: 'Confirm Password', name: 'confirm', type: 'password', placeholder: 'Re-enter password', required: true });
  form.append(email.group, password.group, confirm.group);

  const submit = h('button', { class: 'btn btn-primary btn-block btn-lg', type: 'submit' }, 'Create Account');
  form.append(submit);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured) { toast.error('Not configured', 'Supabase env vars are missing.'); return; }
    if (password.control.value !== confirm.control.value) {
      toast.error('Passwords don\'t match', 'Please re-enter the same password.');
      return;
    }
    submit.disabled = true;
    submit.replaceChildren(spinner(false));
    try {
      await signUp({ email: email.control.value.trim(), password: password.control.value });
      toast.success('Account created', 'You are now signed in.');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Sign up failed', err.message);
      submit.disabled = false;
      submit.textContent = 'Create Account';
    }
  });

  card.append(form);
  card.append(h('p', { class: 'auth-alt' },
    'Already have an account? ',
    h('a', { href: '#/login', onclick: (e) => { e.preventDefault(); navigate('/login'); } }, 'Sign in')
  ));

  return pageLayout(h('div', { class: 'auth-wrap' }, card));
}
