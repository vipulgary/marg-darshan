/**
 * Pure helpers that turn engine ChartData into what the chart/table/dasha
 * components draw. No React, no DOM — unit-tested in chart-layout.test.ts.
 */
import { type ChartData, type DashaPeriod, PLANET_ORDER, type PlanetKey } from "@/lib/contracts";

export type ChartLang = "hi" | "en";

export const PLANET_ABBR: Record<ChartLang, Record<PlanetKey, string>> = {
  hi: { sun: "सू", moon: "चं", mars: "मं", mercury: "बु", jupiter: "गु", venus: "शु", saturn: "श", rahu: "रा", ketu: "के" },
  en: { sun: "Su", moon: "Mo", mars: "Ma", mercury: "Me", jupiter: "Ju", venus: "Ve", saturn: "Sa", rahu: "Ra", ketu: "Ke" },
};

export const PLANET_NAMES: Record<ChartLang, Record<PlanetKey, string>> = {
  hi: { sun: "सूर्य", moon: "चंद्र", mars: "मंगल", mercury: "बुध", jupiter: "गुरु", venus: "शुक्र", saturn: "शनि", rahu: "राहु", ketu: "केतु" },
  en: { sun: "Sun", moon: "Moon", mars: "Mars", mercury: "Mercury", jupiter: "Jupiter", venus: "Venus", saturn: "Saturn", rahu: "Rahu", ketu: "Ketu" },
};

/** design.md §10 planet colour tokens (charts, dasha). */
export const PLANET_COLORS: Record<PlanetKey, string> = {
  sun: "#F59E0B",
  moon: "#E5E7EB",
  mars: "#EF4444",
  mercury: "#22C55E",
  jupiter: "#FACC15",
  venus: "#F9A8D4",
  saturn: "#6366F1",
  rahu: "#64748B",
  ketu: "#A16207",
};

export const SIGN_NAMES: Record<ChartLang, string[]> = {
  hi: ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"],
  en: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
};

export const SIGN_SHORT: Record<ChartLang, string[]> = {
  hi: SIGN_NAMES.hi,
  en: ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"],
};

export interface ChartPlanet {
  key: PlanetKey;
  abbr: string;
  retrograde: boolean;
  degree: number; // degree within the sign
}

export interface NorthHouse {
  house: number; // 1..12, 1 = Lagna (top diamond)
  sign: number; // 1 = Aries .. 12 = Pisces
  planets: ChartPlanet[];
}

export interface SouthCell {
  sign: number;
  row: number; // 0..3
  col: number; // 0..3
  house: number; // house counted from the Lagna
  isLagna: boolean;
  planets: ChartPlanet[];
}

/** Sign (1..12) that occupies `house` when the Lagna is `lagnaSign`. */
export function signForHouse(lagnaSign: number, house: number): number {
  return ((lagnaSign - 1 + house - 1) % 12) + 1;
}

/** Whole-sign house (1..12) of `sign` from the Lagna. */
export function houseForSign(lagnaSign: number, sign: number): number {
  return ((sign - lagnaSign + 12) % 12) + 1;
}

function planetsBySign(chart: ChartData, lang: ChartLang): Map<number, ChartPlanet[]> {
  const out = new Map<number, ChartPlanet[]>();
  for (const key of PLANET_ORDER) {
    const p = chart.planets[key];
    if (!p) continue;
    const list = out.get(p.sign) ?? [];
    list.push({ key, abbr: PLANET_ABBR[lang][key], retrograde: Boolean(p.retrograde), degree: p.degree_in_sign });
    out.set(p.sign, list);
  }
  return out;
}

/** North Indian (diamond) chart: houses are fixed, signs rotate with the Lagna. */
export function northIndianHouses(chart: ChartData, lang: ChartLang = "en"): NorthHouse[] {
  const lagna = chart.ascendant.sign;
  const bySign = planetsBySign(chart, lang);
  return Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const sign = signForHouse(lagna, house);
    return { house, sign, planets: bySign.get(sign) ?? [] };
  });
}

/**
 * Standard South Indian grid: signs are fixed, Pisces top-left, running clockwise
 * (Pisces, Aries, Taurus, Gemini across the top; Cancer, Leo down the right…).
 */
export const SOUTH_GRID: Record<number, { row: number; col: number }> = {
  12: { row: 0, col: 0 },
  1: { row: 0, col: 1 },
  2: { row: 0, col: 2 },
  3: { row: 0, col: 3 },
  4: { row: 1, col: 3 },
  5: { row: 2, col: 3 },
  6: { row: 3, col: 3 },
  7: { row: 3, col: 2 },
  8: { row: 3, col: 1 },
  9: { row: 3, col: 0 },
  10: { row: 2, col: 0 },
  11: { row: 1, col: 0 },
};

export function southIndianCells(chart: ChartData, lang: ChartLang = "en"): SouthCell[] {
  const lagna = chart.ascendant.sign;
  const bySign = planetsBySign(chart, lang);
  return Array.from({ length: 12 }, (_, i) => {
    const sign = i + 1;
    return {
      sign,
      ...SOUTH_GRID[sign],
      house: houseForSign(lagna, sign),
      isLagna: sign === lagna,
      planets: bySign.get(sign) ?? [],
    };
  });
}

/** 12.5833 → { deg: 12, min: 35 } (minutes truncated, never 60). */
export function toDegMin(degree: number): { deg: number; min: number } {
  const d = Math.floor(degree);
  const m = Math.min(59, Math.floor((degree - d) * 60 + 1e-9));
  return { deg: d, min: m };
}

export function formatDegMin(degree: number): string {
  const { deg, min } = toDegMin(degree);
  return `${deg}° ${String(min).padStart(2, "0")}′`;
}

const DAY_MS = 86_400_000;

function dayValue(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function percentBetween(start: string, end: string, now: number): number {
  const s = dayValue(start);
  const e = dayValue(end);
  if (e <= s) return 100;
  return Math.min(100, Math.max(0, ((now - s) / (e - s)) * 100));
}

export interface DashaProgress {
  index: number; // index into the vimshottari array
  current: DashaPeriod;
  percent: number; // 0..100 elapsed
  daysLeft: number;
  antardasha: { index: number; period: DashaPeriod; percent: number } | null;
}

/** The running mahadasha (and antardasha when present) at `now`, with elapsed percent. */
export function dashaProgress(vimshottari: DashaPeriod[], now: Date = new Date()): DashaProgress | null {
  const t = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const index = vimshottari.findIndex((d) => dayValue(d.start) <= t && t < dayValue(d.end));
  if (index === -1) return null;
  const current = vimshottari[index];
  const antarIdx = current.antardashas?.findIndex((a) => dayValue(a.start) <= t && t < dayValue(a.end)) ?? -1;
  return {
    index,
    current,
    percent: percentBetween(current.start, current.end, t),
    daysLeft: Math.max(0, Math.round((dayValue(current.end) - t) / DAY_MS)),
    antardasha:
      antarIdx >= 0 && current.antardashas
        ? { index: antarIdx, period: current.antardashas[antarIdx], percent: percentBetween(current.antardashas[antarIdx].start, current.antardashas[antarIdx].end, t) }
        : null,
  };
}

/** Length of a period in years (uses `years` when the engine supplies it). */
export function periodYears(p: DashaPeriod): number {
  if (typeof p.years === "number" && p.years > 0) return p.years;
  return (dayValue(p.end) - dayValue(p.start)) / (DAY_MS * 365.25);
}

/**
 * Mahadashas worth showing on the timeline: one full 120-year cycle from birth,
 * extended if the running period sits beyond it.
 */
export function timelinePeriods(vimshottari: DashaPeriod[], now: Date = new Date()): DashaPeriod[] {
  const running = dashaProgress(vimshottari, now)?.index ?? -1;
  return vimshottari.slice(0, Math.max(9, running + 1));
}

export type ChartDivision = "d1" | "d9";

/** Navamsa longitude within its D9 sign: each 3°20′ pada stretched ×9 onto 30°. */
export function navamsaDegree(longitude: number): number {
  return (((longitude * 9) % 30) + 30) % 30;
}

/**
 * AMX-160 — D9 (Navamsa) view of a chart: Lagna = ascendant.d9_sign, every planet
 * placed by its d9_sign, houses recounted whole-sign from the D9 Lagna. Returns a
 * ChartData so the North/South renderers draw it unchanged.
 */
export function navamsaChart(chart: ChartData): ChartData {
  const lagna = chart.ascendant.d9_sign;
  const planets = {} as ChartData["planets"];
  for (const key of PLANET_ORDER) {
    const p = chart.planets[key];
    if (!p) continue;
    planets[key] = { ...p, sign: p.d9_sign, degree_in_sign: navamsaDegree(p.longitude), house: houseForSign(lagna, p.d9_sign) };
  }
  return {
    ...chart,
    ascendant: { ...chart.ascendant, sign: lagna, degree_in_sign: navamsaDegree(chart.ascendant.longitude) },
    planets,
  };
}

/** The chart to draw for a division. */
export function divisionChart(chart: ChartData, division: ChartDivision): ChartData {
  return division === "d9" ? navamsaChart(chart) : chart;
}

export const northIndianD9Houses = (chart: ChartData, lang: ChartLang = "en") => northIndianHouses(navamsaChart(chart), lang);
export const southIndianD9Cells = (chart: ChartData, lang: ChartLang = "en") => southIndianCells(navamsaChart(chart), lang);

export function parseChartStyle(v: unknown, fallback: "north" | "south" = "north"): "north" | "south" {
  return v === "north" || v === "south" ? v : fallback;
}
