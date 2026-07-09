// services/healthService.js — health profile (one row per user).
// Extends the existing getProfile / upsertProfile with helpers for the full module.

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

// ── Helpers ───────────────────────────────────────────

// Auto-calculate age from date_of_birth. Returns null if no DOB.
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : null;
}

// Convert a comma-separated string from a text input into a clean text[] for the DB.
export function parseList(value) {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Convert a text[] from the DB back into a comma-separated string for display in inputs.
export function listToString(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return '';
  return arr.join(', ');
}
