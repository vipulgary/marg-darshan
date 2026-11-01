import { after } from "next/server";
import { errorResponse, json } from "@/lib/payments/http";
import { processRazorpayWebhook, runWebhookEffects } from "@/lib/payments/service";

export async function POST(req: Request) {
  // The signature covers the exact bytes, so read the raw text before any parsing.
  const rawBody = await req.text();
  try {
    const result = await processRazorpayWebhook({
      rawBody,
      signature: req.headers.get("x-razorpay-signature"),
      eventIdHeader: req.headers.get("x-razorpay-event-id"),
    });
    if (result.effects.length) after(() => runWebhookEffects(result.effects));
    return json(result.body, result.status);
  } catch (e) {
    // Non-2xx makes Razorpay retry; the idempotency row was rolled back with the transaction.
    return errorResponse(e, "payments/webhook");
  }
}
