/**
 * Appointment state machine (Final Plan §4.1). Status changes only through
 * `transition`; payment-driven events come from verified webhooks only.
 *
 * DRAFT → HELD(10m) → PENDING_PAYMENT → CONFIRMED → COMPLETED
 *                          └→ PARTIALLY_PAID → CONFIRMED   (split plan)
 * HELD/PENDING_PAYMENT → EXPIRED · CONFIRMED → CANCELLED / REFUNDED / NO_SHOW
 */
import type { AppointmentStatus } from "@/generated/prisma/enums";

export type AppointmentEvent =
  | "HOLD"
  | "START_PAYMENT"
  | "PAYMENT_CAPTURED"
  | "ADVANCE_CAPTURED"
  | "BALANCE_CAPTURED"
  | "PAYMENT_FAILED"
  | "HOLD_EXPIRED"
  | "CANCEL"
  | "REFUND"
  | "COMPLETE"
  | "NO_SHOW";

const TRANSITIONS: Partial<Record<AppointmentStatus, Partial<Record<AppointmentEvent, AppointmentStatus>>>> = {
  DRAFT: { HOLD: "HELD", CANCEL: "CANCELLED" },
  HELD: { START_PAYMENT: "PENDING_PAYMENT", HOLD_EXPIRED: "EXPIRED", CANCEL: "CANCELLED" },
  PENDING_PAYMENT: {
    PAYMENT_CAPTURED: "CONFIRMED",
    ADVANCE_CAPTURED: "PARTIALLY_PAID",
    // A failed attempt keeps the hold so the user can retry until it expires.
    PAYMENT_FAILED: "PENDING_PAYMENT",
    START_PAYMENT: "PENDING_PAYMENT",
    HOLD_EXPIRED: "EXPIRED",
    CANCEL: "CANCELLED",
  },
  PARTIALLY_PAID: { BALANCE_CAPTURED: "CONFIRMED", CANCEL: "CANCELLED", REFUND: "REFUNDED" },
  CONFIRMED: { COMPLETE: "COMPLETED", NO_SHOW: "NO_SHOW", CANCEL: "CANCELLED", REFUND: "REFUNDED" },
  CANCELLED: { REFUND: "REFUNDED" },
  // A webhook can arrive after the hold expired; capture still confirms (the slot is re-checked by the caller).
  EXPIRED: { PAYMENT_CAPTURED: "CONFIRMED", ADVANCE_CAPTURED: "PARTIALLY_PAID" },
};

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: AppointmentStatus,
    public readonly event: AppointmentEvent,
  ) {
    super(`invalid appointment transition: ${from} --${event}-->`);
    this.name = "InvalidTransitionError";
  }
}

export function canTransition(from: AppointmentStatus, event: AppointmentEvent): boolean {
  return TRANSITIONS[from]?.[event] !== undefined;
}

export function transition(from: AppointmentStatus, event: AppointmentEvent): AppointmentStatus {
  const next = TRANSITIONS[from]?.[event];
  if (!next) throw new InvalidTransitionError(from, event);
  return next;
}

/** Statuses that occupy a calendar slot (used by availability + the double-booking guard). */
export const SLOT_BLOCKING: AppointmentStatus[] = ["HELD", "PENDING_PAYMENT", "PARTIALLY_PAID", "CONFIRMED"];

export const isTerminal = (s: AppointmentStatus) =>
  s === "COMPLETED" || s === "REFUNDED" || s === "NO_SHOW" || s === "EXPIRED";
