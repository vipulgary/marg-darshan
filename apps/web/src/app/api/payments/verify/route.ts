import { z } from "zod";
import { json, jsonError } from "@/lib/payments/http";
import { verifyCheckoutSignature } from "@/lib/payments/signature";

const Body = z.object({
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(128),
});

/** Checks the Checkout handler signature only. Confirmation happens on the webhook, never here. */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return jsonError(503, "payments_not_configured");
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid_request");
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;
  const ok = verifyCheckoutSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, secret);
  return ok ? json({ ok: true }) : json({ ok: false, error: "invalid_signature" }, 400);
}
