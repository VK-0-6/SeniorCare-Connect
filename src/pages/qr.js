// pages/qr.js — QR Health Card module (placeholder in Phase 1).

import { placeholderPage } from '../components/placeholderPage.js';

export function qrPage() {
  return placeholderPage({
    title: 'QR Health Card',
    description: 'Generate a QR code from your health profile and scan to share medical info.',
    iconName: 'qr',
    features: [
      'Generate QR code from your health profile',
      'Scan a QR code to view medical information',
      'Future: share your health card with doctors',
    ],
  });
}
