/**
 * Hourly slot generation in IST (AMX-076). India has no DST, so IST is a fixed
 * +05:30 offset and plain UTC arithmetic is exact — no tz database needed.
 */
import { SETTINGS } from "@/content/catalog";

export const IST_OFFSET_MIN = 330;
export const SLOT_LEAD_MINUTES = 120;
export const BOOKING_HORIZON_DAYS = 14;

const MIN_MS = 60_000;
const HOUR_MS = 3_600_000;

export interface WorkingHours {
  start: number; // IST hour, inclusive
  end: number; // IST hour, exclusive — sessions must finish by then
  days: number[]; // 0 = Sunday
}

export interface BusyRange {
  start: Date;
  end: Date;
}

export interface Slot {
  start: string; // ISO UTC
  end: string; // ISO UTC (start + duration)
  available: boolean;
}

export interface SlotDay {
  date: string; // IST calendar date, YYYY-MM-DD
  weekday: number; // 0 = Sunday
  closed: boolean;
  slots: Slot[];
  availableCount: number;
}

/** "Hours to hours": a 30-min session still occupies its whole hour, 90 min occupies two. */
export const blocksFor = (durationMin: number) => Math.max(1, Math.ceil(durationMin / 60));

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
}

/** Calendar range a slot blocks (whole hourly blocks). */
export function occupiedRange(start: Date, durationMin: number): BusyRange {
  return { start, end: new Date(start.getTime() + blocksFor(durationMin) * HOUR_MS) };
}

export function istParts(d: Date) {
  const shifted = new Date(d.getTime() + IST_OFFSET_MIN * MIN_MS);
  return {
    date: shifted.toISOString().slice(0, 10),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
    ms: shifted.getUTCMilliseconds(),
    weekday: shifted.getUTCDay(),
  };
}

export const istDateKey = (d: Date) => istParts(d).date;

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const d = new Date(`${key}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === key;
}

export function addDaysKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** The UTC instant of `hour:00` IST on an IST calendar date. */
export function istInstant(key: string, hour: number): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hour) - IST_OFFSET_MIN * MIN_MS);
}

export const weekdayOfKey = (key: string) => new Date(`${key}T00:00:00Z`).getUTCDay();

export interface SlotOptions {
  now?: Date;
  workingHours?: WorkingHours;
  leadMinutes?: number;
  horizonDays?: number;
}

export interface GenerateSlotsInput extends SlotOptions {
  durationMin: number;
  busy: BusyRange[];
  /** first IST date to list (clamped to today) */
  from?: string;
  days?: number;
}

/** Range [from 00:00 IST, from+days 00:00 IST) — what the busy lookup must cover. */
export function slotWindow(from: string, days: number): BusyRange {
  return { start: istInstant(from, 0), end: istInstant(addDaysKey(from, days), 0) };
}

/** Clamp a requested window to [today, today + horizon). */
export function clampWindow(opts: { from?: string; days?: number; now?: Date; horizonDays?: number }) {
  const now = opts.now ?? new Date();
  const horizon = opts.horizonDays ?? BOOKING_HORIZON_DAYS;
  const today = istDateKey(now);
  const last = addDaysKey(today, horizon - 1);
  let from = opts.from && isValidDateKey(opts.from) && opts.from > today ? opts.from : today;
  if (from > last) from = last;
  const maxDays = Math.round((istInstant(last, 0).getTime() - istInstant(from, 0).getTime()) / (24 * HOUR_MS)) + 1;
  const days = Math.min(Math.max(1, Math.floor(opts.days ?? horizon)), maxDays);
  return { from, days };
}

export function generateSlots(input: GenerateSlotsInput): SlotDay[] {
  const now = input.now ?? new Date();
  const wh = input.workingHours ?? SETTINGS.workingHours;
  const lead = input.leadMinutes ?? SLOT_LEAD_MINUTES;
  const { from, days } = clampWindow({ from: input.from, days: input.days, now, horizonDays: input.horizonDays });
  const blocks = blocksFor(input.durationMin);
  const earliest = now.getTime() + lead * MIN_MS;

  const out: SlotDay[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDaysKey(from, i);
    const weekday = weekdayOfKey(date);
    const closed = !wh.days.includes(weekday);
    const slots: Slot[] = [];
    if (!closed) {
      for (let h = wh.start; h + blocks <= wh.end; h++) {
        const start = istInstant(date, h);
        if (start.getTime() < earliest) continue;
        const occ = occupiedRange(start, input.durationMin);
        const available = !input.busy.some((b) => overlaps(occ.start, occ.end, b.start, b.end));
        slots.push({
          start: start.toISOString(),
          end: new Date(start.getTime() + input.durationMin * MIN_MS).toISOString(),
          available,
        });
      }
    }
    out.push({ date, weekday, closed, slots, availableCount: slots.filter((s) => s.available).length });
  }
  return out;
}

/** Server-side guard for a requested slot start (hold API): aligned, inside hours, past the lead time, inside the horizon. */
export function isBookableSlot(start: Date, durationMin: number, opts: SlotOptions = {}): boolean {
  if (Number.isNaN(start.getTime())) return false;
  const now = opts.now ?? new Date();
  const wh = opts.workingHours ?? SETTINGS.workingHours;
  const lead = opts.leadMinutes ?? SLOT_LEAD_MINUTES;
  const horizon = opts.horizonDays ?? BOOKING_HORIZON_DAYS;
  const p = istParts(start);
  if (p.minute !== 0 || p.second !== 0 || p.ms !== 0) return false;
  if (!wh.days.includes(p.weekday)) return false;
  if (p.hour < wh.start || p.hour + blocksFor(durationMin) > wh.end) return false;
  if (start.getTime() < now.getTime() + lead * MIN_MS) return false;
  return p.date <= addDaysKey(istDateKey(now), horizon - 1);
}

/** Namespace for pg_advisory_xact_lock(int, int): one lock per occupied hour (hold + late-capture paths). */
export const SLOT_LOCK_NS = 72_001;

/** Hour indices since the epoch covered by a slot — advisory-lock keys for the hold transaction. */
export function hourKeys(start: Date, durationMin: number): number[] {
  const first = Math.floor(start.getTime() / HOUR_MS);
  return Array.from({ length: blocksFor(durationMin) }, (_, i) => first + i);
}
