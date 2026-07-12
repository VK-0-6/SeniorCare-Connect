// utils/settings.js — user preferences (theme, font size, language).
// Persisted in localStorage; applied to <html> data-attributes so CSS variables react.
// Telugu-ready: language is stored but only English strings ship in Phase 1.

const STORAGE_KEY = 'scc_settings';

const defaults = {
  theme: 'light', // 'light' | 'dark'
  fontSize: 'normal', // 'normal' | 'large' | 'xlarge'
  language: 'en', // 'en' | 'te' (future)
  notifications: true,
  voiceCommands: true,   // floating mic button enabled
  voiceReading: true,    // 'Read This Page' button enabled
  speechSpeed: 'normal', // 'slow' | 'normal' | 'fast'
};

let state = load();

function load() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return { ...defaults };
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage may be unavailable (private mode) — ignore */
  }
}

function apply() {
  const html = document.documentElement;
  html.dataset.theme = state.theme;
  html.dataset.fontSize = state.fontSize;
  html.lang = state.language;
}

export function getSettings() {
  return { ...state };
}

export function updateSettings(patch) {
  state = { ...state, ...patch };
  persist();
  apply();
}

export function initSettings() {
  apply();
}
