// services/medicinesService.js — CRUD + reminder logs for medicines.
// All queries are scoped to the authenticated user via RLS (user_id defaults to auth.uid()).

import { supabase } from './supabaseClient.js';

const TABLE = 'medicines';
const LOGS = 'reminder_logs';

// ── CRUD ──────────────────────────────────────────────

export async function listMedicines() {
  const { data, error } = await supabase.from(TABLE).select('*').order('reminder_time', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getMedicine(id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createMedicine(medicine) {
  const { data, error } = await supabase.from(TABLE).insert(medicine).select().single();
  if (error) throw error;
  return data;
}

export async function updateMedicine(id, patch) {
  const { data, error } = await supabase.from(TABLE).update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMedicine(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

// ── Duplicate check ───────────────────────────────────

export async function findDuplicate(name, reminderTime, excludeId = null) {
  let query = supabase
    .from(TABLE)
    .select('id, name, reminder_time')
    .ilike('name', name.trim())
    .eq('reminder_time', reminderTime);
  if (excludeId) query = query.neq('id', excludeId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

// ── Reminder logs ─────────────────────────────────────

export async function listReminderLogs(medicineId = null, limit = 100) {
  let query = supabase
    .from(LOGS)
    .select('*, medicines(name, dosage)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (medicineId) query = query.eq('medicine_id', medicineId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function markTaken(medicineId, scheduledTime = null, takenAt = new Date().toISOString()) {
  const { data, error } = await supabase
    .from(LOGS)
    .insert({
      medicine_id: medicineId,
      taken_at: takenAt,
      scheduled_time: scheduledTime,
      status: 'taken',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listTodayLogs() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from(LOGS)
    .select('medicine_id, status, taken_at, scheduled_time')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());
  if (error) throw error;
  return data || [];
}

// ── Time-of-day helpers ───────────────────────────────

export function timeOfDay(timeStr) {
  if (!timeStr) return 'all';
  const hour = parseInt(timeStr.split(':')[0], 10);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

export function isMedicineActiveToday(med) {
  if (!med.active) return false;
  const today = new Date();
  if (med.start_date) {
    const start = new Date(med.start_date);
    start.setHours(0, 0, 0, 0);
    if (today < start) return false;
  }
  if (med.end_date) {
    const end = new Date(med.end_date);
    end.setHours(23, 59, 59, 999);
    if (today > end) return false;
  }
  return true;
}

export function isMissed(med, takenLog) {
  if (takenLog) return false;
  if (!isMedicineActiveToday(med)) return false;
  const now = new Date();
  const [h, m] = (med.reminder_time || '').split(':').map(Number);
  const scheduled = new Date();
  scheduled.setHours(h || 0, m || 0, 0, 0);
  return now > scheduled;
}

export function isUpcoming(med, takenLog) {
  if (takenLog) return false;
  if (!isMedicineActiveToday(med)) return false;
  const now = new Date();
  const [h, m] = (med.reminder_time || '').split(':').map(Number);
  const scheduled = new Date();
  scheduled.setHours(h || 0, m || 0, 0, 0);
  return now <= scheduled;
}
