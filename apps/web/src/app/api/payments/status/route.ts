import type { NextRequest } from "next/server";
import { connection } from "next/server";
import { UUID_RE, errorResponse, json, jsonError } from "@/lib/payments/http";
import { getPaymentStatus } from "@/lib/payments/service";

export async function GET(req: NextRequest) {
  await connection();
  const id = req.nextUrl.searchParams.get("appointmentId") ?? "";
  if (!UUID_RE.test(id)) return jsonError(400, "invalid_request");
  try {
    const status = await getPaymentStatus(id);
    return status ? json(status) : jsonError(404, "not_found");
  } catch (e) {
    return errorResponse(e, "payments/status");
  }
}
