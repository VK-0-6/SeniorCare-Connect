// pages/qr.js — QR Health Card module (full implementation).
// Generates a QR from the user's health profile ID (not personal data),
// renders a digital health card, and supports download + share.

import { h, icon, clear } from '../utils/dom.js';
import { dashboardLayout } from '../components/pageLayout.js';
import { emptyState } from '../components/emptyState.js';
import { spinner } from '../components/spinner.js';
import toast from '../components/toast.js';
import { navigate } from '../router.js';
import { formatDate } from '../utils/format.js';
import { getProfile } from '../services/healthService.js';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';

export async function qrPage() {
  const root = h('div', { class: 'stack-lg' });
  root.append(spinner());

  try {
    const profile = await getProfile();
    clear(root);

    if (!profile) {
      renderEmpty(root);
    } else {
      await renderCard(root, profile);
    }
  } catch (err) {
    clear(root);
    root.append(errorCard(err));
  }

  return dashboardLayout(root);
}

// ── Empty state (no profile) ──────────────────────────

function renderEmpty(root) {
  const header = h('div', { class: 'page-header' },
    h('div', { class: 'row-center' },
      h('div', { class: 'widget-icon' }, icon('qr')),
      h('h1', {}, 'QR Health Card')
    ),
    h('p', { class: 'text-muted' }, 'Generate a scannable QR code from your health profile.')
  );
  root.append(header);

  root.append(emptyState({
    icon: '📋',
    title: 'No health profile found',
    message: 'Create your health profile first to generate a QR health card.',
    action: h('button', { class: 'btn btn-primary btn-lg', onclick: () => navigate('/health') },
      icon('plus'), 'Create Health Profile'),
  }));
}

// ── Health card with QR ──────────────────────────────

async function renderCard(root, profile) {
  const header = h('div', { class: 'page-header' },
    h('div', { class: 'row-between' },
      h('div', {},
        h('div', { class: 'row-center' },
          h('div', { class: 'widget-icon' }, icon('qr')),
          h('h1', {}, 'QR Health Card')
        ),
        h('p', { class: 'text-muted' }, 'Your digital health card, ready to scan and share.')
      )
    )
  );
  root.append(header);

  // Generate QR data — only the profile ID + a verification timestamp.
  // No personal information is embedded in the QR code itself.
  const qrPayload = JSON.stringify({
    pid: profile.id,
    v: 1,
    ts: Date.now(),
  });

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 280,
    margin: 2,
    color: { dark: '#1e293b', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });

  // QR preview section
  root.append(h('div', { class: 'card', style: { textAlign: 'center' } },
    h('h3', {}, 'QR Preview'),
    h('p', { class: 'text-muted' }, 'Scan to verify the health profile ID.'),
    h('div', { style: {
      display: 'flex', justifyContent: 'center', padding: 'var(--space-4)',
    } },
      h('img', {
        src: qrDataUrl,
        alt: 'Health profile QR code',
        style: { width: '280px', height: '280px', borderRadius: 'var(--radius-lg)' },
      })
    ),
    h('div', { class: 'stack', style: { alignItems: 'center' } },
      h('div', { style: { fontSize: 'var(--font-size-lg)', fontWeight: '700' } }, profile.full_name || 'Unknown'),
      h('span', { class: 'badge badge-primary', style: { fontSize: 'var(--font-size-lg)' } }, `Blood: ${profile.blood_group || '—'}`),
      h('span', { class: 'text-muted' }, `Last updated ${formatDate(profile.updated_at)}`)
    )
  ));

  // Digital health card
  const cardRef = h('div', { class: 'card health-card', style: {
    background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  } });

  cardRef.append(
    h('div', { class: 'row-between' },
      h('div', {},
        h('div', { style: { fontSize: 'var(--font-size-sm)', opacity: '0.8' } }, 'SeniorCare Connect'),
        h('div', { style: { fontSize: 'var(--font-size-lg)', fontWeight: '700' } }, 'Health Card')
      ),
      h('div', { class: 'feature-icon-wrap', style: { width: '40px', height: '40px', marginBottom: '0', background: 'rgba(255,255,255,0.2)' } }, icon('heart'))
    ),
    h('div', { style: { fontSize: 'var(--font-size-xl)', fontWeight: '700' } }, profile.full_name || 'Unknown'),
    h('div', { class: 'grid grid-2', style: { gap: 'var(--space-3)' } },
      cardField('Blood Group', profile.blood_group || '—'),
      cardField('Emergency Contact', profile.emergency_contact_name
        ? `${profile.emergency_contact_name}${profile.emergency_contact_phone ? ` · ${profile.emergency_contact_phone}` : ''}`
        : '—'),
      cardField('Profile ID', shortId(profile.id)),
    ),
    h('div', { style: { display: 'flex', justifyContent: 'center', padding: 'var(--space-3)', background: '#fff', borderRadius: 'var(--radius-lg)' } },
      h('img', { src: qrDataUrl, alt: 'QR code', style: { width: '180px', height: '180px' } })
    ),
    h('div', { style: { fontSize: 'var(--font-size-sm)', opacity: '0.7', textAlign: 'center' } },
      `Last updated ${formatDate(profile.updated_at)}`)
  );

  root.append(h('div', {},
    h('h3', { style: { marginBottom: 'var(--space-4)' } }, 'Digital Health Card'),
    cardRef
  ));

  // Action buttons
  root.append(h('div', { class: 'card' },
    h('h3', {}, 'Download & Share'),
    h('p', { class: 'text-muted' }, 'Save your health card as an image or share it directly.'),
    h('div', { class: 'row', style: { flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-4)' } },
      h('button', { class: 'btn btn-primary btn-lg', onclick: () => downloadCard(cardRef, profile) },
        icon('qr'), 'Download as Image'),
      h('button', { class: 'btn btn-secondary btn-lg', onclick: () => downloadQR(qrDataUrl, profile) },
        'Download QR Only'),
      h('button', { class: 'btn btn-outline btn-lg', onclick: () => shareCard(qrDataUrl, profile) },
        'Share')
    )
  ));
}

// ── Card field helper ────────────────────────────────

function cardField(label, value) {
  return h('div', {},
    h('div', { style: { fontSize: 'var(--font-size-sm)', opacity: '0.7', marginBottom: 'var(--space-1)' } }, label),
    h('div', { style: { fontWeight: '700' } }, value)
  );
}

function shortId(id) {
  if (!id) return '—';
  return id.substring(0, 8).toUpperCase();
}

// ── Download ─────────────────────────────────────────

async function downloadCard(cardEl, profile) {
  try {
    // Use html-to-image to avoid tainted-canvas issues from SVG foreignObject.
    // It inlines fonts and images as data URIs so the canvas stays same-origin.
    const dataUrl = await toPng(cardEl, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#ffffff',
    });
    const link = document.createElement('a');
    link.download = `health-card-${(profile.full_name || 'profile').replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = dataUrl;
    link.click();
    toast.success('Downloaded', 'Health card image saved to your device.');
  } catch (err) {
    toast.error('Download failed', err.message || 'Could not generate image.');
  }
}

async function downloadQR(qrDataUrl, profile) {
  try {
    const link = document.createElement('a');
    link.download = `qr-${(profile.full_name || 'profile').replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success('Downloaded', 'QR code image saved to your device.');
  } catch (err) {
    toast.error('Download failed', err.message);
  }
}

// ── Share ────────────────────────────────────────────

async function shareCard(qrDataUrl, profile) {
  const shareText = `Health Card — ${profile.full_name || 'Unknown'} (Blood: ${profile.blood_group || '—'})`;

  // Try the Web Share API with a file if supported
  if (navigator.share) {
    try {
      // Try sharing the QR image as a file
      if (navigator.canShare && (await urlToFile(qrDataUrl, 'health-qr.png'))) {
        const file = await urlToFile(qrDataUrl, 'health-qr.png');
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Health Card',
            text: shareText,
            files: [file],
          });
          return;
        }
      }
      // Fallback: share text only
      await navigator.share({ title: 'Health Card', text: shareText });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return; // user cancelled
      // Fall through to clipboard fallback
    }
  }

  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(shareText);
    toast.success('Copied', 'Health card details copied to clipboard. Paste in any app to share.');
  } catch {
    toast.info('Share not available', 'Copy this manually: ' + shareText);
  }
}

async function urlToFile(dataUrl, filename) {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: 'image/png' });
  } catch {
    return null;
  }
}

// ── Error ────────────────────────────────────────────

function errorCard(err) {
  return h('div', { class: 'card', style: { borderColor: 'var(--color-danger-500)' } },
    h('h3', { style: { color: 'var(--color-danger-600)' } }, 'Could not load QR card'),
    h('p', { class: 'text-muted' }, err.message || 'Please try again.'),
    h('button', { class: 'btn btn-primary', style: { marginTop: 'var(--space-4)' }, onclick: () => navigate('/qr') }, 'Retry')
  );
}
