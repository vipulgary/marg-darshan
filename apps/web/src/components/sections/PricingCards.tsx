import { getTranslations } from "next-intl/server";
import { GradientBorder } from "@/components/effects";
import { Badge } from "@/components/ui/Display";
import { PLANS, type Plan, type PlanType, type Service, type VisitMode, getService, pick } from "@/content/catalog";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import { ctaClass } from "./cta";
import { CheckIcon } from "./icons";
import { serviceBookHref } from "./links";

export interface PriceCardData {
  id: string;
  name: string;
  serviceLabel?: string;
  priceInr: number;
  durationMin: number;
  modes: VisitMode[];
  planType: PlanType;
  advancePct?: number;
  featured?: boolean;
  /** null → generic per-duration features */
  features: string[] | null;
  href: string;
}

export function planCard(plan: Plan, locale: string, withService = false): PriceCardData {
  const service = getService(plan.serviceSlug);
  return {
    id: plan.slug,
    name: pick(plan.name, locale),
    serviceLabel: withService && service ? pick(service.title, locale) : undefined,
    priceInr: plan.priceInr,
    durationMin: plan.durationMin,
    modes: service?.modes ?? ["ONLINE_ZOOM"],
    planType: plan.planType,
    advancePct: plan.advancePct,
    featured: plan.featured,
    features: plan.features.map((f) => pick(f, locale)),
    href: serviceBookHref(plan.serviceSlug),
  };
}

/** One card per bookable duration; a matching PLAN (same service + duration) lends its name and features. */
export function serviceCards(service: Service, locale: string, durationName: (min: number) => string): PriceCardData[] {
  return service.durations.map((min) => {
    const plan = PLANS.find((p) => p.serviceSlug === service.slug && p.durationMin === min);
    if (plan) return { ...planCard(plan, locale), priceInr: service.prices[min] ?? plan.priceInr, modes: service.modes };
    return {
      id: `${service.slug}-${min}`,
      name: durationName(min),
      priceInr: service.prices[min],
      durationMin: min,
      modes: service.modes,
      planType: service.splitAllowed ? "SPLIT_PLAN" : "FULL_UPFRONT",
      advancePct: service.advancePct,
      features: null,
      href: serviceBookHref(service.slug),
    };
  });
}

/** design.md §7.3 pricing cards; the featured one gets the animated gradient border + violet glow. */
export async function PricingCards({ items, locale }: { items: PriceCardData[]; locale: string }) {
  const t = await getTranslations("pages.shared.pricing");
  const tUi = await getTranslations("ui");
  const cols = items.length >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : items.length === 2 ? "md:grid-cols-2 lg:max-w-4xl lg:mx-auto" : "max-w-md";

  return (
    <ul className={cn("grid items-stretch gap-6 lg:gap-8", cols)}>
      {items.map((item) => {
        const split = item.planType === "SPLIT_PLAN" && item.advancePct;
        const advance = split ? Math.round((item.priceInr * (item.advancePct ?? 0)) / 100) : 0;
        const card = (
          <div
            className={cn(
              "relative flex h-full flex-col gap-5 rounded-lg bg-night-s1 p-6 md:p-7",
              item.featured ? "shadow-glow-violet" : "border border-line shadow-e1",
            )}
          >
            <div className="flex min-h-[26px] flex-wrap gap-2">
              {item.featured && <Badge tone="gold">{tUi("popular")}</Badge>}
              {item.planType === "SPLIT_PLAN" && <Badge tone="violet">{t("splitBadge")}</Badge>}
            </div>
            <div className="flex flex-col gap-1">
              {item.serviceLabel && <p className="text-[13px] font-medium text-ink-3">{item.serviceLabel}</p>}
              <h3 className="text-2xl leading-snug">{item.name}</h3>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-[40px] font-bold leading-none tracking-[-0.02em] text-ink-1 tabular-nums">
                {formatINR(item.priceInr, locale)}
              </p>
              {split ? (
                <p className="text-sm text-warning">
                  {t("advance", { amount: formatINR(advance, locale), pct: item.advancePct ?? 0 })}
                </p>
              ) : (
                <p className="text-sm text-ink-3">{t("fullUpfront")}</p>
              )}
            </div>
            <ul className="flex flex-wrap gap-2" aria-label={t("chipsLabel")}>
              <li>
                <Badge tone="neutral">{t("minutes", { count: item.durationMin })}</Badge>
              </li>
              {item.modes.map((m) => (
                <li key={m}>
                  <Badge tone="neutral">{m === "ONLINE_ZOOM" ? t("online") : t("visit")}</Badge>
                </li>
              ))}
            </ul>
            <ul className="flex flex-col gap-2.5 border-t border-line-subtle pt-5">
              {(item.features ?? [t("generic.f1", { minutes: item.durationMin }), t("generic.f2"), t("generic.f3")]).map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[15px] text-ink-2">
                  <CheckIcon className="mt-0.5 h-[18px] w-[18px] text-gold-300" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={item.href}
              className={ctaClass(item.featured ? "primary" : "secondary", "md", "mt-auto w-full")}
            >
              {t("cta")}
            </Link>
          </div>
        );
        return (
          <li key={item.id} className={cn("h-full", item.featured && "lg:scale-[1.03]")}>
            {item.featured ? (
              <GradientBorder animated className="h-full rounded-lg">
                {card}
              </GradientBorder>
            ) : (
              card
            )}
          </li>
        );
      })}
    </ul>
  );
}
