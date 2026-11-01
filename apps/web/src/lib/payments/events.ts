/**
 * Pure normalisation of Razorpay webhook payloads (AMX-082). Keeps the DB handler small
 * and lets us unit-test the mapping without a database.
 */
import type { PaymentChannel } from "@/generated/prisma/enums";
import type { RazorpayOrder, RazorpayPayment, RazorpayPaymentLink, RazorpayRefund } from "./razorpay";

export interface RazorpayWebhookBody {
  entity: "event";
  account_id?: string;
  event: string;
  contains?: string[];
  payload: {
    payment?: { entity: RazorpayPayment };
    order?: { entity: RazorpayOrder };
    payment_link?: { entity: RazorpayPaymentLink };
    refund?: { entity: RazorpayRefund };
  };
  created_at?: number;
}

export type NormalizedEvent =
  | {
      kind: "captured";
      event: string;
      orderId: string | null;
      paymentId: string;
      amountPaise: number;
      channel: PaymentChannel;
      notes: Record<string, string>;
    }
  | { kind: "failed"; event: string; orderId: string | null; paymentId: string; reason: string | null }
  | {
      kind: "link_paid";
      event: string;
      linkId: string;
      orderId: string | null;
      paymentId: string | null;
      amountPaise: number;
      channel: PaymentChannel;
    }
  | {
      kind: "refund_processed";
      event: string;
      refundId: string;
      paymentId: string;
      refundPaise: number;
      /** total refunded on the payment so far, when Razorpay includes the payment entity */
      refundedTotalPaise: number | null;
      paymentAmountPaise: number | null;
    }
  | { kind: "ignored"; event: string };

export function isWebhookBody(v: unknown): v is RazorpayWebhookBody {
  return (
    !!v &&
    typeof v === "object" &&
    (v as { event?: unknown }).event !== undefined &&
    typeof (v as { event?: unknown }).event === "string" &&
    !!(v as { payload?: unknown }).payload &&
    typeof (v as { payload?: unknown }).payload === "object"
  );
}

export function channelFromPayment(p: Pick<RazorpayPayment, "method" | "vpa" | "upi"> | null | undefined): PaymentChannel {
  if (!p) return "OTHER";
  switch (p.method) {
    case "upi": {
      const flow = p.upi?.flow?.toLowerCase();
      if (flow === "intent" || flow === "in_app") return "UPI_INTENT";
      if (flow === "qr" || flow === "qr_code") return "UPI_QR";
      if (flow === "collect" || p.vpa || p.upi?.vpa) return "UPI_ID";
      return "UPI_INTENT";
    }
    case "netbanking":
      return "NET_BANKING";
    case "card":
    case "emi":
      return "CARD";
    case "wallet":
      return "WALLET";
    default:
      return "OTHER";
  }
}

function notesOf(p: RazorpayPayment | undefined): Record<string, string> {
  const n = p?.notes;
  if (!n || Array.isArray(n) || typeof n !== "object") return {};
  return Object.fromEntries(Object.entries(n).filter(([, v]) => typeof v === "string")) as Record<string, string>;
}

export function normalizeEvent(body: RazorpayWebhookBody): NormalizedEvent {
  const { event, payload } = body;
  const payment = payload.payment?.entity;
  switch (event) {
    case "payment.captured":
    case "order.paid": {
      if (!payment?.id) return { kind: "ignored", event };
      return {
        kind: "captured",
        event,
        orderId: payment.order_id ?? payload.order?.entity.id ?? null,
        paymentId: payment.id,
        amountPaise: payment.amount,
        channel: channelFromPayment(payment),
        notes: notesOf(payment),
      };
    }
    case "payment.failed": {
      if (!payment?.id) return { kind: "ignored", event };
      return {
        kind: "failed",
        event,
        orderId: payment.order_id ?? null,
        paymentId: payment.id,
        reason: payment.error_description ?? payment.error_reason ?? null,
      };
    }
    case "payment_link.paid": {
      const link = payload.payment_link?.entity;
      if (!link?.id) return { kind: "ignored", event };
      return {
        kind: "link_paid",
        event,
        linkId: link.id,
        orderId: payload.order?.entity.id ?? payment?.order_id ?? null,
        paymentId: payment?.id ?? null,
        amountPaise: payment?.amount ?? link.amount_paid,
        channel: channelFromPayment(payment),
      };
    }
    case "refund.processed": {
      const refund = payload.refund?.entity;
      if (!refund?.id || !refund.payment_id) return { kind: "ignored", event };
      return {
        kind: "refund_processed",
        event,
        refundId: refund.id,
        paymentId: refund.payment_id,
        refundPaise: refund.amount,
        refundedTotalPaise: payment?.amount_refunded ?? null,
        paymentAmountPaise: payment?.amount ?? null,
      };
    }
    default:
      return { kind: "ignored", event };
  }
}

/** Razorpay sends x-razorpay-event-id; fall back to a deterministic id from the payload. */
export function webhookEventId(headerValue: string | null, body: RazorpayWebhookBody): string {
  if (headerValue && headerValue.trim()) return headerValue.trim();
  const p = body.payload;
  const entityId =
    p.refund?.entity.id ?? p.payment_link?.entity.id ?? p.payment?.entity.id ?? p.order?.entity.id ?? String(body.created_at ?? "");
  return `${body.event}:${entityId}`;
}

/** A refund leaves the payment fully refunded when the refunded total reaches the captured amount. */
export function isFullyRefunded(
  e: { refundPaise: number; refundedTotalPaise: number | null; paymentAmountPaise: number | null },
  capturedPaise: number,
): boolean {
  const total = e.paymentAmountPaise ?? capturedPaise;
  const refunded = e.refundedTotalPaise ?? e.refundPaise;
  return refunded >= total;
}
