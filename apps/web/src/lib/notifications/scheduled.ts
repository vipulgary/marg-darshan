/**
 * Scheduled notifications (AMX-092 reminders, AMX-090 Jyotish pre-read). Selection logic is
 * pure (reminders.ts / preread-content.ts); this file does the DB reads and sends.
 * Idempotency: a NotificationLog row with status "sent" / "logged" for (template, appointment id).
 */
import { db } from "@/lib/db";
import { SETTINGS, getProblem, getService, pick } from "@/content/catalog";
import { logNotification, sendEmail } from "./email";
import { mapsUrl, reminderEmail } from "./templates";
import { jyotishPreReadEmail } from "./preread-content";
import {
  LOOKAHEAD_MS,
  PREREAD_REMINDER_TEMPLATE,
  PREREAD_TEMPLATE,
  reminderTemplate,
  selectDueActions,
  type ReminderKind,
} from "./reminders";

const DONE_STATUSES = ["sent", "logged"];
const ACTIVE = ["CONFIRMED", "PARTIALLY_PAID"] as const;

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const localeUrl = (locale: string, path: string) => `${SITE()}${locale === "en" ? "/en" : ""}${path}`;

function loadAppointment(id: string) {
  return db.appointment.findUnique({
    where: { id },
    include: { client: true, service: true, problem: true, birthProfile: true },
  });
}
type Loaded = NonNullable<Awaited<ReturnType<typeof loadAppointment>>>;

function titles(appt: Loaded, locale: string) {
  const service = getService(appt.service.slug);
  const problem = getProblem(appt.problem.slug);
  return {
    serviceTitle: service ? pick(service.title, locale) : locale === "en" ? appt.service.titleEn : appt.service.titleHi,
    problemTitle: problem ? pick(problem.title, locale) : locale === "en" ? appt.problem.titleEn : appt.problem.titleHi,
  };
}

async function alreadyDone(template: string, appointmentId: string): Promise<boolean> {
  const row = await db.notificationLog.findFirst({
    where: { template, entityId: appointmentId, channel: "EMAIL", status: { in: DONE_STATUSES } },
    select: { id: true },
  });
  return Boolean(row);
}

async function latestKundali(appt: Loaded) {
  const where = appt.birthProfileId
    ? { birthProfileId: appt.birthProfileId }
    : { birthProfile: { clientId: appt.clientId } };
  return db.horoscope.findFirst({
    where: { ...where, status: "DONE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, pdfUrl: true },
  });
}

/**
 * Sends the Jyotish a briefing on the booking (English). `reminder` = the T-2h resend.
 * Skipped with a log when JYOTISH_EMAIL is unset.
 */
export async function sendJyotishPreRead(appointmentId: string, opts: { reminder?: boolean } = {}): Promise<boolean> {
  const to = process.env.JYOTISH_EMAIL;
  if (!to) {
    console.warn(`[preread] JYOTISH_EMAIL not set - skipped ${appointmentId}`);
    return false;
  }
  if (!process.env.DATABASE_URL) return false;
  const template = opts.reminder ? PREREAD_REMINDER_TEMPLATE : PREREAD_TEMPLATE;
  if (await alreadyDone(template, appointmentId)) return false;

  const appt = await loadAppointment(appointmentId);
  if (!appt || !(ACTIVE as readonly string[]).includes(appt.status)) return false;
  const kundali = await latestKundali(appt);
  const { serviceTitle, problemTitle } = titles(appt, "en");
  const b = appt.birthProfile;

  const content = jyotishPreReadEmail({
    appointmentId: appt.id,
    reminder: opts.reminder,
    client: { name: appt.client.fullName, email: appt.client.email, phone: appt.client.whatsappPhone, lang: appt.client.preferredLang },
    serviceTitle,
    problemTitle,
    question: appt.problemDescription,
    mode: appt.visitMode,
    slotStart: appt.slotStart,
    slotEnd: appt.slotEnd,
    meetingUrl: appt.zoomUrl,
    birth: b
      ? {
          name: b.fullName,
          gender: b.gender,
          dob: b.dob,
          tob: b.tob,
          isTimeUnknown: b.isTimeUnknown,
          isDateUnknown: b.isDateUnknown,
          approxWindowStart: b.approxWindowStart,
          approxWindowEnd: b.approxWindowEnd,
          place: b.placeName,
          tzName: b.tzName,
        }
      : null,
    lifeEvents: b?.lifeEvents,
    vastuProperty: appt.vastuProperty,
    vastuMapUrl: appt.vastuMapUrl,
    kundaliUrl: kundali ? `${SITE()}/en/kundali/${kundali.id}` : null,
    kundaliPdfUrl: kundali?.pdfUrl ?? null,
    adminUrl: `${SITE()}/admin/appointments/${appt.id}`,
  });
  const res = await sendEmail({ to, ...content, template, entityId: appt.id });
  return res.ok;
}

async function sendClientReminder(appointmentId: string, kind: ReminderKind): Promise<boolean> {
  const appt = await loadAppointment(appointmentId);
  if (!appt || !(ACTIVE as readonly string[]).includes(appt.status)) return false;
  const template = reminderTemplate(kind);
  const locale = appt.client.preferredLang;
  if (!appt.client.email) {
    // Mark as handled so the cron stops picking it; WhatsApp reminders come with AMX-101.
    await logNotification({ channel: "EMAIL", template, to: "-", entityId: appt.id, status: "logged" });
    if (appt.client.whatsappPhone) {
      await logNotification({ channel: "WHATSAPP", template, to: appt.client.whatsappPhone, entityId: appt.id, status: "intent" });
    }
    return false;
  }
  const { serviceTitle, problemTitle } = titles(appt, locale);
  const address = appt.visitMode === "PERSONAL_VISIT" ? pick(SETTINGS.officeAddress, locale) : null;
  const content = reminderEmail({
    kind,
    locale,
    name: appt.client.fullName,
    serviceTitle,
    problemTitle,
    mode: appt.visitMode,
    slotStart: appt.slotStart,
    slotEnd: appt.slotEnd,
    durationMin: appt.durationMins,
    meetingUrl: appt.zoomUrl,
    address,
    mapUrl: address ? (process.env.OFFICE_MAP_URL ?? mapsUrl(address)) : null,
    manageUrl: localeUrl(locale, `/payment/success?appointment=${appt.id}`),
  });
  const res = await sendEmail({ to: appt.client.email, ...content, template, entityId: appt.id });
  if (appt.client.whatsappPhone) {
    await logNotification({ channel: "WHATSAPP", template, to: appt.client.whatsappPhone, entityId: appt.id, status: "intent" });
  }
  return res.ok;
}

export interface ReminderRunResult {
  checked: number;
  reminders: number;
  preReads: number;
  failed: number;
}

/** Cron entry point: sends every reminder / pre-read that is due at `now`. */
export async function sendDueReminders(now: Date = new Date()): Promise<ReminderRunResult> {
  const appts = await db.appointment.findMany({
    where: {
      status: { in: [...ACTIVE] },
      slotStart: { gt: now, lte: new Date(now.getTime() + LOOKAHEAD_MS) },
    },
    select: { id: true, slotStart: true, createdAt: true },
  });
  const result: ReminderRunResult = { checked: appts.length, reminders: 0, preReads: 0, failed: 0 };
  if (!appts.length) return result;

  const logs = await db.notificationLog.findMany({
    where: {
      entityId: { in: appts.map((a) => a.id) },
      channel: "EMAIL",
      status: { in: DONE_STATUSES },
      template: { in: [reminderTemplate("24h"), reminderTemplate("1h"), PREREAD_REMINDER_TEMPLATE] },
    },
    select: { entityId: true, template: true },
  });
  const sent = new Map<string, Set<string>>();
  for (const l of logs) {
    if (!l.entityId) continue;
    if (!sent.has(l.entityId)) sent.set(l.entityId, new Set());
    sent.get(l.entityId)!.add(l.template);
  }

  for (const action of selectDueActions(appts, sent, now)) {
    try {
      if (action.kind === "preread_2h") {
        if (!process.env.JYOTISH_EMAIL) continue;
        if (await sendJyotishPreRead(action.appointmentId, { reminder: true })) result.preReads++;
        else result.failed++;
      } else if (await sendClientReminder(action.appointmentId, action.kind)) {
        result.reminders++;
      }
    } catch (e) {
      result.failed++;
      console.error(`[reminders] ${action.kind} for ${action.appointmentId} failed`, e);
    }
  }
  return result;
}
