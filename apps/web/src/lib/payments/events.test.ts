import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { channelFromPayment, isFullyRefunded, isWebhookBody, normalizeEvent, webhookEventId, type RazorpayWebhookBody } from "./events";
import type { RazorpayPayment } from "./razorpay";

const payment = (over: Partial<RazorpayPayment> = {}): RazorpayPayment => ({
  id: "pay_1",
  entity: "payment",
  amount: 210000,
  currency: "INR",
  status: "captured",
  order_id: "order_1",
  method: "upi",
  amount_refunded: 0,
  refund_status: null,
  captured: true,
  vpa: "rahul@okhdfc",
  notes: { appointmentId: "a1" },
  upi: { flow: "intent" },
  created_at: 1_700_000_000,
  ...over,
});

const body = (event: string, payload: RazorpayWebhookBody["payload"]): RazorpayWebhookBody => ({ entity: "event", event, payload });

describe("channelFromPayment", () => {
  it("maps UPI flows", () => {
    assert.equal(channelFromPayment(payment({ upi: { flow: "intent" } })), "UPI_INTENT");
    assert.equal(channelFromPayment(payment({ upi: { flow: "collect" } })), "UPI_ID");
    assert.equal(channelFromPayment(payment({ upi: { flow: "qr" } })), "UPI_QR");
    assert.equal(channelFromPayment(payment({ upi: null, vpa: "x@ybl" })), "UPI_ID");
    assert.equal(channelFromPayment(payment({ upi: null, vpa: null })), "UPI_INTENT");
  });
  it("maps other methods", () => {
    assert.equal(channelFromPayment(payment({ method: "netbanking" })), "NET_BANKING");
    assert.equal(channelFromPayment(payment({ method: "card" })), "CARD");
    assert.equal(channelFromPayment(payment({ method: "emi" })), "CARD");
    assert.equal(channelFromPayment(payment({ method: "wallet" })), "WALLET");
    assert.equal(channelFromPayment(payment({ method: "paylater" })), "OTHER");
    assert.equal(channelFromPayment(null), "OTHER");
  });
});

describe("normalizeEvent", () => {
  it("normalises payment.captured", () => {
    const e = normalizeEvent(body("payment.captured", { payment: { entity: payment() } }));
    assert.deepEqual(e, {
      kind: "captured",
      event: "payment.captured",
      orderId: "order_1",
      paymentId: "pay_1",
      amountPaise: 210000,
      channel: "UPI_INTENT",
      notes: { appointmentId: "a1" },
    });
  });

  it("treats order.paid like a capture", () => {
    const e = normalizeEvent(body("order.paid", { payment: { entity: payment({ method: "card" }) } }));
    assert.equal(e.kind, "captured");
    assert.equal(e.kind === "captured" && e.channel, "CARD");
  });

  it("normalises payment.failed with a reason", () => {
    const e = normalizeEvent(
      body("payment.failed", { payment: { entity: payment({ status: "failed", error_description: "Payment was cancelled" }) } }),
    );
    assert.deepEqual(e, { kind: "failed", event: "payment.failed", orderId: "order_1", paymentId: "pay_1", reason: "Payment was cancelled" });
  });

  it("normalises payment_link.paid", () => {
    const e = normalizeEvent(
      body("payment_link.paid", {
        payment_link: {
          entity: {
            id: "plink_9",
            amount: 255000,
            amount_paid: 255000,
            currency: "INR",
            status: "paid",
            short_url: "https://rzp.io/i/x",
            reference_id: null,
            description: null,
            expire_by: 0,
            notes: null,
            created_at: 0,
          },
        },
        payment: { entity: payment({ id: "pay_2", order_id: "order_link", amount: 255000, method: "netbanking" }) },
      }),
    );
    assert.deepEqual(e, {
      kind: "link_paid",
      event: "payment_link.paid",
      linkId: "plink_9",
      orderId: "order_link",
      paymentId: "pay_2",
      amountPaise: 255000,
      channel: "NET_BANKING",
    });
  });

  it("normalises refund.processed", () => {
    const e = normalizeEvent(
      body("refund.processed", {
        refund: {
          entity: { id: "rfnd_1", entity: "refund", amount: 100000, currency: "INR", payment_id: "pay_1", status: "processed", notes: [], created_at: 0 },
        },
        payment: { entity: payment({ amount_refunded: 210000 }) },
      }),
    );
    assert.equal(e.kind, "refund_processed");
    if (e.kind === "refund_processed") {
      assert.equal(e.refundedTotalPaise, 210000);
      assert.equal(isFullyRefunded(e, 210000), true);
      assert.equal(isFullyRefunded({ ...e, refundedTotalPaise: 100000 }, 210000), false);
    }
  });

  it("ignores unknown events and malformed payloads", () => {
    assert.deepEqual(normalizeEvent(body("subscription.charged", {})), { kind: "ignored", event: "subscription.charged" });
    assert.deepEqual(normalizeEvent(body("payment.captured", {})), { kind: "ignored", event: "payment.captured" });
  });
});

describe("webhookEventId / isWebhookBody", () => {
  it("prefers the header", () => {
    assert.equal(webhookEventId(" evt_abc ", body("payment.captured", { payment: { entity: payment() } })), "evt_abc");
  });
  it("derives a stable id from the payload", () => {
    assert.equal(webhookEventId(null, body("payment.captured", { payment: { entity: payment() } })), "payment.captured:pay_1");
    assert.equal(webhookEventId("", body("order.paid", { payment: { entity: payment() } })), "order.paid:pay_1");
  });
  it("validates the envelope", () => {
    assert.equal(isWebhookBody({ event: "x", payload: {} }), true);
    assert.equal(isWebhookBody({ event: 1, payload: {} }), false);
    assert.equal(isWebhookBody(null), false);
    assert.equal(isWebhookBody("x"), false);
  });
});
