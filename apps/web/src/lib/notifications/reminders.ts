/**
 * Reminder scheduling logic (AMX-092). Sending is done by a cron/worker that is not built yet:
 * it should call dueReminders() every few minutes for upcoming CONFIRMED / PARTIALLY_PAID
 * appointments and send the "reminder" template, logging template `reminder_<kind>` so it is not resent.
 */

export type ReminderKind = "24h" | "1h";

export interface ReminderTime {
  kind: ReminderKind;
  at: Date;
}

const HOUR = 3_600_000;
export const REMINDER_OFFSETS: Record<ReminderKind, number> = { "24h": 24 * HOUR, "1h": HOUR };

/** T-24h and T-1h, keeping only those still in the future. */
export function computeReminderTimes(slotStart: Date, now: Date = new Date()): ReminderTime[] {
  return (Object.keys(REMINDER_OFFSETS) as ReminderKind[])
    .map((kind) => ({ kind, at: new Date(slotStart.getTime() - REMINDER_OFFSETS[kind]) }))
    .filter((r) => r.at.getTime() > now.getTime());
}

/**
 * Reminders that should go out now: their time has passed, the session has not started,
 * and they were not sent yet. When the cron was down and both are overdue, only the
 * closest one (1h) is returned so the client doesn't get two messages at once.
 */
export function dueReminders(slotStart: Date, now: Date, alreadySent: Iterable<ReminderKind> = []): ReminderKind[] {
  if (now.getTime() >= slotStart.getTime()) return [];
  const sent = new Set(alreadySent);
  const due = (Object.keys(REMINDER_OFFSETS) as ReminderKind[]).filter(
    (kind) => !sent.has(kind) && slotStart.getTime() - REMINDER_OFFSETS[kind] <= now.getTime(),
  );
  return due.includes("1h") ? ["1h"] : due;
}

export const reminderTemplate = (kind: ReminderKind) => `reminder_${kind}` as const;

/** Jyotish gets a second pre-read shortly before the session. */
export const PREREAD_REMINDER_OFFSET = 2 * HOUR;
export const PREREAD_TEMPLATE = "jyotish_preread";
export const PREREAD_REMINDER_TEMPLATE = "jyotish_preread_2h";
/** The cron only looks this far ahead. */
export const LOOKAHEAD_MS = 25 * HOUR;
/**
 * Past its time, a reminder stays sendable only this long; a 24h reminder that is 6h+ late
 * (cron outage, late booking) is pointless and the 1h one will follow.
 */
export const REMINDER_GRACE: Record<ReminderKind, number> = { "24h": 6 * HOUR, "1h": HOUR };

export interface ReminderCandidate {
  id: string;
  slotStart: Date;
  /** when the booking was made: reminders scheduled before it are skipped (the confirmation covers them) */
  createdAt?: Date | null;
}

export type DueAction = { appointmentId: string; kind: ReminderKind } | { appointmentId: string; kind: "preread_2h" };

/**
 * Pure selection for the cron. `sent` maps appointment id -> NotificationLog templates already
 * recorded for it. Returns at most one client reminder per appointment plus the Jyotish 2h pre-read.
 */
export function selectDueActions(
  appts: ReminderCandidate[],
  sent: Map<string, Set<string>>,
  now: Date,
): DueAction[] {
  const t = now.getTime();
  const out: DueAction[] = [];
  for (const a of appts) {
    const start = a.slotStart.getTime();
    if (t >= start || start - t > LOOKAHEAD_MS) continue;
    const done = sent.get(a.id) ?? new Set<string>();
    const created = a.createdAt?.getTime() ?? -Infinity;
    const alreadySent = (Object.keys(REMINDER_OFFSETS) as ReminderKind[]).filter((k) => done.has(reminderTemplate(k)));
    const kind = dueReminders(a.slotStart, now, alreadySent).find((k) => {
      const at = start - REMINDER_OFFSETS[k];
      return at >= created && t - at <= REMINDER_GRACE[k];
    });
    // A 1h reminder supersedes an unsent 24h one; never send the 24h after the 1h went out.
    if (kind && !(kind === "24h" && done.has(reminderTemplate("1h")))) out.push({ appointmentId: a.id, kind });
    // Booked inside the 2h window: the confirmation pre-read is fresh enough.
    if (start - t <= PREREAD_REMINDER_OFFSET && created < start - PREREAD_REMINDER_OFFSET && !done.has(PREREAD_REMINDER_TEMPLATE)) {
      out.push({ appointmentId: a.id, kind: "preread_2h" });
    }
  }
  return out;
}
