import { createHmac, timingSafeEqual } from "node:crypto";

/** Razorpay signatures are lowercase hex HMAC-SHA256 digests (64 chars). */
const HEX_SHA256 = /^[0-9a-f]{64}$/i;

export function hmacSha256Hex(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data, "utf8").digest("hex");
}

function safeEqualHex(expectedHex: string, received: unknown): boolean {
  if (typeof received !== "string" || !HEX_SHA256.test(received)) return false;
  const a = Buffer.from(expectedHex, "utf8");
  const b = Buffer.from(received.toLowerCase(), "utf8");
  // timingSafeEqual throws on unequal lengths; the regex already guarantees 64, this is belt and braces.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.length > 0;

/** Checkout handler signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string, secret: string): boolean {
  if (!nonEmpty(orderId) || !nonEmpty(paymentId) || !nonEmpty(secret)) return false;
  return safeEqualHex(hmacSha256Hex(`${orderId}|${paymentId}`, secret), signature);
}

/** Webhook signature (X-Razorpay-Signature): HMAC_SHA256(raw request body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string | null | undefined, secret: string): boolean {
  if (typeof rawBody !== "string" || rawBody.length === 0 || !nonEmpty(secret)) return false;
  return safeEqualHex(hmacSha256Hex(rawBody, secret), signature);
}
