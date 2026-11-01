/**
 * Confirmation orchestrator (AMX-090). Runs after a verified webhook moved an appointment to
 * CONFIRMED or PARTIALLY_PAID. Idempotent: a NotificationLog row with template
 * "booking_confirmed" for the appointment means the work is already done.
 */
import { db } from "@/lib/db";
import { getCalendarProvider } from "@/lib/calendar";
import type { CreateBookingInput } from "@/lib/calendar/types";
import { SETTINGS, getProblem, getService, pick } from "@/content/catalog";
import { manageUrl as signedManageUrl } from "@/lib/manage/links";
import { balanceDueAt } from "@/lib/payments/plan";
import { getSettings } from "@/lib/settings";
import { buildIcs } from "./ics";
import { sendJyotishPreRead } from "./scheduled";
import { logNotification, sendEmail } from "./email";
import { balanceDueEmail, bookingConfirmedEmail, cancellationEmail, mapsUrl, rescheduledEmail } from "./templates";

export const CONFIRM_TEMPLATE = "booking_confirmed";

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Absolute, locale-prefixed URL ("hi" lives at the root, "en" under /en). */
export function absoluteUrl(locale: string, path: string): string {
  return `${SITE()}${locale === "en" ? "/en" : ""}${path}`;
}

function loadAppointment(appointmentId: string) {
  return db.appointment.findUnique({
    where: { id: appointmentId },
    include: { client: true, service: true, problem: true, payments: { orderBy: { installmentNo: "asc" } } },
  });
}

type LoadedAppointment = NonNullable<Awaited<ReturnType<typeof loadAppointment>>>;

function titles(appt: LoadedAppointment, locale: string) {
  const service = getService(appt.service.slug);
  const problem = getProblem(appt.problem.slug);
  return {
    serviceTitle: service ? pick(service.title, locale) : locale === "en" ? appt.service.titleEn : appt.service.titleHi,
    problemTitle: problem ? pick(problem.title, locale) : locale === "en" ? appt.problem.titleEn : appt.problem.titleHi,
  };
}

async function ensureCalendarBooking(appt: LoadedAppointment): Promise<string | null> {
  if (appt.calBookingUid) return appt.zoomUrl;
  try {
    const provider = getCalendarProvider();
    const input: CreateBookingInput = {
      appointmentId: appt.id,
      serviceSlug: appt.service.slug,
      mode: appt.visitMode,
      start: appt.slotStart,
      end: appt.slotEnd,
      durationMin: appt.durationMins,
      attendee: {
        name: appt.client.fullName,
        email: appt.client.email ?? "",
        phone: appt.client.whatsappPhone ?? undefined,
        locale: appt.client.preferredLang,
        timeZone: SETTINGS.timeZone,
      },
      notes: appt.problemDescription ?? undefined,
    };
    const res = await provider.createBooking(input);
    await db.appointment.update({
      where: { id: appt.id },
      data: { calBookingUid: res.uid, ...(res.meetingUrl && { zoomUrl: res.meetingUrl }) },
    });
    return res.meetingUrl ?? appt.zoomUrl;
  } catch (e) {
    // The email still goes out; the Zoom link follows separately (template says so).
    console.error(`[confirm] calendar booking failed for ${appt.id}`, e);
    return appt.zoomUrl;
  }
}

export async function onAppointmentConfirmed(appointmentId: string): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.warn("[confirm] DATABASE_URL missing — skipped", appointmentId);
    return;
  }
  const done = await db.notificationLog.findFirst({
    where: { template: CONFIRM_TEMPLATE, entityId: appointmentId, channel: "EMAIL", status: { in: ["sent", "logged"] } },
    select: { id: true },
  });
  if (done) return;

  const appt = await loadAppointment(appointmentId);
  if (!appt || (appt.status !== "CONFIRMED" && appt.status !== "PARTIALLY_PAID")) return;

  const locale = appt.client.preferredLang;
  const meetingUrl = await ensureCalendarBooking(appt);
  const { serviceTitle, problemTitle } = titles(appt, locale);
  const settings = await getSettings();
  const address = appt.visitMode === "PERSONAL_VISIT" ? pick(settings.officeAddress, locale) : null;
  const paidInr = appt.payments.filter((p) => p.status === "CAPTURED").reduce((s, p) => s + p.amountInr, 0);
  const first = appt.payments.find((p) => p.installmentNo === 1);
  const balanceInr = appt.status === "PARTIALLY_PAID" ? (first?.balanceDueInr ?? 0) : 0;
  const manageUrl = signedManageUrl(appt.id, locale, appt.slotStart) ?? absoluteUrl(locale, `/payment/success?appointment=${appt.id}`);

  const content = bookingConfirmedEmail({
    locale,
    name: appt.client.fullName,
    serviceTitle,
    problemTitle,
    mode: appt.visitMode,
    slotStart: appt.slotStart,
    slotEnd: appt.slotEnd,
    durationMin: appt.durationMins,
    meetingUrl,
    address,
    mapUrl: address ? (process.env.OFFICE_MAP_URL ?? mapsUrl(address)) : null,
    manageUrl,
    paidInr,
    balanceInr,
    balanceDueAt: balanceInr > 0 && first ? balanceDueAt(appt.slotStart, first.updatedAt, settings.paymentBalanceDaysBefore) : null,
  });

  const ics = buildIcs({
    uid: `${appt.id}@astromax`,
    start: appt.slotStart,
    end: appt.slotEnd,
    title: `${serviceTitle} — Marg Darshan`,
    description: [problemTitle, meetingUrl ?? address ?? ""].filter(Boolean).join("\n"),
    location: meetingUrl ?? address ?? (locale === "en" ? "Online (Zoom)" : "ऑनलाइन (Zoom)"),
    url: meetingUrl ?? manageUrl,
    alarmMinutesBefore: 60,
  });

  if (appt.client.email) {
    await sendEmail({
      to: appt.client.email,
      ...content,
      attachments: [{ filename: "astromax-booking.ics", content: Buffer.from(ics, "utf8").toString("base64"), contentType: "text/calendar" }],
      template: CONFIRM_TEMPLATE,
      entityId: appt.id,
    });
  } else {
    await logNotification({ channel: "EMAIL", template: CONFIRM_TEMPLATE, to: "-", entityId: appt.id, status: "logged" });
  }

  // WhatsApp Cloud API templates come in AMX-101; record the intent so it can be replayed.
  if (appt.client.whatsappPhone) {
    await logNotification({ channel: "WHATSAPP", template: CONFIRM_TEMPLATE, to: appt.client.whatsappPhone, entityId: appt.id, status: "intent" });
  }
  try {
    await sendJyotishPreRead(appt.id);
  } catch (e) {
    console.error(`[confirm] Jyotish pre-read failed for ${appt.id}`, e);
  }
}

export async function sendBalanceDueEmail(appointmentId: string, payUrl: string, amountInr: number, dueAt: Date): Promise<void> {
  const appt = await loadAppointment(appointmentId);
  if (!appt?.client.email) return;
  const locale = appt.client.preferredLang;
  const content = balanceDueEmail({
    locale,
    name: appt.client.fullName,
    serviceTitle: titles(appt, locale).serviceTitle,
    slotStart: appt.slotStart,
    slotEnd: appt.slotEnd,
    amountInr,
    payUrl,
    dueAt,
  });
  await sendEmail({ to: appt.client.email, ...content, template: "balance_due", entityId: appt.id });
}

export async function sendCancellationEmail(
  appointmentId: string,
  reason: "cancelled" | "slot_unavailable",
  refundInr?: number,
): Promise<void> {
  const appt = await loadAppointment(appointmentId);
  if (!appt?.client.email) return;
  const locale = appt.client.preferredLang;
  const content = cancellationEmail({
    locale,
    name: appt.client.fullName,
    serviceTitle: titles(appt, locale).serviceTitle,
    slotStart: appt.slotStart,
    slotEnd: appt.slotEnd,
    reason,
    refundInr,
    rebookUrl: absoluteUrl(locale, `/book-appointment?problem=${appt.problem.slug}`),
  });
  await sendEmail({ to: appt.client.email, ...content, template: "booking_cancelled", entityId: appt.id });
}

/** Sent after a client reschedules via their manage link (AMX-093). */
export async function sendRescheduledEmail(appointmentId: string, previous: { start: Date; end: Date }): Promise<void> {
  const appt = await loadAppointment(appointmentId);
  if (!appt?.client.email) return;
  const locale = appt.client.preferredLang;
  const address = appt.visitMode === "PERSONAL_VISIT" ? pick((await getSettings()).officeAddress, locale) : null;
  const content = rescheduledEmail({
    locale,
    name: appt.client.fullName,
    ...titles(appt, locale),
    mode: appt.visitMode,
    slotStart: appt.slotStart,
    slotEnd: appt.slotEnd,
    durationMin: appt.durationMins,
    meetingUrl: appt.zoomUrl,
    address,
    mapUrl: address ? (process.env.OFFICE_MAP_URL ?? mapsUrl(address)) : null,
    manageUrl: signedManageUrl(appt.id, locale, appt.slotStart),
    previousStart: previous.start,
    previousEnd: previous.end,
  });
  const ics = buildIcs({
    uid: `${appt.id}@astromax`,
    start: appt.slotStart,
    end: appt.slotEnd,
    title: `${titles(appt, locale).serviceTitle} — Marg Darshan`,
    description: appt.zoomUrl ?? address ?? "",
    location: appt.zoomUrl ?? address ?? (locale === "en" ? "Online (Zoom)" : "ऑनलाइन (Zoom)"),
    url: appt.zoomUrl ?? undefined,
    alarmMinutesBefore: 60,
  });
  await sendEmail({
    to: appt.client.email,
    ...content,
    attachments: [{ filename: "astromax-booking.ics", content: Buffer.from(ics, "utf8").toString("base64"), contentType: "text/calendar" }],
    template: "booking_rescheduled",
    entityId: appt.id,
  });
}
