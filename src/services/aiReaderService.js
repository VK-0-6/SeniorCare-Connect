// services/aiReaderService.js — rule-based medicine text analyser.
// No external AI API. All logic runs in the browser.

// ── Patterns ──────────────────────────────────────────────────────────────────

const DATE_FRAG   = String.raw`\d{1,2}[\/\-]\d{2,4}(?:[\/\-]\d{2,4})?|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\-]\d{4}\b|\d{4}`;
const DOSAGE_RE   = /\b(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|l\b|iu|units?)\b/gi;
const EXPIRY_RE   = new RegExp(
  String.raw`(?:exp(?:iry|ires?)?\.?|use\s+before|best\s+before|expir(?:ation|y)\s+date)[\s:.\-]*\b(${DATE_FRAG})`,
  'i',
);
const MFG_RE      = new RegExp(
  String.raw`(?:mfg\.?|mfd\.?|manufactured(?:\s+(?:on|date))?|man(?:ufacturing)?\.\s*date|date\s+of\s+mfg)[\s:.\-]*\b(${DATE_FRAG})`,
  'i',
);
const FREQUENCY_MAP = [
  { re: /\b(q\.?d\.?|o\.?d\.?|once[\s-](?:a[\s-])?daily|1\s*(?:x|time)[/\s]?day)\b/i, label: 'Once daily' },
  { re: /\b(b\.?d\.?|b\.?i\.?d\.?|twice[\s-](?:a[\s-])?daily|2\s*(?:x|times)[/\s]?day)\b/i, label: 'Twice daily' },
  { re: /\b(t\.?d\.?s\.?|t\.?i\.?d\.?|three\s+times[\s-](?:a[\s-])?day|3\s*(?:x|times)[/\s]?day)\b/i, label: 'Three times daily' },
  { re: /\b(q\.?i\.?d\.?|four\s+times[\s-](?:a[\s-])?day|4\s*(?:x|times)[/\s]?day)\b/i, label: 'Four times daily' },
  { re: /\bevery\s+(\d+)\s+hours?\b/i, dynamic: (m) => `Every ${m[1]} hours` },
  { re: /\b(weekly|once\s+a\s+week)\b/i, label: 'Weekly' },
  { re: /\b(monthly|once\s+a\s+month)\b/i, label: 'Monthly' },
  { re: /\b(as\s+needed|p\.?r\.?n\.?|when\s+required)\b/i, label: 'As needed (PRN)' },
];
const FOOD_MAP = [
  { re: /\b(before\s+(?:meals?|food|eating|dinner|lunch|breakfast))\b/i, label: 'Before meals' },
  { re: /\b(after\s+(?:meals?|food|eating|dinner|lunch|breakfast))\b/i, label: 'After meals' },
  { re: /\bwith\s+(?:meals?|food)\b/i, label: 'With food' },
  { re: /\bon\s+(?:an?\s+)?empty\s+stomach\b/i, label: 'On empty stomach' },
  { re: /\bwith\s+water\b/i, label: 'With water' },
  { re: /\bwith\s+milk\b/i, label: 'With milk' },
  { re: /\bwithout\s+(?:regard\s+to\s+)?food\b/i, label: 'Any time (regardless of food)' },
];
const WARNING_KEYWORDS = [
  'warning', 'caution', 'do not', "don't", 'avoid', 'keep out of reach',
  'not for children', 'side effect', 'allerg', 'consult a', 'stop taking',
  'danger', 'fatal', 'toxic', 'overdose', 'seek medical', 'contraindic',
  'may cause', 'drowsiness', 'dizziness', 'not recommended', 'keep away',
  'store in a cool', 'protect from light', 'do not crush',
];
const INSTRUCTION_RE  = /\b(take|apply|use|administer|instill|insert|inject|as\s+directed|as\s+prescribed|as\s+instructed)\b/i;
const DOCTOR_RE       = /\b(dr\.?|doctor|physician|prescrib(?:ed\s+by|er|ing)|m\.?d\.?)\b/i;
const MEDICINE_NAME_RE = /(?:name|drug|medicine|brand|product|tab(?:let)?|cap(?:sule)?|syrup|inj(?:ection)?|drops?)[\s:.\-]+([A-Za-z][^\n\r,]{2,40})/i;
const STRENGTH_RE     = /(?:strength|concentration|potency|composition)[\s:.\-]+([^\n\r,]{2,50})/i;

// ── Helpers ───────────────────────────────────────────────────────────────────

function firstMatch(text, re) {
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

function matchList(text, map) {
  const hits = [];
  for (const entry of map) {
    const m = text.match(entry.re);
    if (m) hits.push(entry.dynamic ? entry.dynamic(m) : entry.label);
  }
  return hits.length ? hits.join(', ') : null;
}

function extractWarnings(text) {
  const lines = text.split(/[\n\r]+/);
  const hits  = [];
  for (const line of lines) {
    const l = line.toLowerCase();
    if (WARNING_KEYWORDS.some((kw) => l.includes(kw))) hits.push(line.trim());
  }
  return hits.length ? hits.slice(0, 5).join(' | ') : null;
}

function extractInstructions(text) {
  const lines = text.split(/[\n\r]+/);
  const hits  = lines.filter((ln) => INSTRUCTION_RE.test(ln) && ln.trim().length > 8);
  return hits.length ? hits.slice(0, 3).map((l) => l.trim()).join(' ') : null;
}

function extractDoctorNotes(text) {
  const lines = text.split(/[\n\r]+/);
  const hits  = lines.filter((ln) => DOCTOR_RE.test(ln) && ln.trim().length > 4);
  return hits.length ? hits.slice(0, 2).map((l) => l.trim()).join(' | ') : null;
}

function guessMedicineName(text) {
  // 1. Explicit label
  const explicit = firstMatch(text, MEDICINE_NAME_RE);
  if (explicit) return explicit;

  // 2. First non-generic short line with a capitalised word that isn't a date/number
  const lines = text.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (line.length < 3 || line.length > 60) continue;
    if (/^\d/.test(line)) continue;       // starts with digit
    if (/exp|mfg|www|http/i.test(line)) continue;
    if (/^[A-Z]/.test(line)) return line; // title-case line
  }
  return null;
}

function extractDosage(text) {
  DOSAGE_RE.lastIndex = 0;
  const hits = [];
  let m;
  while ((m = DOSAGE_RE.exec(text)) !== null) {
    hits.push(`${m[1]} ${m[2]}`);
  }
  return hits.length ? [...new Set(hits)].slice(0, 4).join(', ') : null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Analyse OCR-extracted text and return a structured result.
 * @param {string} rawText
 * @returns {AnalysisResult}
 */
export function analyzeText(rawText) {
  const text = rawText;

  const name        = guessMedicineName(text);
  const dosage      = extractDosage(text);
  const strength    = firstMatch(text, STRENGTH_RE);
  const frequency   = matchList(text, FREQUENCY_MAP);
  const foodTiming  = matchList(text, FOOD_MAP);
  const warnings    = extractWarnings(text);
  const expiry      = firstMatch(text, EXPIRY_RE);
  const mfgDate     = firstMatch(text, MFG_RE);
  const instructions = extractInstructions(text);
  const doctorNotes = extractDoctorNotes(text);

  const summary = buildSummary({
    name, dosage, strength, frequency, foodTiming, warnings, expiry, mfgDate, instructions,
  });

  return {
    name, dosage, strength, frequency, foodTiming, warnings,
    expiry, mfgDate, instructions, doctorNotes, summary, rawText,
  };
}

function buildSummary({ name, dosage, strength, frequency, foodTiming, warnings, expiry, mfgDate, instructions }) {
  const parts = [];

  if (name)        parts.push(`This medicine is called ${name}.`);
  if (dosage)      parts.push(`The dosage is ${dosage}.`);
  if (strength)    parts.push(`Strength or composition: ${strength}.`);
  if (frequency)   parts.push(`Take it ${frequency}.`);
  if (foodTiming)  parts.push(`Timing with food: ${foodTiming}.`);
  if (instructions) parts.push(`Instructions: ${instructions}.`);
  if (warnings)    parts.push(`Important warnings: ${warnings}.`);
  if (expiry)      parts.push(`Expires: ${expiry}.`);
  if (mfgDate)     parts.push(`Manufactured: ${mfgDate}.`);

  if (parts.length === 0) {
    return 'The text was read but no specific medicine details could be identified. Please try a clearer image or check the raw text below.';
  }
  return parts.join(' ');
}
