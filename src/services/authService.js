// services/authService.js — authentication via Supabase email/password.
// Wraps supabase.auth so UI never imports the client directly.

import { supabase } from './supabaseClient.js';
import { emit } from '../utils/eventBus.js';

// Module-level cache so renderNavbar() (which is synchronous) can read the
// current user without awaiting a network call.
let _cachedUser = null;

// Initialise the cache immediately from the local Supabase session store.
// This is synchronous in Supabase JS v2 when a session is already persisted.
supabase.auth.getSession().then(({ data }) => {
  _cachedUser = data?.session?.user ?? null;
});

// Keep the cache fresh on every auth-state change.
supabase.auth.onAuthStateChange((_event, session) => {
  _cachedUser = session?.user ?? null;
});

// Synchronous read of the cached user — safe to call from render functions.
export function getCachedUser() {
  return _cachedUser;
}

export async function signUp({ email, password }) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  emit('auth:change', data);
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  emit('auth:change', data);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  emit('auth:change', null);
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export function onAuthChange(handler) {
  // Wrap async work to avoid the onAuthStateChange deadlock.
  return supabase.auth.onAuthStateChange((_event, session) => {
    (async () => handler(session))();
  });
}
