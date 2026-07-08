// services/notificationsService.js — notification log + preferences read.

import { supabase } from './supabaseClient.js';

const TABLE = 'notifications';

export async function listNotifications(limit = 20) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function createNotification(notification) {
  const { data, error } = await supabase.from(TABLE).insert(notification).select().single();
  if (error) throw error;
  return data;
}

export async function markRead(id) {
  const { data, error } = await supabase.from(TABLE).update({ read: true }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
