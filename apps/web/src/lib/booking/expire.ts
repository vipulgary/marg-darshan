import { db } from "@/lib/db";
import { HOLD_STATUSES } from "./hold";
import { transition } from "./machine";

/** AMX-077: move unpaid holds past their expiry to EXPIRED. Race-safe: each update re-checks the status. */
export async function expireHolds(now: Date = new Date()): Promise<{ expired: number }> {
  let expired = 0;
  for (const status of HOLD_STATUSES) {
    const r = await db.appointment.updateMany({
      where: { status, holdExpiresAt: { lte: now } },
      data: { status: transition(status, "HOLD_EXPIRED") },
    });
    expired += r.count;
  }
  return { expired };
}
