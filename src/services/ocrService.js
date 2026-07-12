// services/ocrService.js — browser-side OCR via Tesseract.js (no backend required).
// Loads Tesseract.js from CDN on first use and caches the worker for the session.

const CDN_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

let _loaded = false;

/** Load Tesseract.js from CDN (once per session). */
async function loadTesseract() {
  if (_loaded) return;
  await new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${CDN_URL}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = CDN_URL;
    s.onload  = resolve;
    s.onerror = () => reject(new Error('Could not load OCR engine. Please check your internet connection.'));
    document.head.append(s);
  });
  _loaded = true;
}

/**
 * Extract plain text from an image file using Tesseract.js.
 *
 * @param {File|Blob|string} image  File object, Blob, or a data URL.
 * @param {(pct: number, status: string) => void} [onProgress]  Optional progress callback.
 * @returns {Promise<string>}  Extracted plain text.
 */
export async function extractText(image, onProgress) {
  await loadTesseract();

  const Tesseract = window.Tesseract;
  if (!Tesseract) throw new Error('OCR engine unavailable. Please refresh and try again.');

  const worker = await Tesseract.createWorker('eng', 1, {
    logger: onProgress
      ? (m) => {
          if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100), 'Reading text…');
          else if (m.status === 'loading language traineddata') onProgress(0, 'Loading language model…');
          else if (m.status === 'initializing api') onProgress(10, 'Initializing OCR…');
        }
      : undefined,
  });

  try {
    const {
      data: { text },
    } = await worker.recognize(image);
    const trimmed = text.trim();
    if (!trimmed) throw new Error('No readable text was found in this image. Please try a clearer photo.');
    return trimmed;
  } finally {
    await worker.terminate();
  }
}
