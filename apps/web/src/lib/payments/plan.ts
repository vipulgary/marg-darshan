/**
 * Pricing for checkout (AMX-080/083). Computed from the shared catalog on the server so
 * the client can never choose its own amount. Amounts are whole INR; Razorpay wants paise.
 */
import { getService, type PlanType } from "@/content/catalog";
import type { ServiceLookup } from "@/lib/booking/pricing";

export interface Quote {
  serviceSlug: string;
  durationMin: number;
  planType: PlanType;
  totalInr: number;
  /** 100 for a full upfront payment */
  advancePct: number;
  advanceInr: number;
  balanceInr: number;
}

export interface Installment {
  installmentNo: 1 | 2;
  amountInr: number;
  dueAt: Date;
}

export type QuoteErrorCode = "unknown_service" | "invalid_duration" | "split_not_allowed";

export class QuoteError extends Error {
  constructor(public readonly code: QuoteErrorCode) {
    super(code);
    this.name = "QuoteError";
  }
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** Razorpay rejects payment links whose expire_by is less than 15 minutes away. */
export const MIN_LINK_LIFETIME_MS = 20 * MINUTE;
/** Razorpay's minimum order amount is ₹1. */
export const MIN_ORDER_PAISE = 100;
export const DEFAULT_ADVANCE_PCT = 50;

export function isSplitAllowed(serviceSlug: string, lookup: ServiceLookup = getService): boolean {
  return lookup(serviceSlug)?.splitAllowed ?? false;
}

/** `lookup` is the price source: the static catalog by default, lib/settings getServiceLookup() on the server. */
export function quoteFor(
  {
    serviceSlug,
    durationMin,
    planType,
  }: {
    serviceSlug: string;
    durationMin: number;
    planType: PlanType;
  },
  lookup: ServiceLookup = getService,
): Quote {
  const service = lookup(serviceSlug);
  if (!service) throw new QuoteError("unknown_service");
  const totalInr = service.prices[durationMin];
  if (!service.durations.includes(durationMin) || !Number.isInteger(totalInr) || totalInr <= 0) {
    throw new QuoteError("invalid_duration");
  }
  if (planType === "SPLIT_PLAN") {
    if (!service.splitAllowed) throw new QuoteError("split_not_allowed");
    const advancePct = Math.min(99, Math.max(1, service.advancePct ?? DEFAULT_ADVANCE_PCT));
    const advanceInr = Math.round((totalInr * advancePct) / 100);
    return { serviceSlug, durationMin, planType, totalInr, advancePct, advanceInr, balanceInr: totalInr - advanceInr };
  }
  return { serviceSlug, durationMin, planType: "FULL_UPFRONT", totalInr, advancePct: 100, advanceInr: totalInr, balanceInr: 0 };
}

/**
 * When the split-plan balance falls due — also the expiry of its Razorpay payment link.
 * Prefers N days before the slot, then 1h before; never sooner than Razorpay's minimum link lifetime.
 */
export function balanceDueAt(slotStart: Date, now: Date = new Date(), daysBefore = balanceDaysBefore()): Date {
  const floor = now.getTime() + MIN_LINK_LIFETIME_MS;
  for (const candidate of [slotStart.getTime() - daysBefore * DAY, slotStart.getTime() - HOUR]) {
    if (candidate >= floor) return new Date(candidate);
  }
  return new Date(floor);
}

export function balanceDaysBefore(): number {
  const n = Number(process.env.PAYMENT_BALANCE_DAYS_BEFORE);
  return Number.isFinite(n) && n >= 0 ? n : 1;
}

export function installments(
  quote: Quote,
  { now = new Date(), slotStart, daysBefore }: { now?: Date; slotStart?: Date; daysBefore?: number } = {},
): Installment[] {
  if (quote.planType === "FULL_UPFRONT" || quote.balanceInr <= 0) {
    return [{ installmentNo: 1, amountInr: quote.totalInr, dueAt: now }];
  }
  const dueAt = slotStart ? balanceDueAt(slotStart, now, daysBefore) : new Date(now.getTime() + MIN_LINK_LIFETIME_MS);
  return [
    { installmentNo: 1, amountInr: quote.advanceInr, dueAt: now },
    { installmentNo: 2, amountInr: quote.balanceInr, dueAt },
  ];
}

/** INR → integer paise, rounding half-up on the decimal value (10.005 → 1001, not 1000). */
export function toPaise(inr: number): number {
  if (!Number.isFinite(inr) || inr < 0) throw new RangeError(`invalid INR amount: ${inr}`);
  const s = String(inr);
  // Shift the decimal point textually so binary float error (10.005 * 100 = 1000.4999…) can't bite.
  return s.includes("e") ? Math.round(inr * 100) : Math.round(Number(`${s}e2`));
}

export function fromPaise(paise: number): number {
  if (!Number.isInteger(paise) || paise < 0) throw new RangeError(`invalid paise amount: ${paise}`);
  return paise / 100;
}
