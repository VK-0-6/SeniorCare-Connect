// services/contactsService.js — trusted emergency contacts.

import { supabase } from './supabaseClient.js';

const TABLE = 'trusted_contacts';

export async function listContacts() {
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createContact(contact) {
  const { data, error } = await supabase.from(TABLE).insert(contact).select().single();
  if (error) throw error;
  return data;
}

export async function updateContact(id, patch) {
  const { data, error } = await supabase.from(TABLE).update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteContact(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
