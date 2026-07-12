// services/reminderNotificationService.js — browser notification reminders for medicines.
// Uses the Notifications API entirely client-side. No backend required.
// Pages must not import this directly — wire it up from main.js after auth.

import { listMedicines, listTodayLogs, isMedicineActiveToday } from './medicinesService.js';
import { getSettings } from '../utils/settings.js';

// ── Constants ─────────────────────────────────────────────────────────────────

/** How often to check for upcoming reminders (ms). */
const CHECK_INTERVAL_MS = 60_000; // 1 minute

/** Notify if the reminder time is within this many minutes in the past (to catch startup). */
const GRACE_WINDOW_BEFORE_MIN = 1;

/** Stop notifying this many minutes after the scheduled time. */
const GRACE_WINDOW_AFTER_MIN = 10;

// ── State ─────────────────────────────────────────────────────────────────────

const _notified = new Set(); // keys: `<medicineId>-<date>-<reminderTime>`
let   _interval = null;

// ── Public API ────────────────────────────────────────────────────────────────

export function isSupported() {
  return 'Notification' in window;
}

export function getPermissionStatus() {
  if (!isSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

/**
 * Ask the browser for notification permission.
 * Safe to call multiple times — skips the request if already granted/denied.
 * @returns {Promise<'granted'|'denied'|'default'|'unsupported'>}
 */
export async function requestPermission() {
  if (!isSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/**
 * Start checking for upcoming medicine reminders every minute.
 * Safe to call multiple times — only starts one interval.
 * Call after the user is authenticated.
 */
export function startReminderCheck() {
  if (!isSupported()) return;
  if (_interval) return; // already running

  _runCheck(); // immediate first check
  _interval = setInterval(_runCheck, CHECK_INTERVAL_MS);
}

/** Stop the reminder checking interval. Call on sign-out. */
export function stopReminderCheck() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function _runCheck() {
  // Respect the user's notification setting
  const { notifications } = getSettings();
  if (!notifications) return;

  if (!isSupported() || Notification.permission !== 'granted') return;

  let medicines, todayLogs;
  try {
    [medicines, todayLogs] = await Promise.all([listMedicines(), listTodayLogs()]);
  } catch {
    return; // silently skip on network failure
  }

  const takenIds = new Set(
    todayLogs.filter((l) => l.status === 'taken').map((l) => l.medicine_id)
  );

  const now = new Date();
  const dateKey = now.toDateString();

  for (const med of medicines) {
    if (!isMedicineActiveToday(med)) continue;
    if (takenIds.has(med.id)) continue;
    if (!med.reminder_time) continue;

    const [hh, mm] = med.reminder_time.split(':').map(Number);
    const scheduled = new Date();
    scheduled.setHours(hh, mm, 0, 0);

    const diffMin = (now - scheduled) / 60_000;

    // Fire only within the grace window around the scheduled time
    if (diffMin < -GRACE_WINDOW_BEFORE_MIN || diffMin > GRACE_WINDOW_AFTER_MIN) continue;

    const key = `${med.id}-${dateKey}-${med.reminder_time}`;
    if (_notified.has(key)) continue;

    _notified.add(key);
    _showNotification(med);
  }
}

function _showNotification(med) {
  const body = [
    `Time to take ${med.name}`,
    med.dosage ? `Dosage: ${med.dosage}` : '',
    med.notes  ? med.notes : '',
  ].filter(Boolean).join('\n');

  let notif;
  try {
    notif = new Notification('💊 Medicine Reminder', {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `scc-medicine-${med.id}`,      // collapses duplicate notifications
      requireInteraction: true,           // stays visible until user interacts
      silent: false,
    });
  } catch {
    return; // some browsers throw in certain contexts (e.g. insecure origins)
  }

  notif.onclick = () => {
    window.focus();
    // Navigate to medicines page so user can mark as taken
    window.location.hash = '/medicines';
    notif.close();
  };

  notif.onerror = () => { /* swallow */ };
}
