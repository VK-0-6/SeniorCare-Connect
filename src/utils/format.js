// utils/format.js — small formatting helpers shared across pages.

// Parse a value that may be a Date, a full ISO/timestamp string, or a bare
// "HH:MM" / "HH:MM:SS" time string.  The last case is how reminder_time is
// stored in the DB; we interpret it relative to today so downstream helpers
// receive a valid Date instead of an Invalid Date.
function parseDateOrTime(value) {
  if (!value) return new Date(NaN);
  if (value instanceof Date) return value;
  if (typeof value === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
    const [h, m, s] = value.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m || 0, s || 0, 0);
    return d;
  }
  return new Date(value);
}

export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(date) {
  const d = parseDateOrTime(date);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function timeFromNow(date) {
  const diff = parseDateOrTime(date).getTime() - Date.now();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `in ${hrs} hr`;
  const days = Math.round(hrs / 24);
  return `in ${days} day${days > 1 ? 's' : ''}`;
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';
}
