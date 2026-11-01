import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { errorResponse, json, jsonError } from "@/lib/payments/http";
import { refundAppointment } from "@/lib/payments/service";

const Body = z.object({
  appointmentId: z.uuid(),
  /** omit for a full refund of everything captured */
  amountInr: z.number().positive().max(10_000_000).optional(),
  reason: z.string().max(200).optional(),
});

function authorized(req: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  const given = req.headers.get("x-admin-token");
  if (!expected || !given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!process.env.ADMIN_TOKEN) return jsonError(503, "admin_not_configured");
  if (!authorized(req)) return jsonError(401, "unauthorized");
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "invalid_request", z.prettifyError(parsed.error));
  try {
    return json(await refundAppointment(parsed.data));
  } catch (e) {
    return errorResponse(e, "payments/refund");
  }
}
