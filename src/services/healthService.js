// services/healthService.js — health profile (one row per user).

import { supabase } from './supabaseClient.js';

const TABLE = 'health_profiles';

export async function getProfile() {
  const { data, error } = await supabase.from(TABLE).select('*').maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(profile) {
  // upsert keyed on user_id (unique) — one profile per user.
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(profile, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
