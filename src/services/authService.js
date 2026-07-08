// services/authService.js — authentication via Supabase email/password.
// Wraps supabase.auth so UI never imports the client directly.

import { supabase } from './supabaseClient.js';
import { emit } from '../utils/eventBus.js';

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
