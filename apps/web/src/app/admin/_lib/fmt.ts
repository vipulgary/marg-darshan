import type { AppointmentStatus, PaymentStatus } from "@/generated/prisma/enums";

const TZ = "Asia/Kolkata";

export const fmtDateTime = (d: Date | null | undefined) =>
  d
    ? d.toLocaleString("en-IN", { timeZone: TZ, weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })
    : "—";

export const fmtDate = (d: Date | null | undefined) =>
  d ? d.toLocaleDateString("en-IN", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtInr = (inr: number) => `₹${inr.toLocaleString("en-IN")}`;

/** Start/end of "today" in IST as UTC instants. */
export function istDayRange(now = new Date()) {
  const offset = 5.5 * 3600 * 1000;
  const ist = new Date(now.getTime() + offset);
  const start = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - offset);
  return { start, end: new Date(start.getTime() + 24 * 3600 * 1000) };
}

export const STATUS_TONE: Record<AppointmentStatus, "gold" | "violet" | "success" | "warning" | "error" | "neutral"> = {
  DRAFT: "neutral",
  HELD: "warning",
  PENDING_PAYMENT: "warning",
  PARTIALLY_PAID: "violet",
  CONFIRMED: "success",
  COMPLETED: "neutral",
  CANCELLED: "error",
  EXPIRED: "neutral",
  NO_SHOW: "error",
  REFUNDED: "violet",
};

export const PAYMENT_TONE: Record<PaymentStatus, "success" | "warning" | "error" | "violet"> = {
  CREATED: "warning",
  CAPTURED: "success",
  FAILED: "error",
  REFUNDED: "violet",
};

export const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
