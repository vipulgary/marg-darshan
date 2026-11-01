import { type PlanType, type Service, type VisitMode, getService } from "@/content/catalog";

/** Price source; defaults to the static catalog. Server callers pass the admin-edited one (lib/settings). */
export type ServiceLookup = (slug: string) => Service | undefined;

export interface QuoteInput {
  serviceSlug: string;
  durationMin: number;
  mode: VisitMode;
  planType?: PlanType;
}

export interface Quote {
  totalInr: number;
  advanceInr: number;
  balanceInr: number;
  planType: PlanType;
}

export class QuoteError extends Error {
  constructor(public readonly code: "unknown_service" | "invalid_mode" | "invalid_duration") {
    super(code);
    this.name = "QuoteError";
  }
}

export function canSplit(serviceSlug: string, lookup: ServiceLookup = getService): boolean {
  const s = lookup(serviceSlug);
  return !!s?.splitAllowed && !!s.advancePct && s.advancePct > 0 && s.advancePct < 100;
}

/** Price for a booking. A split request on a service that doesn't allow it falls back to full payment. */
export function quote(
  { serviceSlug, durationMin, mode, planType = "FULL_UPFRONT" }: QuoteInput,
  lookup: ServiceLookup = getService,
): Quote {
  const service = lookup(serviceSlug);
  if (!service) throw new QuoteError("unknown_service");
  if (!service.modes.includes(mode)) throw new QuoteError("invalid_mode");
  const totalInr = service.prices[durationMin];
  if (!service.durations.includes(durationMin) || totalInr == null) throw new QuoteError("invalid_duration");

  if (planType === "SPLIT_PLAN" && canSplit(serviceSlug, lookup)) {
    const advanceInr = Math.round((totalInr * service.advancePct!) / 100);
    return { totalInr, advanceInr, balanceInr: totalInr - advanceInr, planType: "SPLIT_PLAN" };
  }
  return { totalInr, advanceInr: totalInr, balanceInr: 0, planType: "FULL_UPFRONT" };
}
