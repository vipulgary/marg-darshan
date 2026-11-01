import { SETTINGS } from "@/content/catalog";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export type ManageReason = "ok" | "too_late" | "past" | "cancelled" | "not_manageable";

export interface ManageOptions {
  canReschedule: boolean;
  canCancel: boolean;
  /** Cancelling now refunds the amount paid (refund policy: cancelled ≥ cancellationHours before the slot). */
  refundEligible: boolean;
  reason: ManageReason;
}

export const MANAGEABLE: AppointmentStatus[] = ["CONFIRMED", "PARTIALLY_PAID"];

const none = (reason: ManageReason): ManageOptions => ({ canReschedule: false, canCancel: false, refundEligible: false, reason });

/** Final Plan §4.1: more than `hours` before the slot → free reschedule or cancel; later → WhatsApp only. */
export function manageOptions(
  slotStart: Date | string,
  now: Date,
  status: AppointmentStatus,
  hours: number = SETTINGS.cancellationHours,
): ManageOptions {
  if (status === "CANCELLED" || status === "REFUNDED") return none("cancelled");
  if (!MANAGEABLE.includes(status)) return none("not_manageable");
  const lead = new Date(slotStart).getTime() - now.getTime();
  if (lead <= 0) return none("past");
  if (lead < hours * 3_600_000) return none("too_late");
  return { canReschedule: true, canCancel: true, refundEligible: true, reason: "ok" };
}
