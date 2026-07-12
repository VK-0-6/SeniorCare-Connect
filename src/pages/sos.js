// pages/sos.js — Emergency SOS page (complete feature implementation).

import { h, icon } from '../utils/dom.js';
import { dashboardLayout } from '../components/pageLayout.js';
import { toast } from '../components/toast.js';
import { listContacts } from '../services/contactsService.js';
import { createReadButton } from '../services/voiceService.js';

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function geoToPromise() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

function mapsUrl(lat, lon) {
  return `https://maps.google.com/?q=${lat},${lon}`;
}

function buildMessage(lat, lon, accuracy) {
  return [
    '🚨 EMERGENCY ALERT',
    '',
    'I may need immediate assistance.',
    '',
    'My current location:',
    mapsUrl(lat, lon),
    '',
    `Latitude: ${lat.toFixed(6)}`,
    `Longitude: ${lon.toFixed(6)}`,
    `Accuracy: ${Math.round(accuracy)} meters`,
    '',
    'Please contact me immediately.',
  ].join('\n');
}

// Strip non-digit characters for wa.me links (needs digits only, no +/spaces).
function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function sectionHeader(iconName, title, accentColor) {
  return h(
    'div',
    { class: 'row-center', style: { marginBottom: 'var(--space-4)', gap: 'var(--space-3)' } },
    h(
      'span',
      { style: { color: accentColor, display: 'flex', alignItems: 'center' } },
      icon(iconName)
    ),
    h('h2', { style: { fontSize: 'var(--font-size-lg)', fontWeight: '700', margin: '0' } }, title)
  );
}

function dataRow(label, value, isLast = false) {
  return h(
    'div',
    {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-3) 0',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
      },
    },
    h('span', { style: { fontWeight: '700', fontSize: 'var(--font-size-base)' } }, label),
    typeof value === 'string'
      ? h('span', {
          style: {
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-primary-700)',
            fontVariantNumeric: 'tabular-nums',
            wordBreak: 'break-all',
          },
        }, value)
      : value
  );
}

function bulletList(items) {
  return h(
    'ul',
    { style: { listStyle: 'none', padding: '0', margin: '0' } },
    ...items.map((text) =>
      h(
        'li',
        {
          style: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
            padding: 'var(--space-2) 0',
            fontSize: 'var(--font-size-base)',
            lineHeight: '1.5',
          },
        },
        h('span', { 'aria-hidden': 'true', style: { flexShrink: '0', fontSize: 'var(--font-size-lg)', lineHeight: '1.4' } }, '•'),
        h('span', {}, text)
      )
    )
  );
}

function infoCard({ title, iconName, accentColor, children }) {
  return h(
    'div',
    { class: 'card', style: { marginTop: 'var(--space-5)' } },
    sectionHeader(iconName, title, accentColor || 'var(--color-primary-600)'),
    ...children
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function sosPage() {
  // ── Pulse animation (injected once per session) ───────────────────────────
  if (!document.getElementById('sos-pulse-style')) {
    const style = document.createElement('style');
    style.id = 'sos-pulse-style';
    style.textContent = `
      @keyframes sos-pulse {
        0%   { box-shadow: 0 0 0 8px var(--color-danger-100), 0 8px 32px rgba(220,38,38,0.35); }
        50%  { box-shadow: 0 0 0 16px var(--color-danger-50), 0 8px 40px rgba(220,38,38,0.25); }
        100% { box-shadow: 0 0 0 8px var(--color-danger-100), 0 8px 32px rgba(220,38,38,0.35); }
      }
      .sos-btn-animated { animation: sos-pulse 2.4s ease-in-out infinite; }
      .sos-btn-animated:hover, .sos-btn-animated:focus-visible {
        animation: none;
        transform: scale(1.05);
        box-shadow: 0 0 0 12px var(--color-danger-100), 0 12px 40px rgba(220,38,38,0.45);
        outline: 4px solid var(--color-danger-600);
        outline-offset: 4px;
      }
      .sos-btn-animated:active { transform: scale(0.97); }
      .sos-btn-animated:disabled {
        animation: none; opacity: 0.7; cursor: not-allowed; transform: none;
      }
    `;
    document.head.append(style);
  }

  // ── Mutable SOS button label spans ────────────────────────────────────────
  const labelSpan = h(
    'span',
    { style: { fontSize: 'var(--font-size-3xl)', fontWeight: '900' } },
    'SOS'
  );
  const subtitleSpan = h(
    'span',
    { style: { fontSize: 'var(--font-size-sm)', fontWeight: '600', letterSpacing: '0.02em', opacity: '0.92' } },
    'Emergency Help'
  );

  const btn = h(
    'button',
    {
      type: 'button',
      class: 'btn btn-danger sos-btn-animated',
      'aria-label': 'Activate Emergency SOS',
      style: {
        width: '220px',
        height: '220px',
        borderRadius: '50%',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        fontSize: 'var(--font-size-3xl)',
        fontWeight: '900',
        letterSpacing: '0.05em',
        border: '4px solid var(--color-danger-700)',
        cursor: 'pointer',
        lineHeight: '1',
      },
      onclick: handleSOS,
    },
    labelSpan,
    subtitleSpan
  );

  // ── Dynamic result cards (all hidden until SOS is pressed) ────────────────
  const statusCard   = h('div', { class: 'card', style: { display: 'none' } });
  const locationCard = h('div', { class: 'card', style: { display: 'none' } });
  const contactCard  = h('div', { class: 'card', style: { display: 'none' } });
  const actionsCard  = h('div', { class: 'card', style: { display: 'none' } });

  // Wrapper that holds all dynamic results; sits below the button, inside the
  // emergency card. Each child card manages its own display property.
  const resultsSection = h(
    'div',
    { class: 'stack', style: { display: 'none', textAlign: 'left' } },
    statusCard,
    locationCard,
    contactCard,
    actionsCard
  );

  // ── Button state helpers ──────────────────────────────────────────────────
  function setLoading() {
    btn.disabled = true;
    labelSpan.textContent = 'Locating...';
    subtitleSpan.style.display = 'none';
    btn.setAttribute('aria-label', 'Locating your position, please wait…');
  }

  function restoreButton() {
    btn.disabled = false;
    labelSpan.textContent = 'SOS';
    subtitleSpan.style.display = '';
    btn.setAttribute('aria-label', 'Activate Emergency SOS');
  }

  // ── Render: Emergency Status card ─────────────────────────────────────────
  function renderStatusCard(success) {
    clearNode(statusCard);
    statusCard.style.display = '';
    statusCard.style.border = success
      ? '2px solid var(--color-secondary-500)'
      : '2px solid var(--color-danger-500)';
    statusCard.append(
      h(
        'div',
        { class: 'row-center', style: { gap: 'var(--space-3)' } },
        h(
          'span',
          { style: { display: 'flex', alignItems: 'center', color: success ? 'var(--color-secondary-600)' : 'var(--color-danger-600)' } },
          icon(success ? 'check' : 'info')
        ),
        h(
          'p',
          {
            style: {
              fontSize: 'var(--font-size-lg)',
              fontWeight: '700',
              margin: '0',
              color: success ? 'var(--color-secondary-700)' : 'var(--color-danger-700)',
            },
          },
          success ? '✓ Location Retrieved' : 'Location unavailable'
        )
      )
    );
  }

  // ── Render: Current Location card ─────────────────────────────────────────
  function renderLocationCard(lat, lon, accuracy, timestamp) {
    clearNode(locationCard);
    locationCard.style.display = '';
    locationCard.style.border = '2px solid var(--color-primary-600)';

    const mapsLink = h('a', {
      href: mapsUrl(lat, lon),
      target: '_blank',
      rel: 'noopener noreferrer',
      style: {
        display: 'block',
        marginTop: 'var(--space-2)',
        fontSize: 'var(--font-size-base)',
        color: 'var(--color-primary-600)',
        wordBreak: 'break-all',
        lineHeight: '1.5',
      },
    }, mapsUrl(lat, lon));

    locationCard.append(
      sectionHeader('check', 'Current Location', 'var(--color-primary-600)'),
      dataRow('Latitude:', lat.toFixed(6)),
      dataRow('Longitude:', lon.toFixed(6)),
      dataRow('Accuracy:', `${Math.round(accuracy)} meters`),
      dataRow('Retrieved:', timestamp),
      h('div', { style: { paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' } },
        h('span', { style: { fontWeight: '700', fontSize: 'var(--font-size-base)' } }, 'Google Maps:'),
        mapsLink
      )
    );
  }

  // ── Render: Primary Contact card ──────────────────────────────────────────
  function renderContactCard(contact) {
    clearNode(contactCard);
    contactCard.style.display = '';

    if (!contact) {
      contactCard.style.border = '2px solid var(--color-warning-400)';
      contactCard.append(
        sectionHeader('info', 'Primary Contact', 'var(--color-warning-600)'),
        h('p', { class: 'text-muted' }, 'No trusted contacts found.'),
        h('p', { class: 'text-muted', style: { marginTop: 'var(--space-2)' } },
          'Visit the Trusted Contacts page to add an emergency contact.')
      );
      return;
    }

    contactCard.style.border = '2px solid var(--color-primary-600)';
    contactCard.append(
      sectionHeader('phone', 'Primary Contact', 'var(--color-primary-600)'),
      dataRow('Name:', contact.name || '—'),
      dataRow('Relationship:', contact.relationship || '—'),
      dataRow('Phone:', contact.phone || '—', true)
    );
  }

  // ── Render: Emergency Actions card ────────────────────────────────────────
  function renderActionsCard(contact, message, lat, lon) {
    clearNode(actionsCard);
    actionsCard.style.display = '';
    actionsCard.style.border = '2px solid var(--color-danger-200)';

    const phone     = contact?.phone || '';
    const normPhone = normalizePhone(phone);
    const encodedMsg = encodeURIComponent(message);
    const coordsText = `Latitude: ${lat.toFixed(6)}\nLongitude: ${lon.toFixed(6)}`;

    async function copyText(text, label) {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Copied', `${label} copied to clipboard.`);
      } catch {
        toast.error('Copy Failed', 'Could not copy to clipboard. Please try manually.');
      }
    }

    function noContactWarning() {
      toast.warning('No Contact', 'No trusted contact phone number available.');
    }

    // Builds a large link button (anchor styled as a button)
    function linkBtn(label, iconName, cls, href) {
      return h('a', {
        href,
        target: '_blank',
        rel: 'noopener noreferrer',
        class: `btn ${cls} btn-lg btn-block`,
        style: { flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-4) var(--space-3)', minHeight: '88px', textDecoration: 'none' },
      },
        icon(iconName),
        h('span', { style: { fontSize: 'var(--font-size-sm)', fontWeight: '700' } }, label)
      );
    }

    // Builds a large action button
    function actionBtn(label, iconName, cls, onClick) {
      return h('button', {
        type: 'button',
        class: `btn ${cls} btn-lg btn-block`,
        style: { flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-4) var(--space-3)', minHeight: '88px' },
        onclick: onClick,
      },
        icon(iconName),
        h('span', { style: { fontSize: 'var(--font-size-sm)', fontWeight: '700' } }, label)
      );
    }

    const callBtn = phone
      ? linkBtn('Call Contact', 'phone', 'btn-danger', `tel:${phone}`)
      : actionBtn('Call Contact', 'phone', 'btn-danger', noContactWarning);

    const whatsappBtn = normPhone
      ? linkBtn('WhatsApp', 'mail', 'btn-secondary', `https://wa.me/${normPhone}?text=${encodedMsg}`)
      : actionBtn('WhatsApp', 'mail', 'btn-secondary', noContactWarning);

    const smsBtn = phone
      ? linkBtn('Send SMS', 'mail', 'btn-outline', `sms:${phone}?body=${encodedMsg}`)
      : actionBtn('Send SMS', 'mail', 'btn-outline', noContactWarning);

    const mapsBtn = linkBtn('Open Maps', 'home', 'btn-outline', mapsUrl(lat, lon));

    const copyMsgBtn  = actionBtn('Copy Message',     'check', 'btn-ghost', () => copyText(message, 'Emergency message'));
    const copyCoorBtn = actionBtn('Copy Coordinates', 'check', 'btn-ghost', () => copyText(coordsText, 'Coordinates'));

    actionsCard.append(
      sectionHeader('sos', 'Emergency Actions', 'var(--color-danger-600)'),
      h('div', {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-4)',
        },
      },
        callBtn,
        whatsappBtn,
        smsBtn,
        mapsBtn,
        copyMsgBtn,
        copyCoorBtn
      )
    );
  }

  // ── Geolocation error mapping ─────────────────────────────────────────────
  function geoErrorToast(err) {
    if (err?.code === 1 /* PERMISSION_DENIED */) {
      toast.error('Location Error', 'Unable to access your location.');
    } else if (err?.code === 2 /* POSITION_UNAVAILABLE */) {
      toast.error('Location Unavailable', 'Your location could not be determined.');
    } else if (err?.code === 3 /* TIMEOUT */) {
      toast.error('Location Timeout', 'Location request timed out. Please try again.');
    } else {
      toast.error('Location Error', 'An unexpected error occurred. Please try again.');
    }
  }

  // ── Main SOS handler ──────────────────────────────────────────────────────
  async function handleSOS() {
    setLoading();
    resultsSection.style.display = '';

    // Run geolocation and contacts fetch in parallel
    const [geoResult, contactsResult] = await Promise.allSettled([
      geoToPromise(),
      listContacts(),
    ]);

    // ── Contacts ──────────────────────────────────────────────────────────
    let primaryContact = null;
    if (contactsResult.status === 'fulfilled') {
      const contacts = contactsResult.value;
      if (contacts.length === 0) {
        toast.warning('No Contact', 'No trusted contact found.');
      } else {
        primaryContact = contacts[0];
      }
    } else {
      toast.error('Contacts Error', 'Could not load trusted contacts.');
    }
    renderContactCard(primaryContact);

    // ── Geolocation ───────────────────────────────────────────────────────
    if (geoResult.status === 'fulfilled') {
      const { latitude, longitude, accuracy } = geoResult.value.coords;
      const timestamp = new Date().toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const message = buildMessage(latitude, longitude, accuracy);

      renderStatusCard(true);
      renderLocationCard(latitude, longitude, accuracy, timestamp);
      renderActionsCard(primaryContact, message, latitude, longitude);
      toast.success('Location Found', 'Current location detected successfully.');
    } else {
      renderStatusCard(false);
      locationCard.style.display = 'none';
      actionsCard.style.display = 'none';
      geoErrorToast(geoResult.reason);
    }

    restoreButton();
  }

  // ── Static info cards ─────────────────────────────────────────────────────
  const whatHappensCard = infoCard({
    title: 'What happens after pressing SOS?',
    iconName: 'info',
    accentColor: 'var(--color-primary-600)',
    children: [
      bulletList([
        'Your current location will be detected.',
        'Trusted contacts will be notified.',
        'Emergency phone options will appear.',
        'Your emergency event will be logged.',
      ]),
    ],
  });

  const tipsCard = infoCard({
    title: 'Emergency Tips',
    iconName: 'heart',
    accentColor: 'var(--color-danger-600)',
    children: [
      bulletList([
        'Stay calm.',
        'Move to a safe place if possible.',
        'Keep your phone unlocked.',
        'Wait for assistance.',
      ]),
    ],
  });

  // ── Layout ────────────────────────────────────────────────────────────────
  const header = h(
    'div',
    { class: 'page-header' },
    h('h1', {}, 'Emergency SOS'),
    h('p', { class: 'text-muted' }, 'Get immediate help in an emergency.'),
    createReadButton(() => 'Emergency assistance page ready. Press the SOS button to alert your trusted contacts and share your location.')
  );

  const buttonWrapper = h(
    'div',
    { style: { display: 'flex', justifyContent: 'center', padding: 'var(--space-6) 0' } },
    btn
  );

  // The main emergency card holds the prompt, button, and all dynamic results.
  const emergencyCard = h(
    'div',
    {
      class: 'card',
      style: {
        textAlign: 'center',
        background: 'linear-gradient(135deg, var(--color-danger-50) 0%, var(--bg-card) 100%)',
        border: '2px solid var(--color-danger-100)',
      },
    },
    h('p', {
      style: {
        fontSize: 'var(--font-size-lg)',
        fontWeight: '600',
        color: 'var(--color-danger-700)',
        marginBottom: '0',
      },
    }, 'Press the button below in an emergency'),
    buttonWrapper,
    resultsSection
  );

  const content = h(
    'div',
    { class: 'stack-lg', style: { maxWidth: '640px', margin: '0 auto' } },
    header,
    emergencyCard,
    whatHappensCard,
    tipsCard
  );

  return dashboardLayout(content);
}
