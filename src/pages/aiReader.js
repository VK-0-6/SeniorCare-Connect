// pages/aiReader.js — AI Medicine Reader module (placeholder in Phase 1).

import { placeholderPage } from '../components/placeholderPage.js';

export function aiReaderPage() {
  return placeholderPage({
    title: 'AI Medicine Reader',
    description: 'Upload or capture a medicine image and hear a simple explanation aloud.',
    iconName: 'ai',
    features: [
      'Upload or capture a medicine image',
      'Extract text with OCR (Tesseract.js)',
      'Send extracted text to Gemini for a simple explanation',
      'Read the explanation aloud with Text-to-Speech',
    ],
  });
}
