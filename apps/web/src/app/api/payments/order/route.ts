import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { errorResponse, json, jsonError } from "@/lib/payments/http";
import { createCheckoutOrder } from "@/lib/payments/service";

const Body = z.object({
  appointmentId: z.uuid(),
  planType: z.enum(["FULL_UPFRONT", "SPLIT_PLAN"]),
});

export async function POST(req: Request) {
  const limit = rateLimit(`pay-order:${clientIp(req)}`, 20, 10 * 60_000);
  if (!limit.ok) return jsonError(429, "rate_limited", undefined, { retryAfterSec: limit.retryAfterSec });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid_request", z.prettifyError(parsed.error));
  try {
    return json(await createCheckoutOrder(parsed.data.appointmentId, parsed.data.planType));
  } catch (e) {
    return errorResponse(e, "payments/order");
  }
}
