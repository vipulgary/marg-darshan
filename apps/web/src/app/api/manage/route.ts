import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { blockingAppointmentWhere } from "@/lib/booking/hold";
import { transition } from "@/lib/booking/machine";
import { SLOT_LOCK_NS, hourKeys, isBookableSlot, occupiedRange, overlaps } from "@/lib/booking/slots";
import { getCalendarProvider } from "@/lib/calendar";
import { manageSecret, readManageToken } from "@/lib/manage/links";
import { manageOptions } from "@/lib/manage/policy";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";

const token = z.string().min(10).max(1000);
const bodySchema = z.discriminatedUnion("action", [
  z.object({ token, action: z.literal("cancel") }),
  z.object({ token, action: z.literal("reschedule"), slotStart: z.iso.datetime() }),
]);

class ManageError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}

const json = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** POST /api/manage — client reschedule/cancel through a signed link (AMX-093). */
export async function POST(req: Request) {
  const rl = rateLimit(`manage:${clientIp(req)}`, 10, 10 * 60_000);
  if (!rl.ok)
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });

  const secret = manageSecret();
  if (!secret) return json(503, { error: "not_configured", message: "MANAGE_LINK_SECRET is not set" });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return json(400, { error: "invalid_payload", issues: parsed.error.issues });
  const body = parsed.data;

  const appointmentId = readManageToken(body.token, secret);
  if (!appointmentId) return json(401, { error: "invalid_token" });
  if (!process.env.DATABASE_URL) return json(503, { error: "not_configured", message: "DATABASE_URL is not set" });

  try {
    return body.action === "cancel" ? await cancel(appointmentId) : await reschedule(appointmentId, new Date(body.slotStart));
  } catch (e) {
    if (e instanceof ManageError) return json(e.status, { error: e.code });
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return json(409, { error: "conflict_retry" });
    console.error("manage failed", e);
    return json(500, { error: "server_error" });
  }
}

async function loadAppointment(id: string) {
  const { db } = await import("@/lib/db");
  const appt = await db.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      slotStart: true,
      slotEnd: true,
      durationMins: true,
      visitMode: true,
      calBookingUid: true,
      service: { select: { slug: true } },
      client: { select: { fullName: true, email: true, whatsappPhone: true, preferredLang: true } },
      payments: { select: { status: true, amountInr: true } },
    },
  });
  if (!appt) throw new ManageError(404, "not_found");
  return appt;
}

async function cancel(id: string) {
  const { db } = await import("@/lib/db");
  const [appt, { cancellationHours }] = await Promise.all([loadAppointment(id), getSettings()]);
  const opts = manageOptions(appt.slotStart, new Date(), appt.status, cancellationHours);
  if (!opts.canCancel) return json(409, { error: "not_allowed", reason: opts.reason });

  const updated = await db.$transaction((tx) =>
    tx.appointment.updateMany({
      where: { id, status: appt.status },
      data: { status: transition(appt.status, "CANCEL"), holdExpiresAt: null },
    }),
  );
  if (updated.count === 0) throw new ManageError(409, "conflict_retry");

  if (appt.calBookingUid) {
    try {
      await getCalendarProvider().cancelBooking(appt.calBookingUid);
    } catch (e) {
      console.error(`[manage] calendar cancel failed for ${id}`, e);
    }
  }

  // Refund policy page: cancelled ≥ cancellationHours before → full refund of the amount paid.
  const paidInr = appt.payments.filter((p) => p.status === "CAPTURED").reduce((s, p) => s + p.amountInr, 0);
  let refund: "none" | "initiated" | "failed" = "none";
  if (opts.refundEligible && paidInr > 0) {
    try {
      const { refundAppointment } = await import("@/lib/payments/service");
      await refundAppointment({ appointmentId: id, reason: "client_cancelled_online" });
      refund = "initiated";
    } catch (e) {
      // The booking stays cancelled; the team retries the refund via /api/payments/refund.
      console.error(`[manage] refund failed for ${id}`, e);
      refund = "failed";
    }
  }

  try {
    const { sendCancellationEmail } = await import("@/lib/notifications/confirm");
    await sendCancellationEmail(id, "cancelled", refund === "initiated" ? paidInr : undefined);
  } catch (e) {
    console.error(`[manage] cancellation email failed for ${id}`, e);
  }
  return json(200, { ok: true, action: "cancel", refund, refundInr: refund === "none" ? 0 : paidInr });
}

async function reschedule(id: string, start: Date) {
  const { db } = await import("@/lib/db");
  const now = new Date();
  const [appt, settings] = await Promise.all([loadAppointment(id), getSettings()]);
  const opts = manageOptions(appt.slotStart, now, appt.status, settings.cancellationHours);
  if (!opts.canReschedule) return json(409, { error: "not_allowed", reason: opts.reason });
  if (start.getTime() === appt.slotStart.getTime()) return json(400, { error: "same_slot" });
  if (!isBookableSlot(start, appt.durationMins, { now, workingHours: settings.workingHours })) return json(400, { error: "slot_invalid" });

  const end = new Date(start.getTime() + appt.durationMins * 60_000);
  const occ = occupiedRange(start, appt.durationMins);

  const provider = getCalendarProvider();
  if (provider.name !== "local") {
    try {
      const busy = await provider.getBusy(occ.start, occ.end);
      // The external calendar still holds our current booking; it must not block a move into an overlapping hour.
      const foreign = busy.filter((b) => b.start.getTime() !== appt.slotStart.getTime());
      if (foreign.some((b) => overlaps(occ.start, occ.end, b.start, b.end))) return json(409, { error: "slot_unavailable" });
    } catch (e) {
      console.error("manage: calendar check failed", e);
      return json(503, { error: "calendar_unavailable" });
    }
  }

  await db.$transaction(
    async (tx) => {
      for (const key of hourKeys(start, appt.durationMins))
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SLOT_LOCK_NS}::int4, ${key}::int4)`;
      const clash = await tx.appointment.findFirst({
        where: {
          AND: [blockingAppointmentWhere(now), { id: { not: id } }, { slotStart: { lt: occ.end } }, { slotEnd: { gt: occ.start } }],
        },
        select: { id: true },
      });
      if (clash) throw new ManageError(409, "slot_unavailable");
      const res = await tx.appointment.updateMany({
        where: { id, status: appt.status, slotStart: appt.slotStart },
        data: { slotStart: start, slotEnd: end },
      });
      if (res.count === 0) throw new ManageError(409, "conflict_retry");
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 5_000, timeout: 15_000 },
  );

  if (appt.calBookingUid) {
    try {
      await provider.cancelBooking(appt.calBookingUid);
      const booking = await provider.createBooking({
        appointmentId: id,
        serviceSlug: appt.service.slug,
        mode: appt.visitMode,
        start,
        end,
        durationMin: appt.durationMins,
        attendee: {
          name: appt.client.fullName,
          email: appt.client.email ?? "",
          phone: appt.client.whatsappPhone ?? undefined,
          locale: appt.client.preferredLang,
          timeZone: "Asia/Kolkata",
        },
      });
      await db.appointment.update({
        where: { id },
        data: { calBookingUid: booking.uid, ...(booking.meetingUrl && { zoomUrl: booking.meetingUrl }) },
      });
    } catch (e) {
      console.error(`[manage] calendar reschedule failed for ${id}`, e);
    }
  }

  try {
    const { sendRescheduledEmail } = await import("@/lib/notifications/confirm");
    await sendRescheduledEmail(id, { start: appt.slotStart, end: appt.slotEnd });
  } catch (e) {
    console.error(`[manage] rescheduled email failed for ${id}`, e);
  }
  return json(200, { ok: true, action: "reschedule", slotStart: start.toISOString(), slotEnd: end.toISOString() });
}
