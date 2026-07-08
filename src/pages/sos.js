// pages/sos.js — Emergency SOS module (placeholder in Phase 1).

import { placeholderPage } from '../components/placeholderPage.js';

export function sosPage() {
  return placeholderPage({
    title: 'Emergency SOS',
    description: 'One tap to alert trusted contacts and share your live location.',
    iconName: 'sos',
    features: [
      'Manage trusted emergency contacts',
      'One-tap emergency call',
      'Share live location with contacts',
      'Send an emergency message (SMS support coming)',
    ],
  });
}
