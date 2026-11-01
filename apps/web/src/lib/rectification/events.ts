/** Dated life events used to rectify a birth time (Final Plan §4.3, engine rectify.py). */
export const LIFE_EVENT_TYPES = [
  "marriage",
  "first_child",
  "job_start",
  "job_change",
  "business_start",
  "illness_surgery",
  "accident",
  "relocation_abroad",
  "father_passing",
  "mother_passing",
  "education_milestone",
] as const;

export type LifeEventType = (typeof LIFE_EVENT_TYPES)[number];

export const MIN_LIFE_EVENTS = 3;
export const MAX_LIFE_EVENTS = 6;

export interface LifeEventInput {
  type: string;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface LifeEvent {
  type: LifeEventType;
  date: string;
  note?: string;
}

export type EventFieldError = "typeRequired" | "dateRequired" | "dateInvalid" | "beforeBirth" | "inFuture";
export type EventCountError = "tooFew" | "tooMany";

export interface LifeEventsResult {
  ok: boolean;
  /** one entry per input row; null = row is fine or was blank and skipped */
  rowErrors: ({ type?: EventFieldError; date?: EventFieldError } | null)[];
  countError?: EventCountError;
  /** valid, non-blank rows sorted by date (ties keep input order) */
  events: LifeEvent[];
}

/** Strict YYYY-MM-DD that is a real calendar date. */
export function isIsoDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

/** Today's date in India (the business runs on IST, fixed +05:30). */
export function todayIST(now: Date = new Date()): string {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

const isBlank = (e: LifeEventInput) => !e.type && !e.date && !e.note?.trim();

export function sortLifeEvents<T extends { date: string }>(events: readonly T[]): T[] {
  return events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (a.e.date === b.e.date ? a.i - b.i : a.e.date < b.e.date ? -1 : 1))
    .map(({ e }) => e);
}

/**
 * Validates a life-event repeater. Fully blank rows are ignored; every other row needs a
 * known type and a real date that is after the date of birth (when known) and not in the future.
 */
export function validateLifeEvents(
  rows: readonly LifeEventInput[],
  opts: { dob?: string | null; today: string; min?: number; max?: number },
): LifeEventsResult {
  const min = opts.min ?? MIN_LIFE_EVENTS;
  const max = opts.max ?? MAX_LIFE_EVENTS;
  const dob = opts.dob && isIsoDate(opts.dob) ? opts.dob : null;
  const rowErrors: LifeEventsResult["rowErrors"] = [];
  const valid: LifeEvent[] = [];
  let filled = 0;

  for (const row of rows) {
    if (isBlank(row)) {
      rowErrors.push(null);
      continue;
    }
    filled++;
    const err: { type?: EventFieldError; date?: EventFieldError } = {};
    if (!(LIFE_EVENT_TYPES as readonly string[]).includes(row.type)) err.type = "typeRequired";
    if (!row.date) err.date = "dateRequired";
    else if (!isIsoDate(row.date)) err.date = "dateInvalid";
    else if (dob && row.date <= dob) err.date = "beforeBirth";
    else if (row.date > opts.today) err.date = "inFuture";

    if (err.type || err.date) rowErrors.push(err);
    else {
      rowErrors.push(null);
      const note = row.note?.trim();
      valid.push({ type: row.type as LifeEventType, date: row.date, ...(note ? { note } : {}) });
    }
  }

  const countError: EventCountError | undefined = filled > max ? "tooMany" : filled < min ? "tooFew" : undefined;
  const ok = !countError && rowErrors.every((e) => e === null);
  return { ok, rowErrors, countError, events: sortLifeEvents(valid) };
}
