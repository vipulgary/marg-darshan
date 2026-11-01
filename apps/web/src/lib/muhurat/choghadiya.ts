/**
 * Shubh Samay (daily muhurat) from local sunrise/sunset — classical rules, no birth chart needed.
 *  - Choghadiya: day (sunrise→sunset) and night (sunset→next sunrise) each split into 8 equal parts.
 *    The 7 names cycle Udveg, Char, Labh, Amrit, Kaal, Shubh, Rog; the first day part follows the
 *    weekday lord (+3 per weekday), each day part steps +1, night starts at day-start +5 and steps −2.
 *  - Rahu Kaal / Yamaganda / Gulika: one of the 8 day parts, fixed per weekday.
 *  - Abhijit: the 8th of 15 day muhurtas (around local noon); traditionally avoided on Wednesday.
 */

export type ChoghadiyaName = "udveg" | "char" | "labh" | "amrit" | "kaal" | "shubh" | "rog";
export type Quality = "good" | "neutral" | "avoid";

const CYCLE: ChoghadiyaName[] = ["udveg", "char", "labh", "amrit", "kaal", "shubh", "rog"];

export const QUALITY: Record<ChoghadiyaName, Quality> = {
  amrit: "good",
  shubh: "good",
  labh: "good",
  char: "neutral", // good for travel and movement
  udveg: "avoid",
  kaal: "avoid",
  rog: "avoid",
};

// 1-based day part per weekday (0 = Sunday … 6 = Saturday).
const RAHU = [8, 2, 7, 5, 6, 4, 3];
const YAMAGANDA = [5, 4, 3, 2, 1, 7, 6];
const GULIKA = [7, 6, 5, 4, 3, 2, 1];

export interface Slot {
  name: ChoghadiyaName;
  quality: Quality;
  start: Date;
  end: Date;
  night: boolean;
}

export interface Span {
  start: Date;
  end: Date;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

function parts(start: Date, end: Date): Span[] {
  const len = (end.getTime() - start.getTime()) / 8;
  return Array.from({ length: 8 }, (_, i) => ({ start: new Date(start.getTime() + i * len), end: new Date(start.getTime() + (i + 1) * len) }));
}

/**
 * @param weekday 0 = Sunday … 6 = Saturday (the panchang vara, i.e. the local date of `sunrise`)
 */
export function dayMuhurat(weekday: number, sunrise: Date, sunset: Date, nextSunrise: Date) {
  const dayStart = mod(weekday * 3, 7);
  const nightStart = mod(dayStart + 5, 7);
  const dayParts = parts(sunrise, sunset);
  const nightParts = parts(sunset, nextSunrise);

  const slots: Slot[] = [
    ...dayParts.map((p, i) => ({ ...p, name: CYCLE[mod(dayStart + i, 7)], night: false })),
    ...nightParts.map((p, i) => ({ ...p, name: CYCLE[mod(nightStart - 2 * i, 7)], night: true })),
  ].map((s) => ({ ...s, quality: QUALITY[s.name] }));

  const dayLen = sunset.getTime() - sunrise.getTime();
  const abhijit: Span = {
    start: new Date(sunrise.getTime() + (7 * dayLen) / 15),
    end: new Date(sunrise.getTime() + (8 * dayLen) / 15),
  };

  return {
    slots,
    rahuKaal: dayParts[RAHU[weekday] - 1],
    yamaganda: dayParts[YAMAGANDA[weekday] - 1],
    gulika: dayParts[GULIKA[weekday] - 1],
    abhijit,
    abhijitAvoid: weekday === 3, // Wednesday
  };
}

export type DayMuhurat = ReturnType<typeof dayMuhurat>;

const overlaps = (a: Span, b: Span) => a.start < b.end && b.start < a.end;

/**
 * Earliest moment at or after `from` when a good (or, for travel, neutral) choghadiya runs and
 * Rahu Kaal is not active, keeping the window open for at least `minutes`.
 */
export function nextGoodWindow(m: DayMuhurat, from: Date, opts: { minutes?: number; travel?: boolean } = {}): Span | null {
  const need = (opts.minutes ?? 15) * 60_000;
  const ok = (q: Quality) => q === "good" || (opts.travel === true && q === "neutral");
  for (const s of m.slots) {
    if (!ok(s.quality) || s.end <= from) continue;
    let start = s.start < from ? from : s.start;
    let end = s.end;
    if (overlaps({ start, end }, m.rahuKaal)) {
      // Use the part of the slot outside Rahu Kaal that comes first and is long enough.
      if (m.rahuKaal.start.getTime() - start.getTime() >= need) end = m.rahuKaal.start;
      else start = m.rahuKaal.end > start ? m.rahuKaal.end : start;
    }
    if (end.getTime() - start.getTime() >= need) return { start, end };
  }
  return null;
}

export const currentSlot = (m: DayMuhurat, at: Date) => m.slots.find((s) => s.start <= at && at < s.end) ?? null;
