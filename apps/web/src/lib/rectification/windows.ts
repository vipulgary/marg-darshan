/**
 * Approximate birth-time windows for rectification (Final Plan §4.3). Times are local
 * clock times at the birthplace, "HH:mm"; "24:00" is allowed as an end-of-day bound.
 */
export const WINDOW_PRESETS = {
  morning: { start: "04:00", end: "10:00" },
  day: { start: "10:00", end: "16:00" },
  evening: { start: "16:00", end: "22:00" },
  night: { start: "22:00", end: "04:00" },
  full: { start: "00:00", end: "24:00" },
} as const;

export type PresetKey = keyof typeof WINDOW_PRESETS;
export type WindowPreset = PresetKey | "custom";
export const WINDOW_PRESET_KEYS = ["morning", "day", "evening", "night", "full", "custom"] as const satisfies readonly WindowPreset[];

export interface TimeWindow {
  start: string;
  end: string;
  startMin: number;
  endMin: number;
  /** window crosses midnight, e.g. 22:00 → 04:00 next day */
  overnight: boolean;
  durationMin: number;
}

const DAY = 24 * 60;

/** "HH:mm" → minutes since midnight; "24:00" → 1440; anything else invalid → null. */
export function parseHHmm(value: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h === 24 && min === 0) return DAY;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function formatHHmm(minutes: number): string {
  const m = ((minutes % DAY) + DAY) % DAY;
  const out = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  return minutes === DAY ? "24:00" : out;
}

/**
 * Resolve a preset (or custom start/end) to a concrete window. A custom window whose end
 * is earlier than its start wraps overnight; identical start and end is rejected.
 */
export function resolveWindow(preset: WindowPreset, custom?: { start?: string; end?: string }): TimeWindow | null {
  const bounds = preset === "custom" ? custom : WINDOW_PRESETS[preset];
  if (!bounds?.start || !bounds.end) return null;
  const startMin = parseHHmm(bounds.start);
  const endMin = parseHHmm(bounds.end);
  if (startMin === null || endMin === null || startMin === DAY) return null;
  if (startMin === endMin) return null;
  const overnight = endMin < startMin;
  const durationMin = overnight ? DAY - startMin + endMin : endMin - startMin;
  return { start: formatHHmm(startMin), end: formatHHmm(endMin), startMin, endMin, overnight, durationMin };
}

/**
 * Postgres TIME(0) value for Prisma (date part ignored). 24:00 is not a valid TIME,
 * so the end-of-day bound is stored as 23:59:59.
 */
export function toDbTime(minutes: number): Date {
  if (minutes >= DAY) return new Date(Date.UTC(1970, 0, 1, 23, 59, 59));
  return new Date(Date.UTC(1970, 0, 1, Math.floor(minutes / 60), minutes % 60, 0));
}
