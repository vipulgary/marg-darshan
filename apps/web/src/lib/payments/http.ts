import { Prisma } from "@/generated/prisma/client";
import { InvalidTransitionError } from "@/lib/booking/machine";
import { QuoteError } from "./plan";
import { RazorpayError, RazorpayNotConfiguredError } from "./razorpay";

/** A business-rule failure that maps directly onto an HTTP status. */
export class PaymentFlowError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "PaymentFlowError";
  }
}

const NO_STORE = { "Cache-Control": "no-store" };

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

export function jsonError(status: number, code: string, message?: string, extra?: Record<string, unknown>): Response {
  return json({ error: code, ...(message && { message }), ...extra }, status);
}

export function requireDb() {
  if (!process.env.DATABASE_URL) throw new PaymentFlowError(503, "db_not_configured", "Database is not configured");
}

export function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Maps known failures to JSON; anything unexpected is logged and returned as a generic 500. */
export function errorResponse(e: unknown, scope: string): Response {
  if (e instanceof PaymentFlowError) return jsonError(e.status, e.code, e.message !== e.code ? e.message : undefined);
  if (e instanceof QuoteError) return jsonError(400, e.code);
  if (e instanceof InvalidTransitionError) return jsonError(409, "invalid_status", e.message);
  if (e instanceof RazorpayNotConfiguredError) return jsonError(503, "payments_not_configured", e.message);
  if (e instanceof RazorpayError) {
    console.error(`[${scope}] Razorpay error`, e.status, e.body);
    return jsonError(502, "gateway_error", e.message);
  }
  if (e instanceof Prisma.PrismaClientInitializationError) {
    console.error(`[${scope}] database unavailable`, e.message);
    return jsonError(503, "db_unavailable");
  }
  console.error(`[${scope}] unexpected error`, e);
  return jsonError(500, "internal_error");
}
