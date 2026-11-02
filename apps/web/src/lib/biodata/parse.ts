/**
 * AMX-206 — pull details out of a biodata's plain text (Hindi and/or English), with no AI.
 * Works on PDF text, OCR output or text pasted from WhatsApp. Handles "Label : value",
 * "Label - value", "Label – value" and a label on its own line with the value below it.
 * Only returns what is written; anything unclear is left null so the user fills it in.
 */

export interface BiodataFields {
  name: string | null;
  gender: "male" | "female" | null;
  dob: string | null; // YYYY-MM-DD
  tob: string | null; // HH:mm 24h
  place: string | null;
  /** True when the place came from "Native" rather than an explicit birthplace. */
  placeIsNative?: boolean;
  height: string | null;
  education: string | null;
  profession: string | null;
  father?: string | null;
  mother?: string | null;
  grandfather?: string | null;
  residence?: string | null;
  mobile?: string | null;
  email?: string | null;
  complexion?: string | null;
  manglik?: string | null;
  gotra?: string | null;
}

const HINDI_DIGITS = "०१२३४५६७८९";
const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  जनवरी: 1, फरवरी: 2, फ़रवरी: 2, मार्च: 3, अप्रैल: 4, अप्रेल: 4, मई: 5, जून: 6, जुलाई: 7, अगस्त: 8, सितंबर: 9, सितम्बर: 9, अक्टूबर: 10, अक्तूबर: 10, नवंबर: 11, नवम्बर: 11, दिसंबर: 12, दिसम्बर: 12,
};

type Key = Exclude<keyof BiodataFields, "placeIsNative"> | "dobtime" | "native";
// Field labels as they appear in biodatas (matched against the label part, case-insensitive).
const LABELS: [Key, RegExp][] = [
  ["dobtime", /^(?:date\s*(?:and|&)\s*time\s*of\s*birth|जन्म\s*तिथि\s*(?:एवं|व|और|\/)\s*समय)/i],
  ["father", /^(?:father'?’?s?(?:\s*name)?|पिता(?:\s*का\s*नाम|जी)?)$/i],
  ["mother", /^(?:mother'?’?s?(?:\s*name)?|माता(?:\s*का\s*नाम|जी)?)$/i],
  ["grandfather", /^(?:grand\s*father|दादा(?:\s*जी|जी)?|paternal)/i],
  ["name", /^(?:full\s*)?name$|^नाम$|^(?:boy|girl)'?s?\s*name|^(?:लड़के|लड़की)\s*का\s*नाम/i],
  ["gender", /^gender|^sex$|^लिंग/i],
  ["dob", /^(?:d\.?\s*o\.?\s*b\.?|date\s*of\s*birth|birth\s*date|जन्म\s*(?:तिथि|दिनांक|तारीख)|जन्मतिथि)/i],
  ["tob", /^(?:t\.?\s*o\.?\s*b\.?|time\s*of\s*birth|birth\s*time|time$|जन्म\s*(?:समय|का\s*समय)|समय$)/i],
  ["place", /^(?:p\.?\s*o\.?\s*b\.?|place\s*of\s*birth|birth\s*place|जन्म\s*स्थान|जन्मस्थान)/i],
  ["native", /^(?:native(?:\s*place)?|मूल\s*निवास|पैतृक\s*(?:गाँव|स्थान))/i],
  ["residence", /^(?:residential\s*address|residence|address|current\s*(?:address|residence)|निवास|पता|वर्तमान\s*निवास)/i],
  ["height", /^height|^कद|^ऊँचाई|^ऊंचाई|^लंबाई/i],
  ["complexion", /^(?:complexion|colou?r|रंग|वर्ण)/i],
  ["education", /^(?:education|qualification)|^शिक्षा|^योग्यता/i],
  ["profession", /^(?:occupation|profession|job|work|service)|^व्यवसाय|^नौकरी|^पेशा|^कार्य/i],
  ["manglik", /^(?:manglik|mangalik|मांगलिक|मंगली)/i],
  ["gotra", /^(?:gotra|gotras|sakha|गोत्र)/i],
  ["mobile", /^(?:mobile|contact|phone|mob\.?|मोबाइल|संपर्क)/i],
  ["email", /^(?:e-?mail)/i],
];

const toAscii = (s: string) => s.replace(/[०-९]/g, (d) => String(HINDI_DIGITS.indexOf(d)));
const pad = (n: number) => String(n).padStart(2, "0");
/** Section titles like "OFFICE ADDRESS", "FAMILY DETAILS" end a multi-line value. */
const HEADING = /^[A-Z][A-Z &/]{5,}$/;
const RELIGIOUS = /ॐ|नमः|गणेश|श्री\s*गणेशाय|जय\s|भिक्षु|ganesh|namah|shree|om\s/i;

export function parseDate(raw: string): string | null {
  const s = toAscii(raw).toLowerCase().replace(/(\d)\s*(?:st|nd|rd|th)\b/g, "$1");
  let m = s.match(/(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{4}|\d{2})/);
  if (m) {
    const y = m[3].length === 2 ? (Number(m[3]) > 30 ? 1900 : 2000) + Number(m[3]) : Number(m[3]);
    return valid(y, Number(m[2]), Number(m[1]));
  }
  m = s.match(/(\d{4})\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{1,2})/);
  if (m) return valid(Number(m[1]), Number(m[2]), Number(m[3]));
  m = s.match(/(\d{1,2})\s+([a-zऀ-ॿ]+)[,\s]+(\d{4})/);
  if (m) {
    const mon = MONTHS[m[2].slice(0, 3)] ?? MONTHS[m[2]];
    if (mon) return valid(Number(m[3]), mon, Number(m[1]));
  }
  m = s.match(/([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
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

const labelOf = (s: string): Key | null => LABELS.find(([, re]) => re.test(s.trim()))?.[0] ?? null;
const clean = (s: string) => s.replace(/\s+/g, " ").replace(/^[\s:：\-–=|.,]+|[\s,]+$/g, "").trim();

/** Turns the text into (label, value) pairs: same-line separators, or a bare label line followed by its value. */
function pairs(lines: string[]): [Key, string][] {
  const out: [Key, string][] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/^[\s•*>|]+/, "").trim();
    if (!line) continue;
    const m = line.match(/^(.{2,40}?)\s*(?:[:：=|]|\s[-–—]\s|[-–—]\s|\s[-–—])\s*(.+)$/);
    const key = m ? labelOf(m[1]) : null;
    if (m && key) {
      out.push([key, m[2].trim()]);
      continue;
    }
    // A label alone on its line: the value is the next line(s) (addresses can run over two or three).
    const alone = labelOf(line.replace(/[:：\-–]$/, ""));
    if (alone && i + 1 < lines.length && !labelOf(lines[i + 1].split(/[:：\-–]/)[0])) {
      let value = lines[i + 1].trim();
      if (alone === "residence" || alone === "mobile") {
        for (let k = i + 2; k < Math.min(lines.length, i + 5) && !labelOf(lines[k].split(/[:：\-–]/)[0]) && !HEADING.test(lines[k]) && lines[k].length < 60; k++) value += `, ${lines[k].trim()}`;
      }
      out.push([alone, value]);
    }
  }
  return out;
}

/**
 * @param headline the biggest-font text near the top (PDFs) — used as the name when there is no "Name" label.
 */
export function parseBiodata(text: string, headline?: string | null): BiodataFields {
  const f: BiodataFields = { name: null, gender: null, dob: null, tob: null, place: null, height: null, education: null, profession: null };
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let native: string | null = null;
  const timePlace = (v: string) => v.match(/\(([^)]+)\)/)?.[1] ?? null;

  for (const [key, raw] of pairs(lines)) {
    const value = clean(raw);
    if (!value) continue;
    switch (key) {
      case "dobtime":
        f.dob ??= parseDate(value);
        f.tob ??= parseTime(value.replace(/^.*?\d{4}/, ""));
        break;
      case "name":
        f.name ??= value.replace(/[^\p{L}\p{M}\s.]/gu, "").replace(/^(?:mr|ms|mrs|miss|dr|shri|sri|smt|sushri|kumari|kum|श्री|सुश्री|कुमारी|श्रीमती)\.?\s+/i, "").trim().slice(0, 80) || null;
        break;
      case "gender":
        f.gender ??= /female|\bf\b|स्त्री|महिला|लड़की/i.test(value) ? "female" : /male|\bm\b|पुरुष|लड़का/i.test(value) ? "male" : null;
        break;
      case "dob":
        f.dob ??= parseDate(value);
        if (!f.tob && /\d[:.]\d{2}/.test(toAscii(value).replace(/^.*?\d{4}/, ""))) f.tob = parseTime(value.replace(/^.*?\d{4}/, ""));
        break;
      case "tob":
        f.tob ??= parseTime(value);
        f.place ??= timePlace(value);
        break;
      case "place":
        f.place ??= value.slice(0, 120);
        break;
      case "native":
        native ??= value.slice(0, 120);
        break;
      case "mobile": {
        // "Contact details" blocks often mix phone numbers and the address: keep them apart.
        const phones = toAscii(value).match(/(?:\+91[\s-]*)?\b[6-9]\d{9}\b/g);
        if (phones) f.mobile ??= phones.map((p) => p.replace(/\s/g, "")).join(", ");
        const rest = clean(toAscii(value).replace(/(?:\+91[\s-]*)?\b[6-9]\d{9}\b/g, "").replace(/(,\s*){2,}/g, ", "));
        if (rest.length > 6) f.residence ??= rest.slice(0, 160);
        break;
      }
      default:
        if (key in f || ["father", "mother", "grandfather", "residence", "mobile", "email", "complexion", "manglik", "gotra"].includes(key)) {
          const k = key as keyof BiodataFields;
          if (f[k] == null) (f as unknown as Record<string, string>)[k] = value.slice(0, 160);
        }
    }
  }

  // Name: the big heading on PDFs, else the first short ALL-CAPS line that isn't a section title.
  if (!f.name) {
    const cand = headline && !RELIGIOUS.test(headline) ? headline : lines.slice(0, 10).find((l) => /^[A-Z][A-Z .]{3,40}$/.test(l) && l.split(/\s+/).length <= 4 && !/BIO\s*DATA|DETAILS|ABOUT|CONTACT|EDUCATION|FAMILY|HOBB/i.test(l));
    if (cand) f.name = cand.replace(/\s+/g, " ").trim().replace(/\b(\w)(\w*)/g, (_, a: string, b: string) => a + b.toLowerCase());
  }
  if (!f.place && native) {
    f.place = native;
    f.placeIsNative = true;
  }
  // Contacts can sit anywhere.
  const flat = toAscii(text);
  f.residence = f.residence?.replace(/,\s*,/g, ",") ?? null;
  f.mobile ??= flat.match(/(?:\+91[\s-]*)?\b[6-9]\d{9}\b/)?.[0]?.replace(/\s/g, "") ?? null;
  f.email ??= text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] ?? null;
  if (f.mobile && !/\d{10}/.test(f.mobile.replace(/\D/g, "").slice(-10))) f.mobile = null;
  return f;
}
