// pages/aiReader.js — AI Medicine Reader page.
// Lets users upload or capture an image, runs browser-side OCR (Tesseract.js),
// analyses the extracted text with rule-based logic, and reads the result aloud.

import { h, icon, clear } from '../utils/dom.js';
import { dashboardLayout } from '../components/pageLayout.js';
import { emptyState } from '../components/emptyState.js';
import { spinner } from '../components/spinner.js';
import { toast } from '../components/toast.js';
import { extractText } from '../services/ocrService.js';
import { analyzeText } from '../services/aiReaderService.js';
import { createReadButton } from '../services/voiceService.js';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ── Entry point ───────────────────────────────────────────────────────────────

export function aiReaderPage() {
  // ── State ──
  let currentFile    = null;
  let currentAnalysis = null;
  let resultFontSize = 16; // px, local to this results panel
  let ttsState = 'stopped'; // 'stopped' | 'playing' | 'paused'

  // ── Hidden file inputs ──
  const galleryInput = h('input', {
    type: 'file', accept: 'image/jpeg,image/png,image/webp',
    style: { display: 'none' },
    onchange: (e) => handleFile(e.target.files[0]),
  });
  const cameraInput = h('input', {
    type: 'file', accept: 'image/*', capture: 'environment',
    style: { display: 'none' },
    onchange: (e) => handleFile(e.target.files[0]),
  });

  // ── Page header ──
  const header = h('div', { class: 'page-header' },
    h('div', { class: 'row-center' },
      h('div', { class: 'widget-icon' }, icon('ai')),
      h('h1', {}, 'AI Medicine Reader'),
    ),
    h('p', { class: 'text-muted' },
      'Upload or photograph a medicine label, prescription, or medical document. ' +
      'The app reads the text and explains it in plain language.'
    )
  );

  // ── Image preview ──
  const previewImg = h('img', {
    style: {
      display: 'none',
      maxWidth: '100%',
      maxHeight: '320px',
      borderRadius: '8px',
      marginTop: 'var(--space-4)',
      objectFit: 'contain',
      border: 'var(--border)',
    },
    alt: 'Selected medicine image',
  });

  const fileNameLabel = h('p', { class: 'text-muted', style: { display: 'none', marginTop: 'var(--space-2)', fontSize: '0.9em' } });

  const clearBtn = h('button', {
    class: 'btn btn-ghost btn-sm',
    style: { display: 'none', marginTop: 'var(--space-2)' },
    onclick: () => clearSelection(),
  }, '✕ Clear selection');

  // ── Upload card ──
  const uploadCard = h('div', { class: 'card' },
    h('h3', {}, 'Select a Medicine Image'),
    h('p', { class: 'text-muted' }, 'Upload from your gallery or take a photo with your camera.'),
    h('div', { class: 'row', style: { flexWrap: 'wrap', gap: 'var(--space-3)' } },
      h('button', {
        class: 'btn btn-primary btn-lg',
        style: { flex: '1 1 180px' },
        onclick: () => { galleryInput.value = ''; galleryInput.click(); },
      }, '📁 Upload from Gallery'),
      h('button', {
        class: 'btn btn-secondary btn-lg',
        style: { flex: '1 1 180px' },
        onclick: () => { cameraInput.value = ''; cameraInput.click(); },
      }, '📷 Capture with Camera'),
    ),
    previewImg,
    fileNameLabel,
    clearBtn,
  );

  // ── Analyse button ──
  const analyzeBtn = h('button', {
    class: 'btn btn-primary btn-lg btn-block',
    style: { display: 'none' },
    onclick: () => runAnalysis(),
  }, icon('ai'), ' Analyze Image');

  // ── Spinner / progress section ──
  const progressLabel = h('p', {
    class: 'text-muted',
    style: { textAlign: 'center', marginTop: 'var(--space-2)' },
  }, 'Preparing OCR engine…');
  const progressBar = h('div', {
    style: {
      height: '6px', background: 'var(--color-primary-50)',
      borderRadius: '3px', overflow: 'hidden',
      margin: 'var(--space-2) 0',
    },
  });
  const progressFill = h('div', {
    style: {
      height: '100%', width: '0%',
      background: 'var(--color-primary-600)',
      transition: 'width 0.3s',
    },
  });
  progressBar.append(progressFill);
  const spinnerSection = h('div', {
    class: 'card',
    style: { display: 'none', textAlign: 'center', padding: 'var(--space-6)' },
  },
    spinner(false),
    progressLabel,
    progressBar,
  );

  // ── Empty state ──
  const emptySection = emptyState({
    icon: '🔬',
    title: 'No image selected yet',
    message: 'Choose an image above to extract and understand medicine information.',
  });

  // ── Results card (built once analysis succeeds) ──
  const resultsContainer = h('div', { style: { display: 'none' } });

  // ── Full page layout ──
  const root = h('div', { class: 'stack-lg' },
    header,
    galleryInput,
    cameraInput,
    uploadCard,
    analyzeBtn,
    spinnerSection,
    resultsContainer,
    emptySection,
  );

  // ── File handling ──────────────────────────────────────────────────────────

  function handleFile(file) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Unsupported Format', 'Please use a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Image Too Large', 'Maximum allowed size is 10 MB.');
      return;
    }
    currentFile = file;
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewImg.style.display = 'block';
    fileNameLabel.textContent = `${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
    fileNameLabel.style.display = 'block';
    clearBtn.style.display = 'inline-flex';
    analyzeBtn.style.display = 'flex';
    emptySection.style.display = 'none';
    clear(resultsContainer);
    resultsContainer.style.display = 'none';
    currentAnalysis = null;
  }

  function clearSelection() {
    currentFile = null;
    currentAnalysis = null;
    previewImg.src = '';
    previewImg.style.display = 'none';
    fileNameLabel.style.display = 'none';
    clearBtn.style.display = 'none';
    analyzeBtn.style.display = 'none';
    spinnerSection.style.display = 'none';
    clear(resultsContainer);
    resultsContainer.style.display = 'none';
    emptySection.style.display = 'flex';
    stopTts();
    galleryInput.value = '';
    cameraInput.value = '';
  }

  // ── Analysis ───────────────────────────────────────────────────────────────

  async function runAnalysis() {
    if (!currentFile) {
      toast.warning('No Image', 'Please select or capture an image first.');
      return;
    }
    try {
      // Show loading
      analyzeBtn.disabled = true;
      spinnerSection.style.display = 'block';
      emptySection.style.display = 'none';
      clear(resultsContainer);
      resultsContainer.style.display = 'none';
      stopTts();

      const rawText = await extractText(currentFile, (pct, status) => {
        progressFill.style.width = `${pct}%`;
        progressLabel.textContent = status || 'Processing…';
      });

      const analysis = analyzeText(rawText);
      currentAnalysis = analysis;
      spinnerSection.style.display = 'none';
      analyzeBtn.disabled = false;
      progressFill.style.width = '0%';

      // Render results
      const card = buildResultsCard(analysis);
      clear(resultsContainer);
      resultsContainer.append(card);
      resultsContainer.style.display = 'block';
      resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
      spinnerSection.style.display = 'none';
      analyzeBtn.disabled = false;
      progressFill.style.width = '0%';
      toast.error('Analysis Failed', err.message || 'Could not analyse the image. Please try again.');
      emptySection.style.display = 'flex';
    }
  }

  // ── TTS ────────────────────────────────────────────────────────────────────

  let _utterance   = null;
  let _playBtn     = null;
  let _pauseBtn    = null;
  let _resumeBtn   = null;
  let _stopBtn     = null;
  let _voiceSelect = null;

  function getTtsText() {
    return currentAnalysis?.summary || '';
  }

  function populateVoices(sel) {
    const voices = window.speechSynthesis?.getVoices() ?? [];
    const en = voices.filter((v) => v.lang.startsWith('en'));
    const list = en.length ? en : voices;
    clear(sel);
    sel.append(h('option', { value: '' }, 'Default voice'));
    for (const v of list) {
      const opt = document.createElement('option');
      opt.value = v.voiceURI;
      opt.textContent = `${v.name} (${v.lang})`;
      sel.append(opt);
    }
  }

  function setTtsState(state) {
    ttsState = state;
    if (!_playBtn) return;
    _playBtn.style.display   = state === 'stopped'  ? 'inline-flex' : 'none';
    _pauseBtn.style.display  = state === 'playing'  ? 'inline-flex' : 'none';
    _resumeBtn.style.display = state === 'paused'   ? 'inline-flex' : 'none';
    _stopBtn.style.display   = (state !== 'stopped') ? 'inline-flex' : 'none';
  }

  function playTts() {
    if (!('speechSynthesis' in window)) {
      toast.error('Not Supported', 'Text-to-speech is not available in this browser.');
      return;
    }
    const text = getTtsText();
    if (!text) return;
    stopTts();
    _utterance = new SpeechSynthesisUtterance(text);
    _utterance.rate  = 0.9;
    _utterance.pitch = 1.0;
    // Apply chosen voice
    if (_voiceSelect?.value) {
      const voices = window.speechSynthesis.getVoices();
      const voice  = voices.find((v) => v.voiceURI === _voiceSelect.value);
      if (voice) _utterance.voice = voice;
    }
    _utterance.onend = () => { _utterance = null; setTtsState('stopped'); };
    _utterance.onerror = () => { _utterance = null; setTtsState('stopped'); };
    window.speechSynthesis.speak(_utterance);
    setTtsState('playing');
  }

  function pauseTts() {
    if (ttsState === 'playing') {
      window.speechSynthesis.pause();
      setTtsState('paused');
    }
  }

  function resumeTts() {
    if (ttsState === 'paused') {
      window.speechSynthesis.resume();
      setTtsState('playing');
    }
  }

  function stopTts() {
    window.speechSynthesis?.cancel();
    _utterance = null;
    setTtsState('stopped');
  }

  // ── Results card builder ───────────────────────────────────────────────────

  function buildResultsCard(analysis) {
    resultFontSize = 16;

    // ─ Fields table ─
    const FIELDS = [
      { key: 'name',         label: 'Medicine Name'        },
      { key: 'dosage',       label: 'Dosage'               },
      { key: 'strength',     label: 'Strength'             },
      { key: 'frequency',    label: 'Frequency'            },
      { key: 'foodTiming',   label: 'Food Timing'          },
      { key: 'warnings',     label: 'Warnings'             },
      { key: 'expiry',       label: 'Expiry Date'          },
      { key: 'mfgDate',      label: 'Manufacturing Date'   },
      { key: 'instructions', label: 'Prescription Notes'   },
      { key: 'doctorNotes',  label: 'Doctor Notes'         },
    ];

    const fieldsGrid = h('div', { style: { display: 'grid', gap: 'var(--space-3)' } });
    for (const f of FIELDS) {
      const val = analysis[f.key];
      const row = h('div', {
        style: {
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          gap: 'var(--space-3)',
          padding: 'var(--space-3)',
          background: 'var(--surface)',
          borderRadius: '8px',
          alignItems: 'start',
        },
      },
        h('div', { style: { fontWeight: '600', color: 'var(--color-primary-600)', fontSize: '0.9em' } }, f.label),
        h('div', { style: { color: val ? '' : 'var(--text-muted)' } }, val || 'Not detected'),
      );
      fieldsGrid.append(row);
    }

    // ─ Raw OCR text (collapsible) ─
    const rawText = analysis.rawText || '';
    const rawBody = h('pre', {
      style: {
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        fontSize: '0.85em', lineHeight: '1.7',
        background: 'var(--surface)', borderRadius: '6px',
        padding: 'var(--space-4)', maxHeight: '200px', overflowY: 'auto',
        border: 'var(--border)',
      },
    }, rawText);
    const details = h('details', { style: { marginTop: 'var(--space-4)' } },
      h('summary', {
        style: {
          cursor: 'pointer', fontWeight: '600',
          padding: 'var(--space-2) 0',
          userSelect: 'none',
          color: 'var(--color-primary-600)',
        },
      }, '📄 Raw OCR Text'),
      rawBody,
    );

    // ─ Summary box ─
    const summaryText = analysis.summary || '';
    const summaryBox = h('div', {
      style: {
        background: 'var(--color-primary-50)',
        border: '2px solid var(--color-primary-600)',
        borderRadius: '10px',
        padding: 'var(--space-5)',
        lineHeight: '1.8',
        marginTop: 'var(--space-5)',
      },
    },
      h('div', { style: { fontWeight: '700', marginBottom: 'var(--space-2)', fontSize: '1.05em' } }, '✨ Easy Summary'),
      h('p', { style: { margin: 0 } }, summaryText),
    );

    // ─ TTS controls ─
    const voiceSel = h('select', {
      class: 'btn btn-outline btn-sm',
      style: { minWidth: '160px', fontWeight: 'normal' },
    });
    _voiceSelect = voiceSel;
    populateVoices(voiceSel);
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => populateVoices(voiceSel);
    }

    _playBtn   = h('button', { class: 'btn btn-primary',   onclick: playTts   }, '▶ Play');
    _pauseBtn  = h('button', { class: 'btn btn-secondary', onclick: pauseTts,  style: { display: 'none' } }, '⏸ Pause');
    _resumeBtn = h('button', { class: 'btn btn-secondary', onclick: resumeTts, style: { display: 'none' } }, '▶ Resume');
    _stopBtn   = h('button', { class: 'btn btn-outline',   onclick: stopTts,   style: { display: 'none' } }, '⏹ Stop');

    const ttsRow = h('div', {
      class: 'row',
      style: { flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' },
    },
      h('span', { style: { fontWeight: '600', marginRight: 'var(--space-1)' } }, '🔊 Read Aloud:'),
      _playBtn, _pauseBtn, _resumeBtn, _stopBtn,
      voiceSel,
    );

    // ─ Copy / font controls ─
    async function copyToClipboard(text, label) {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Copied', `${label} copied to clipboard.`);
      } catch {
        toast.error('Copy Failed', 'Could not access clipboard.');
      }
    }

    const contentArea = h('div'); // ref for font-size changes
    const accessRow = h('div', {
      class: 'row',
      style: { flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-4)' },
    },
      h('button', { class: 'btn btn-outline btn-sm', onclick: () => copyToClipboard(rawText, 'OCR text') },
        '📋 Copy Text'),
      h('button', { class: 'btn btn-outline btn-sm', onclick: () => copyToClipboard(summaryText, 'Summary') },
        '📋 Copy Summary'),
      h('button', {
        class: 'btn btn-outline btn-sm', title: 'Increase font size',
        onclick: () => { resultFontSize = Math.min(resultFontSize + 2, 28); contentArea.style.fontSize = resultFontSize + 'px'; },
      }, 'A+'),
      h('button', {
        class: 'btn btn-outline btn-sm', title: 'Decrease font size',
        onclick: () => { resultFontSize = Math.max(resultFontSize - 2, 12); contentArea.style.fontSize = resultFontSize + 'px'; },
      }, 'A−'),
    );

    contentArea.append(fieldsGrid, details, summaryBox);

    // ─ Analyse again button ─
    const reanalyzeBtn = h('button', {
      class: 'btn btn-outline',
      style: { marginTop: 'var(--space-4)' },
      onclick: () => runAnalysis(),
    }, '↩ Analyse Again');

    return h('div', { class: 'card' },
      h('div', { class: 'row-between', style: { marginBottom: 'var(--space-4)' } },
        h('h3', { style: { margin: 0 } }, '📋 Analysis Results'),
        reanalyzeBtn,
      ),
      accessRow,
      h('div', { style: { marginTop: 'var(--space-4)' } }, ttsRow),
      h('div', { style: { marginTop: 'var(--space-5)' } }, contentArea),
    );
  }

  return dashboardLayout(root);
}
