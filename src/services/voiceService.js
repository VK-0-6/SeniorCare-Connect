// services/voiceService.js — browser-based voice assistant service.
// Uses Web Speech API only. No external libraries.
// Features: TTS, speech recognition, voice commands, Read This Page button, floating mic FAB.

import { h, icon } from '../utils/dom.js';
import { toast } from '../components/toast.js';
import { navigate } from '../router.js';
import { getSettings } from '../utils/settings.js';
import { signOut } from './authService.js';

// ── Speech Synthesis ─────────────────────────────────────────────────────────

/**
 * Speak text aloud using SpeechSynthesis.
 * Cancels any in-progress speech first to prevent overlapping.
 * Unconditional — callers decide when to invoke based on settings.
 */
export function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  const { speechSpeed } = getSettings();
  utt.rate   = { slow: 0.75, normal: 1.0, fast: 1.5 }[speechSpeed] ?? 1.0;
  utt.pitch  = 1.0;
  utt.volume = 1.0;
  window.speechSynthesis.speak(utt);
}

// ── Speech Recognition ───────────────────────────────────────────────────────

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

export function isSpeechRecognitionSupported() {
  return !!SR;
}

let _recognition = null;
let _listening   = false;

export function isListening() {
  return _listening;
}

/**
 * Start listening for a single voice utterance.
 * @param {{ onResult?: fn, onError?: fn, onEnd?: fn }} opts
 */
export function startListening({ onResult, onError, onEnd } = {}) {
  if (!SR) {
    toast.error('Not Supported', 'Voice recognition is not available in this browser.');
    return;
  }
  if (_listening) return;

  const r = new SR();
  r.continuous      = false;
  r.interimResults  = false;
  r.lang            = 'en-US';

  r.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    onResult?.(transcript);
  };

  r.onerror = (e) => {
    _listening    = false;
    _recognition  = null;
    const code = e.error;
    if (code === 'not-allowed' || code === 'denied') {
      toast.error('Permission Denied', 'Microphone access was denied.');
    } else if (code === 'no-speech') {
      toast.info('No Speech', 'No speech detected. Please try again.');
    } else if (code === 'audio-capture') {
      toast.error('No Microphone', 'No microphone was found on this device.');
    } else if (code === 'aborted') {
      // user-triggered stop — no toast
    } else if (code === 'network') {
      toast.error('Network Error', 'A network error occurred during recognition.');
    } else {
      toast.error('Recognition Error', `Voice error: ${code}`);
    }
    onError?.(code);
  };

  r.onend = () => {
    _listening   = false;
    _recognition = null;
    onEnd?.();
  };

  try {
    r.start();
    _recognition = r;
    _listening   = true;
    toast.info('Listening…', 'Speak a command now.');
  } catch {
    _listening = false;
    toast.error('Microphone Error', 'Could not start voice recognition.');
  }
}

export function stopListening() {
  if (_recognition && _listening) {
    _recognition.abort();
    _recognition = null;
    _listening   = false;
    toast.info('Stopped', 'Stopped listening.');
  }
}

// ── Voice Command Map ─────────────────────────────────────────────────────────

const COMMAND_MAP = [
  { phrases: ['open dashboard', 'go dashboard'],                              label: 'Dashboard',        route: '/dashboard' },
  { phrases: ['open medicines', 'open medicine'],                             label: 'Medicines',        route: '/medicines' },
  { phrases: ['open health profile', 'open health'],                         label: 'Health Profile',   route: '/health'    },
  { phrases: ['open qr', 'open qr card', 'open health card'],                label: 'QR Health Card',   route: '/qr'        },
  { phrases: ['open trusted contacts', 'open contacts', 'open emergency contacts'], label: 'Trusted Contacts', route: '/contacts' },
  { phrases: ['open sos', 'open emergency', 'emergency'],                    label: 'Emergency SOS',    route: '/sos'       },
  { phrases: ['open settings', 'go to settings'],                            label: 'Settings',         route: '/settings'  },
  { phrases: ['go home', 'open home'],                                       label: 'Home',             route: '/'          },
  { phrases: ['logout', 'log out', 'sign out'],                              label: null,               route: null         },
];

/**
 * Match a spoken transcript against COMMAND_MAP and execute the action.
 * Speaks feedback and navigates or acts.
 */
export function processCommand(transcript) {
  if (!transcript || !transcript.trim()) {
    speak("I didn't catch that. Please try again.");
    toast.info('Voice', 'No speech was detected. Please try again.');
    return;
  }
  const t = transcript.toLowerCase().trim().replace(/\s+/g, ' ');

  for (const cmd of COMMAND_MAP) {
    if (cmd.phrases.some((p) => t.includes(p))) {
      if (cmd.route === null) {
        // Logout
        speak('Signing out.');
        signOut().then(() => navigate('/')).catch(() => {});
      } else {
        speak(`Opening ${cmd.label}.`);
        navigate(cmd.route);
      }
      return;
    }
  }

  speak("I didn't understand that command.");
  toast.info('Voice', `Command not recognized: "${transcript}"`);
}

// ── Read This Page Button ─────────────────────────────────────────────────────

/**
 * Create a "🔊 Read This Page" button that speaks a page summary when clicked.
 * Respects the voiceReading user setting.
 *
 * @param {() => string | Promise<string>} getText  Sync or async function returning the text to speak.
 * @returns {HTMLButtonElement}
 */
export function createReadButton(getText) {
  const btn = h(
    'button',
    {
      type: 'button',
      class: 'btn btn-outline',
      'aria-label': 'Read this page aloud',
      style: { gap: 'var(--space-2)', marginTop: 'var(--space-3)' },
      onclick: async () => {
        if (!('speechSynthesis' in window)) {
          toast.error('Not Supported', 'Text-to-speech is not available in this browser.');
          return;
        }
        const { voiceReading } = getSettings();
        if (!voiceReading) {
          toast.info('Voice Reading Disabled', 'Enable voice reading in Settings to use this feature.');
          return;
        }
        btn.disabled = true;
        try {
          const text = typeof getText === 'function' ? await getText() : getText;
          speak(text);
        } catch {
          toast.error('Read Error', 'Could not read page content.');
        } finally {
          btn.disabled = false;
        }
      },
    },
    h('span', { 'aria-hidden': 'true' }, '🔊'),
    ' Read This Page'
  );
  return btn;
}

// ── Floating Mic Button (FAB) ─────────────────────────────────────────────────

/**
 * Create the fixed-position floating microphone button.
 * Returns null when SpeechRecognition is unavailable (browser not supported).
 * Visible on all authenticated pages via dashboardLayout.
 */
export function createMicButton() {
  if (!isSpeechRecognitionSupported()) return null;

  if (!document.getElementById('voice-fab-style')) {
    const style = document.createElement('style');
    style.id = 'voice-fab-style';
    style.textContent = `
      .voice-mic-fab {
        position: fixed;
        bottom: var(--space-6);
        right: var(--space-6);
        z-index: 500;
        width: 68px;
        height: 68px;
        border-radius: 50%;
        background: var(--color-primary-600);
        color: var(--color-white);
        border: 3px solid var(--color-primary-700);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        transition: transform 0.15s, box-shadow 0.15s;
        padding: 0;
      }
      .voice-mic-fab:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 24px rgba(0,0,0,0.25);
      }
      .voice-mic-fab:active { transform: scale(0.95); }
      .voice-mic-fab .icon svg { width: 28px; height: 28px; }
      .voice-mic-fab[aria-pressed="true"] {
        background: var(--color-danger-600);
        border-color: var(--color-danger-700);
        animation: mic-fab-pulse 1.2s ease-in-out infinite;
      }
      @keyframes mic-fab-pulse {
        0%, 100% { box-shadow: 0 0 0 0   rgba(220,38,38,0.45); }
        50%       { box-shadow: 0 0 0 14px rgba(220,38,38,0);   }
      }
    `;
    document.head.append(style);
  }

  const btn = h(
    'button',
    {
      type: 'button',
      class: 'voice-mic-fab',
      'aria-label': 'Start voice command',
      'aria-pressed': 'false',
      title: 'Voice command (speak to navigate)',
      onclick: () => _toggleMic(btn),
    },
    icon('mic')
  );

  return btn;
}

function _toggleMic(btn) {
  if (isListening()) {
    stopListening();
    _setMicState(btn, false);
    return;
  }

  const { voiceCommands } = getSettings();
  if (!voiceCommands) {
    toast.info('Voice Commands', 'Enable voice commands in Settings to use this feature.');
    return;
  }

  startListening({
    onResult: (transcript) => processCommand(transcript),
    onError:  () => _setMicState(btn, false),
    onEnd:    () => _setMicState(btn, false),
  });

  _setMicState(btn, true);
}

function _setMicState(btn, listening) {
  btn.setAttribute('aria-pressed', String(listening));
  btn.setAttribute('aria-label', listening ? 'Stop listening' : 'Start voice command');
}
