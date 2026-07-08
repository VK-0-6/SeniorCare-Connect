// pages/health.js — Health Profile module (placeholder in Phase 1).

import { placeholderPage } from '../components/placeholderPage.js';

export function healthPage() {
  return placeholderPage({
    title: 'Health Profile',
    description: 'Store your medical details and generate a digital health card.',
    iconName: 'heart',
    features: [
      'Name, age, gender, and blood group',
      'Medical conditions and allergies',
      'Doctor and emergency contact',
      'Insurance information',
      'Generate a shareable digital health card',
    ],
  });
}
