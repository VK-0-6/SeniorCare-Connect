// pages/settings.js — Settings (theme, font size, language, notifications, voice).

import { h, icon } from '../utils/dom.js';
import { dashboardLayout } from '../components/pageLayout.js';
import { getSettings, updateSettings } from '../utils/settings.js';
import toast from '../components/toast.js';
import { signOut } from '../services/authService.js';
import { navigate } from '../router.js';
import { createReadButton } from '../services/voiceService.js';

export function settingsPage() {
  const settings = getSettings();

  const header = h('div', { class: 'page-header' },
    h('div', { class: 'row-center' }, h('div', { class: 'widget-icon' }, icon('settings')), h('h1', {}, 'Settings')),
    h('p', { class: 'text-muted' }, 'Make SeniorCare comfortable for you.'),
    createReadButton(() => 'Settings page. Adjust your theme, font size, and voice preferences here.')
  );

  // Theme
  const themeCard = h('div', { class: 'card' },
    h('h3', {}, 'Appearance'),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label' }, 'Theme'),
      h('div', { class: 'row' },
        themeButton('light', 'Light', settings.theme),
        themeButton('dark', 'Dark', settings.theme)
      )
    ),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label' }, 'Font size'),
      h('div', { class: 'row' },
        fontButton('normal', 'Normal', settings.fontSize),
        fontButton('large', 'Large', settings.fontSize),
        fontButton('xlarge', 'Extra Large', settings.fontSize)
      )
    )
  );

  // Language
  const langCard = h('div', { class: 'card' },
    h('h3', {}, 'Language'),
    h('div', { class: 'form-group' },
      h('label', { class: 'form-label' }, 'Display language'),
      h('div', { class: 'row' },
        langButton('en', 'English', settings.language),
        langButton('te', 'తెలుగు (Telugu)', settings.language, true)
      ),
      h('div', { class: 'form-hint' }, 'Telugu support is coming soon.')
    )
  );

  // Notifications
  const notifCard = h('div', { class: 'card' },
    h('h3', {}, 'Notifications'),
    h('div', { class: 'row-between' },
      h('div', {},
        h('div', { class: 'form-label', style: { marginBottom: '0' } }, 'Medicine reminders'),
        h('div', { class: 'form-hint' }, 'Get notified when it is time to take a medicine.')
      ),
      toggleSwitch(settings.notifications, (checked) => {
        updateSettings({ notifications: checked });
        toast.success('Saved', 'Notification preference updated.');
      })
    )
  );

  // Voice Assistance
  const voiceCard = h('div', { class: 'card' },
    h('h3', {}, 'Voice Assistance'),

    // Enable Voice Commands
    h('div', { class: 'row-between', style: { marginBottom: 'var(--space-5)' } },
      h('div', {},
        h('div', { class: 'form-label', style: { marginBottom: '0' } }, 'Enable Voice Commands'),
        h('div', { class: 'form-hint' }, 'Use the microphone button to navigate by voice.')
      ),
      toggleSwitch(settings.voiceCommands, (checked) => {
        updateSettings({ voiceCommands: checked });
        toast.success('Saved', `Voice commands ${checked ? 'enabled' : 'disabled'}.`);
      })
    ),

    // Enable Voice Reading
    h('div', { class: 'row-between', style: { marginBottom: 'var(--space-5)' } },
      h('div', {},
        h('div', { class: 'form-label', style: { marginBottom: '0' } }, 'Enable Voice Reading'),
        h('div', { class: 'form-hint' }, 'Allow the Read This Page button to speak page summaries.')
      ),
      toggleSwitch(settings.voiceReading, (checked) => {
        updateSettings({ voiceReading: checked });
        toast.success('Saved', `Voice reading ${checked ? 'enabled' : 'disabled'}.`);
      })
    ),

    // Speech Speed
    h('div', { class: 'form-group', style: { marginBottom: '0' } },
      h('label', { class: 'form-label' }, 'Speech Speed'),
      h('div', { class: 'row' },
        speedButton('slow',   'Slow',   settings.speechSpeed),
        speedButton('normal', 'Normal', settings.speechSpeed),
        speedButton('fast',   'Fast',   settings.speechSpeed)
      )
    )
  );

  // Privacy
  const privacyCard = h('div', { class: 'card' },
    h('h3', {}, 'Privacy'),
    h('p', { class: 'text-muted' }, 'Your health data is stored securely and only visible to you. We never share your information without your action.')
  );

  // Sign out
  const signOutCard = h('div', { class: 'card' },
    h('h3', {}, 'Account'),
    h('button', { class: 'btn btn-danger btn-block', onclick: async () => {
      try { await signOut(); toast.success('Signed out'); navigate('/'); }
      catch (err) { toast.error('Sign out failed', err.message); }
    } }, icon('logout'), 'Sign Out')
  );

  const content = h('div', { class: 'stack-lg' },
    header, themeCard, langCard, notifCard, voiceCard, privacyCard, signOutCard
  );
  return dashboardLayout(content);
}

function themeButton(value, label, current) {
  return h('button', {
    class: `btn ${current === value ? 'btn-primary' : 'btn-outline'}`,
    onclick: () => { updateSettings({ theme: value }); toast.success('Saved', `Theme set to ${label}.`); navigate('/settings'); },
  }, label);
}

function fontButton(value, label, current) {
  return h('button', {
    class: `btn ${current === value ? 'btn-primary' : 'btn-outline'}`,
    onclick: () => { updateSettings({ fontSize: value }); toast.success('Saved', `Font size set to ${label}.`); navigate('/settings'); },
  }, label);
}

function speedButton(value, label, current) {
  return h('button', {
    class: `btn ${current === value ? 'btn-primary' : 'btn-outline'}`,
    onclick: () => { updateSettings({ speechSpeed: value }); toast.success('Saved', `Speech speed set to ${label}.`); navigate('/settings'); },
  }, label);
}

function langButton(value, label, current, disabled = false) {
  return h('button', {
    class: `btn ${current === value ? 'btn-primary' : 'btn-outline'}`,
    disabled,
    title: disabled ? 'Coming soon' : '',
  }, label);
}

function toggleSwitch(checked, onChange) {
  const checkbox = h('input', { type: 'checkbox', checked, onchange: (e) => onChange(e.target.checked) });
  checkbox.style.width = '28px';
  checkbox.style.height = '28px';
  checkbox.style.accentColor = 'var(--color-primary-600)';
  return checkbox;
}
