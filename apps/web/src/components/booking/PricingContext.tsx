"use client";

import { type ReactNode, createContext, useContext, useMemo } from "react";
import { getService } from "@/content/catalog";
import type { ServiceLookup } from "@/lib/booking/pricing";
import { type BusinessSettings, serviceLookup } from "@/lib/settings/schema";

/**
 * Admin-edited prices (AMX-143) for the booking wizard, so the summary shows what the hold
 * and checkout will actually charge. Without a provider it falls back to catalog prices.
 */
const PricingContext = createContext<ServiceLookup>(getService);

export function PricingProvider({ services, children }: { services: BusinessSettings["services"]; children: ReactNode }) {
  const lookup = useMemo(() => serviceLookup({ services }), [services]);
  return <PricingContext.Provider value={lookup}>{children}</PricingContext.Provider>;
}

export const useServiceLookup = () => useContext(PricingContext);
