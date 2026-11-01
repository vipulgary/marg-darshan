/**
 * Payment flows backed by the DB (AMX-080/082/083/086). Appointment status changes only through
 * the booking state machine, and payment-driven changes only from verified webhooks.
 */
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { AppointmentStatus, PaymentChannel, PlanType } from "@/generated/prisma/enums";
import { SLOT_BLOCKING, canTransition, transition, type AppointmentEvent } from "@/lib/booking/machine";
import { SLOT_LOCK_NS, hourKeys } from "@/lib/booking/slots";
import { issueInvoiceForPayment } from "@/lib/invoice/issue";
import { onAppointmentConfirmed, absoluteUrl, sendBalanceDueEmail, sendCancellationEmail } from "@/lib/notifications/confirm";
import { getService, pick } from "@/content/catalog";
import { PaymentFlowError, UUID_RE, isUniqueViolation, requireDb } from "./http";
import { balanceDueAt, installments, quoteFor, toPaise } from "./plan";
import { getSettings, serviceLookup } from "@/lib/settings";
import {
  RazorpayNotConfiguredError,
  createOrder,
  createPaymentLink,
  fetchPayment,
  razorpayConfigured,
  razorpayKeyId,
  refundPayment,
} from "./razorpay";
import { isFullyRefunded, isWebhookBody, normalizeEvent, webhookEventId, type NormalizedEvent } from "./events";
import { verifyWebhookSignature } from "./signature";

type Tx = Prisma.TransactionClient;

/** Razorpay prefill wants +91XXXXXXXXXX. */
export function prefillContact(phone: string | null | undefined): string | undefined {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return digits ? `+${digits}` : undefined;
}

/* ------------------------------------------------------------------ order */

export interface CheckoutOrder {
  orderId: string;
  amountPaise: number;
  currency: "INR";
  keyId: string;
  planType: PlanType;
  amountInr: number;
  totalInr: number;
  balanceInr: number;
  description: string;
  prefill: { name: string; email?: string; contact?: string };
}

export async function createCheckoutOrder(appointmentId: string, planType: PlanType, now = new Date()): Promise<CheckoutOrder> {
  requireDb();
  const appt = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { client: true, service: true, payments: true },
  });
  if (!appt) throw new PaymentFlowError(404, "not_found");
  if (appt.status === "EXPIRED") throw new PaymentFlowError(410, "hold_expired");
  if (appt.status !== "HELD" && appt.status !== "PENDING_PAYMENT") throw new PaymentFlowError(409, "not_payable");
  if (!appt.holdExpiresAt || appt.holdExpiresAt.getTime() <= now.getTime()) throw new PaymentFlowError(410, "hold_expired");

  const settings = await getSettings();
  const quote = quoteFor({ serviceSlug: appt.service.slug, durationMin: appt.durationMins, planType }, serviceLookup(settings));
  const [first] = installments(quote, { now, slotStart: appt.slotStart, daysBefore: settings.paymentBalanceDaysBefore });
  const keyId = razorpayKeyId();
  if (!keyId || !razorpayConfigured()) throw new RazorpayNotConfiguredError();

  const existing = appt.payments.find((p) => p.installmentNo === 1);
  if (existing && (existing.status === "CAPTURED" || existing.status === "REFUNDED")) throw new PaymentFlowError(409, "already_paid");

  const amountPaise = toPaise(first.amountInr);
  const locale = appt.client.preferredLang;
  const service = getService(appt.service.slug);
  const description = service ? pick(service.title, locale) : appt.service.titleEn;

  // Reuse the open order when nothing changed so Razorpay's retry-on-same-order keeps working.
  let orderId =
    existing?.razorpayOrderId && existing.amountInr === first.amountInr && existing.planType === quote.planType
      ? existing.razorpayOrderId
      : null;
  if (!orderId) {
    const order = await createOrder({
      amountPaise,
      receipt: `appt_${appointmentId.slice(0, 8)}_1_${now.getTime().toString(36)}`,
      notes: { appointmentId, installmentNo: "1", planType: quote.planType, service: quote.serviceSlug },
    });
    orderId = order.id;
  }

  await db.$transaction(async (tx) => {
    const fresh = await tx.appointment.findUniqueOrThrow({ where: { id: appointmentId }, select: { status: true } });
    const next = transition(fresh.status, "START_PAYMENT");
    const data = {
      planType: quote.planType,
      totalInr: quote.totalInr,
      amountInr: first.amountInr,
      balanceDueInr: quote.balanceInr,
      razorpayOrderId: orderId,
      status: "CREATED" as const,
    };
    await tx.payment.upsert({
      where: { appointmentId_installmentNo: { appointmentId, installmentNo: 1 } },
      create: { appointmentId, installmentNo: 1, ...data },
      update: data,
    });
    if (next !== fresh.status) await tx.appointment.update({ where: { id: appointmentId }, data: { status: next } });
  });

  return {
    orderId,
    amountPaise,
    currency: "INR",
    keyId,
    planType: quote.planType,
    amountInr: first.amountInr,
    totalInr: quote.totalInr,
    balanceInr: quote.balanceInr,
    description,
    prefill: {
      name: appt.client.fullName,
      ...(appt.client.email && { email: appt.client.email }),
      ...(prefillContact(appt.client.whatsappPhone) && { contact: prefillContact(appt.client.whatsappPhone) }),
    },
  };
}

/* ---------------------------------------------------------------- webhook */

export type WebhookEffect =
  | { type: "confirmed"; appointmentId: string }
  | { type: "schedule_balance"; appointmentId: string }
  | { type: "invoice"; appointmentId: string; paymentId: string }
  | { type: "refund_conflict"; appointmentId: string; razorpayPaymentId: string; amountInr: number };

function mergeRaw(prev: Prisma.JsonValue | null, event: string, raw: unknown): Prisma.InputJsonValue {
  const base = prev && typeof prev === "object" && !Array.isArray(prev) ? (prev as Prisma.JsonObject) : {};
  return { ...base, [event]: raw as Prisma.InputJsonValue };
}

/**
 * Same rule as the local calendar provider: SLOT_BLOCKING statuses, HELD only while the hold lasts.
 * Takes the booking hold's per-hour advisory locks so a concurrent hold can't slip in between.
 */
async function slotTaken(tx: Tx, appt: { id: string; slotStart: Date; slotEnd: Date }, now: Date): Promise<boolean> {
  const minutes = Math.round((appt.slotEnd.getTime() - appt.slotStart.getTime()) / 60_000);
  for (const key of hourKeys(appt.slotStart, minutes))
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SLOT_LOCK_NS}::int4, ${key}::int4)`;
  const clash = await tx.appointment.findFirst({
    where: {
      id: { not: appt.id },
      slotStart: { lt: appt.slotEnd },
      slotEnd: { gt: appt.slotStart },
      OR: [
        { status: { in: SLOT_BLOCKING.filter((s) => s !== "HELD") } },
        { status: "HELD", holdExpiresAt: { gt: now } },
      ],
    },
    select: { id: true },
  });
  return clash !== null;
}

type PaymentRow = Prisma.PaymentGetPayload<object>;

async function capturePayment(
  tx: Tx,
  payment: PaymentRow,
  info: { event: string; paymentId: string | null; orderId: string | null; channel: PaymentChannel; raw: unknown },
  now: Date,
): Promise<WebhookEffect[]> {
  // payment.captured and order.paid (or payment_link.paid) both arrive for one payment.
  if (payment.status === "CAPTURED" || payment.status === "REFUNDED") return [];
  await tx.payment.update({
    where: { id: payment.id },
    data: {
      status: "CAPTURED",
      channel: info.channel,
      ...(info.paymentId && { razorpayPaymentId: info.paymentId }),
      ...(!payment.razorpayOrderId && info.orderId && { razorpayOrderId: info.orderId }),
      rawWebhook: mergeRaw(payment.rawWebhook, info.event, info.raw),
    },
  });

  const appt = await tx.appointment.findUniqueOrThrow({ where: { id: payment.appointmentId } });
  const event: AppointmentEvent =
    payment.installmentNo >= 2 ? "BALANCE_CAPTURED" : payment.planType === "SPLIT_PLAN" ? "ADVANCE_CAPTURED" : "PAYMENT_CAPTURED";

  if (appt.status === "EXPIRED" && (await slotTaken(tx, appt, now))) {
    console.warn(`[razorpay] capture after expiry and the slot is taken — refunding ${appt.id}`);
    return info.paymentId
      ? [{ type: "refund_conflict", appointmentId: appt.id, razorpayPaymentId: info.paymentId, amountInr: payment.amountInr }]
      : [];
  }
  if (!canTransition(appt.status, event)) {
    console.warn(`[razorpay] ${event} ignored for appointment ${appt.id} in ${appt.status}`);
    return [];
  }
  const next: AppointmentStatus = transition(appt.status, event);
  await tx.appointment.update({ where: { id: appt.id }, data: { status: next } });
  // AMX-085: every kept capture gets a GST invoice (issued after the 200, idempotent per payment).
  const invoice: WebhookEffect = { type: "invoice", appointmentId: appt.id, paymentId: payment.id };
  if (next === "PARTIALLY_PAID")
    return [
      { type: "schedule_balance", appointmentId: appt.id },
      { type: "confirmed", appointmentId: appt.id },
      invoice,
    ];
  if (next === "CONFIRMED") return [{ type: "confirmed", appointmentId: appt.id }, invoice];
  return [invoice];
}

async function markRefund(tx: Tx, payment: PaymentRow, full: boolean, event: string, raw: unknown) {
  await tx.payment.update({
    where: { id: payment.id },
    data: { ...(full && { status: "REFUNDED" }), rawWebhook: mergeRaw(payment.rawWebhook, event, raw) },
  });
  if (!full) return;
  const appt = await tx.appointment.findUniqueOrThrow({ where: { id: payment.appointmentId }, include: { payments: true } });
  const paid = appt.payments.filter((p) => p.razorpayPaymentId && (p.status === "CAPTURED" || p.status === "REFUNDED"));
  if (paid.length && paid.every((p) => p.status === "REFUNDED") && canTransition(appt.status, "REFUND")) {
    await tx.appointment.update({ where: { id: appt.id }, data: { status: transition(appt.status, "REFUND") } });
  }
}

async function applyEvent(tx: Tx, ev: NormalizedEvent, raw: unknown, now: Date): Promise<WebhookEffect[]> {
  switch (ev.kind) {
    case "captured": {
      let payment = ev.orderId ? await tx.payment.findUnique({ where: { razorpayOrderId: ev.orderId } }) : null;
      payment ??= await tx.payment.findUnique({ where: { razorpayPaymentId: ev.paymentId } });
      const noteAppt = ev.notes.appointmentId;
      const noteNo = Number(ev.notes.installmentNo);
      if (!payment && noteAppt && UUID_RE.test(noteAppt) && (noteNo === 1 || noteNo === 2)) {
        payment = await tx.payment.findUnique({
          where: { appointmentId_installmentNo: { appointmentId: noteAppt, installmentNo: noteNo } },
        });
      }
      if (!payment) {
        console.warn(`[razorpay] unmatched ${ev.event} for ${ev.paymentId}`);
        return [];
      }
      return capturePayment(tx, payment, { ...ev, raw }, now);
    }
    case "link_paid": {
      const payment = await tx.payment.findUnique({ where: { razorpayLinkId: ev.linkId } });
      if (!payment) {
        console.warn(`[razorpay] unmatched payment link ${ev.linkId}`);
        return [];
      }
      return capturePayment(tx, payment, { ...ev, raw }, now);
    }
    case "failed": {
      const payment = ev.orderId ? await tx.payment.findUnique({ where: { razorpayOrderId: ev.orderId } }) : null;
      if (!payment || payment.status === "CAPTURED" || payment.status === "REFUNDED") return [];
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", rawWebhook: mergeRaw(payment.rawWebhook, ev.event, raw) },
      });
      const appt = await tx.appointment.findUniqueOrThrow({ where: { id: payment.appointmentId }, select: { id: true, status: true } });
      if (canTransition(appt.status, "PAYMENT_FAILED")) {
        const next = transition(appt.status, "PAYMENT_FAILED");
        if (next !== appt.status) await tx.appointment.update({ where: { id: appt.id }, data: { status: next } });
      }
      return [];
    }
    case "refund_processed": {
      const payment = await tx.payment.findUnique({ where: { razorpayPaymentId: ev.paymentId } });
      if (!payment) return [];
      await markRefund(tx, payment, isFullyRefunded(ev, toPaise(payment.amountInr)), ev.event, raw);
      return [];
    }
    default:
      return [];
  }
}

export async function processRazorpayWebhook({
  rawBody,
  signature,
  eventIdHeader,
  now = new Date(),
}: {
  rawBody: string;
  signature: string | null;
  eventIdHeader: string | null;
  now?: Date;
}): Promise<{ status: number; body: Record<string, unknown>; effects: WebhookEffect[] }> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return { status: 503, body: { error: "webhook_not_configured" }, effects: [] };
  if (!verifyWebhookSignature(rawBody, signature, secret)) return { status: 400, body: { error: "invalid_signature" }, effects: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: { error: "invalid_json" }, effects: [] };
  }
  if (!isWebhookBody(parsed)) return { status: 400, body: { error: "invalid_payload" }, effects: [] };
  requireDb();

  const eventId = webhookEventId(eventIdHeader, parsed);
  const normalized = normalizeEvent(parsed);
  try {
    // The idempotency row and the state change commit together, so a failed attempt can be retried.
    const effects = await db.$transaction(
      async (tx) => {
        const record = await tx.webhookEvent.create({
          data: { provider: "razorpay", eventId, payload: parsed as unknown as Prisma.InputJsonValue },
        });
        const fx = await applyEvent(tx, normalized, parsed.payload, now);
        await tx.webhookEvent.update({ where: { id: record.id }, data: { processedAt: new Date() } });
        return fx;
      },
      { timeout: 15_000 },
    );
    return { status: 200, body: { ok: true, event: parsed.event }, effects };
  } catch (e) {
    if (isUniqueViolation(e)) return { status: 200, body: { ok: true, duplicate: true }, effects: [] };
    throw e;
  }
}

/** Side effects run after the 200 is sent (Razorpay times out webhooks after a few seconds). */
export async function runWebhookEffects(effects: WebhookEffect[]): Promise<void> {
  for (const fx of effects) {
    try {
      if (fx.type === "schedule_balance") await scheduleBalanceLink(fx.appointmentId);
      else if (fx.type === "confirmed") await onAppointmentConfirmed(fx.appointmentId);
      else if (fx.type === "invoice") await issueInvoiceForPayment(fx.paymentId);
      else if (fx.type === "refund_conflict") {
        await refundPayment(fx.razorpayPaymentId, undefined, { appointmentId: fx.appointmentId, reason: "slot_unavailable" });
        await sendCancellationEmail(fx.appointmentId, "slot_unavailable", fx.amountInr);
      }
    } catch (e) {
      console.error(`[payments] effect ${fx.type} failed for ${fx.appointmentId}`, e);
    }
  }
}

/* ------------------------------------------------------------ split plan */

export async function scheduleBalanceLink(appointmentId: string, now = new Date()): Promise<void> {
  const appt = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { client: true, service: true, payments: true },
  });
  if (!appt || appt.status !== "PARTIALLY_PAID") return;
  const first = appt.payments.find((p) => p.installmentNo === 1);
  if (!first || first.planType !== "SPLIT_PLAN" || first.balanceDueInr <= 0) return;
  const second = appt.payments.find((p) => p.installmentNo === 2);
  if (second?.razorpayLinkId || second?.status === "CAPTURED") return;

  const row =
    second ??
    (await db.payment.create({
      data: {
        appointmentId,
        installmentNo: 2,
        planType: "SPLIT_PLAN",
        totalInr: first.totalInr,
        amountInr: first.balanceDueInr,
        balanceDueInr: 0,
        status: "CREATED",
      },
    }));

  if (!razorpayConfigured()) {
    console.warn(`[payments] Razorpay keys missing — balance link for ${appointmentId} not created`);
    return;
  }
  const locale = appt.client.preferredLang;
  const dueAt = balanceDueAt(appt.slotStart, now, (await getSettings()).paymentBalanceDaysBefore);
  const service = getService(appt.service.slug);
  const link = await createPaymentLink({
    amountPaise: toPaise(row.amountInr),
    description: `${service ? pick(service.title, locale) : appt.service.titleEn} — balance / शेष भुगतान`,
    customer: { name: appt.client.fullName, email: appt.client.email, contact: prefillContact(appt.client.whatsappPhone) },
    notes: { appointmentId, installmentNo: "2" },
    expireBy: dueAt,
    callbackUrl: absoluteUrl(locale, `/payment/success?appointment=${appointmentId}`),
    referenceId: `${appointmentId.slice(0, 8)}-bal-${now.getTime().toString(36)}`,
  });
  await db.payment.update({ where: { id: row.id }, data: { razorpayLinkId: link.id } });
  await sendBalanceDueEmail(appointmentId, link.short_url, row.amountInr, dueAt);
}

/* ---------------------------------------------------------------- refunds */

export interface RefundResult {
  paymentId: string;
  installmentNo: number;
  refundId: string;
  amountPaise: number;
  status: string;
}

export async function refundAppointment({
  appointmentId,
  amountInr,
  reason,
}: {
  appointmentId: string;
  amountInr?: number;
  reason?: string;
}): Promise<{ appointmentId: string; refunds: RefundResult[] }> {
  requireDb();
  const appt = await db.appointment.findUnique({ where: { id: appointmentId }, include: { payments: true } });
  if (!appt) throw new PaymentFlowError(404, "not_found");
  const captured = appt.payments
    .filter((p) => p.status === "CAPTURED" && p.razorpayPaymentId)
    .sort((a, b) => b.installmentNo - a.installmentNo);
  if (!captured.length) throw new PaymentFlowError(409, "nothing_to_refund");

  // Refundable amounts come from Razorpay so earlier partial refunds are respected.
  const remote = await Promise.all(captured.map((p) => fetchPayment(p.razorpayPaymentId!)));
  const refundable = remote.map((r) => Math.max(0, r.amount - (r.amount_refunded ?? 0)));
  const totalRefundable = refundable.reduce((s, n) => s + n, 0);
  let remaining = amountInr === undefined ? totalRefundable : toPaise(amountInr);
  if (remaining <= 0) throw new PaymentFlowError(409, "nothing_to_refund");
  if (remaining > totalRefundable) throw new PaymentFlowError(400, "amount_exceeds_refundable", `max ${totalRefundable / 100} INR`);

  const refunds: RefundResult[] = [];
  for (let i = 0; i < captured.length && remaining > 0; i++) {
    const p = captured[i];
    const amount = Math.min(refundable[i], remaining);
    if (amount <= 0) continue;
    const refund = await refundPayment(p.razorpayPaymentId!, amount, { appointmentId, ...(reason && { reason }) });
    remaining -= amount;
    refunds.push({ paymentId: p.id, installmentNo: p.installmentNo, refundId: refund.id, amountPaise: refund.amount, status: refund.status });
    if (refund.status === "processed") {
      const full = remote[i].amount_refunded + refund.amount >= remote[i].amount;
      await db.$transaction((tx) => markRefund(tx, p, full, "refund.api", refund));
    }
    // Otherwise the refund.processed webhook syncs the status.
  }
  return { appointmentId, refunds };
}

/* ----------------------------------------------------------------- status */

export async function getPaymentStatus(appointmentId: string) {
  requireDb();
  const appt = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      status: true,
      holdExpiresAt: true,
      slotStart: true,
      slotEnd: true,
      durationMins: true,
      visitMode: true,
      service: { select: { slug: true } },
      problem: { select: { slug: true } },
      payments: {
        orderBy: { installmentNo: "asc" },
        select: { installmentNo: true, planType: true, amountInr: true, totalInr: true, balanceDueInr: true, status: true, channel: true, updatedAt: true },
      },
    },
  });
  if (!appt) return null;
  const paidInr = appt.payments.filter((p) => p.status === "CAPTURED").reduce((s, p) => s + p.amountInr, 0);
  const totalInr = appt.payments[0]?.totalInr ?? 0;
  return {
    appointmentStatus: appt.status,
    holdExpiresAt: appt.holdExpiresAt?.toISOString() ?? null,
    appointment: {
      serviceSlug: appt.service.slug,
      problemSlug: appt.problem.slug,
      mode: appt.visitMode,
      slotStart: appt.slotStart.toISOString(),
      slotEnd: appt.slotEnd.toISOString(),
      durationMin: appt.durationMins,
    },
    totalInr,
    paidInr,
    balanceInr: Math.max(0, totalInr - paidInr),
    payments: appt.payments.map((p) => ({ ...p, updatedAt: p.updatedAt.toISOString() })),
  };
}

export type PaymentStatusResponse = NonNullable<Awaited<ReturnType<typeof getPaymentStatus>>>;
