/**
 * AMX-206 — pull birth details out of a biodata's plain text (Hindi and/or English), with no AI.
 * Works on PDF text, OCR output or text pasted from WhatsApp. Only returns what is written;
 * anything unclear is left null so the user fills it in.
 */

export interface BiodataFields {
  name: string | null;
  gender: "male" | "female" | null;
  dob: string | null; // YYYY-MM-DD
  tob: string | null; // HH:mm 24h
  place: string | null;
  height: string | null;
  education: string | null;
  profession: string | null;
}

const HINDI_DIGITS = "०१२३४५६७८९";
const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  जनवरी: 1, फरवरी: 2, फ़रवरी: 2, मार्च: 3, अप्रैल: 4, अप्रेल: 4, मई: 5, जून: 6, जुलाई: 7, अगस्त: 8, सितंबर: 9, सितम्बर: 9, अक्टूबर: 10, अक्तूबर: 10, नवंबर: 11, नवम्बर: 11, दिसंबर: 12, दिसम्बर: 12,
};

// Field labels as they appear in biodatas. Each line "Label : value" (or "Label - value").
const LABELS: Record<keyof BiodataFields | "dobtime", RegExp> = {
  name: /^(?:full\s*)?name|^नाम/i,
  gender: /^gender|^sex|^लिंग/i,
  dobtime: /^(?:date\s*(?:and|&)\s*time\s*of\s*birth|जन्म\s*तिथि\s*(?:एवं|व|और)\s*समय)/i,
  dob: /^(?:d\.?o\.?b|date\s*of\s*birth|birth\s*date|जन्म\s*(?:तिथि|दिनांक|तारीख)|जन्मतिथि)/i,
  tob: /^(?:t\.?o\.?b|time\s*of\s*birth|birth\s*time|जन्म\s*(?:समय|का\s*समय))/i,
  place: /^(?:p\.?o\.?b|place\s*of\s*birth|birth\s*place|जन्म\s*स्थान|जन्मस्थान)/i,
  height: /^height|^कद|^ऊँचाई|^ऊंचाई|^लंबाई/i,
  education: /^(?:education|qualification)|^शिक्षा|^योग्यता/i,
  profession: /^(?:occupation|profession|job|work)|^व्यवसाय|^नौकरी|^पेशा|^कार्य/i,
};

const toAscii = (s: string) => s.replace(/[०-९]/g, (d) => String(HINDI_DIGITS.indexOf(d)));
const pad = (n: number) => String(n).padStart(2, "0");

export function parseDate(raw: string): string | null {
  const s = toAscii(raw).toLowerCase();
  let m = s.match(/(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{4}|\d{2})/);
  if (m) {
    const y = m[3].length === 2 ? (Number(m[3]) > 30 ? 1900 : 2000) + Number(m[3]) : Number(m[3]);
    return valid(y, Number(m[2]), Number(m[1]));
  }
  m = s.match(/(\d{4})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{1,2})/);
  if (m) return valid(Number(m[1]), Number(m[2]), Number(m[3]));
  m = s.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-zऀ-ॿ]+)[,\s]+(\d{4})/);
  if (m) {
    const mon = MONTHS[m[2].slice(0, 3)] ?? MONTHS[m[2]];
    if (mon) return valid(Number(m[3]), mon, Number(m[1]));
  }
  m = s.match(/([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/);
  if (m && MONTHS[m[1].slice(0, 3)]) return valid(Number(m[3]), MONTHS[m[1].slice(0, 3)], Number(m[2]));
  return null;
}

function valid(y: number, mo: number, d: number): string | null {
  if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCMonth() === mo - 1 ? `${y}-${pad(mo)}-${pad(d)}` : null;
}

export function parseTime(raw: string): string | null {
  const s = toAscii(raw).toLowerCase();
  const m = s.match(/(\d{1,2})\s*[:.]\s*(\d{2})(?:\s*[:.]\s*\d{2})?\s*(a\.?\s*m\.?|p\.?\s*m\.?)?/);
  const bare = !m ? s.match(/\b(\d{1,2})\s*(a\.?\s*m\.?|p\.?\s*m\.?)/) : null;
  let h: number;
  let min: number;
  let ampm: string | undefined;
  if (m) [h, min, ampm] = [Number(m[1]), Number(m[2]), m[3]];
  else if (bare) [h, min, ampm] = [Number(bare[1]), 0, bare[2]];
  else return null;
  const pm = (ampm && ampm.startsWith("p")) || /शाम|रात|दोपहर|evening|night|afternoon/.test(s);
  const am = (ampm && ampm.startsWith("a")) || /सुबह|प्रातः|प्रात|morning/.test(s);
  if (pm && h < 12 && !(/रात|night/.test(s) && h <= 4)) h += 12;
  if (am && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return `${pad(h)}:${pad(min)}`;
}

/** Splits text into "label : value" pairs, tolerating OCR noise, bullets and Hindi visarga-like colons. */
function pairs(text: string): [string, string][] {
  const out: [string, string][] = [];
  for (const line of text.split(/\r?\n/)) {
    const clean = line.replace(/^[\s•*\-–>|]+/, "").trim();
    const m = clean.match(/^(.{2,40}?)\s*[:：\-–=|]\s*(.+)$/);
    if (m) out.push([m[1].trim(), m[2].trim()]);
  }
  return out;
}

export function parseBiodata(text: string): BiodataFields {
  const f: BiodataFields = { name: null, gender: null, dob: null, tob: null, place: null, height: null, education: null, profession: null };
  for (const [label, value] of pairs(text)) {
    if (LABELS.dobtime.test(label)) {
      f.dob ??= parseDate(value);
      f.tob ??= parseTime(value.replace(/^[^,]*\d{4}/, ""));
      continue;
    }
    if (!f.name && LABELS.name.test(label) && !/father|mother|पिता|माता/i.test(label)) f.name = value.replace(/[^\p{L}\p{M}\s.]/gu, "").trim().slice(0, 80) || null;
    else if (!f.gender && LABELS.gender.test(label)) f.gender = /female|f\b|स्त्री|महिला|लड़की/i.test(value) ? "female" : /male|m\b|पुरुष|लड़का/i.test(value) ? "male" : null;
    else if (!f.dob && LABELS.dob.test(label)) {
      f.dob = parseDate(value);
      f.tob ??= /\d[:.]\d{2}/.test(toAscii(value).replace(/^[^,]*\d{4}/, "")) ? parseTime(value.replace(/^[^,]*\d{4}/, "")) : null;
    } else if (!f.tob && LABELS.tob.test(label)) f.tob = parseTime(value);
    else if (!f.place && LABELS.place.test(label)) f.place = value.replace(/\s+/g, " ").slice(0, 120);
    else if (!f.height && LABELS.height.test(label)) f.height = value.slice(0, 40);
    else if (!f.education && LABELS.education.test(label)) f.education = value.slice(0, 120);
    else if (!f.profession && LABELS.profession.test(label)) f.profession = value.slice(0, 120);
  }
  return f;
}
