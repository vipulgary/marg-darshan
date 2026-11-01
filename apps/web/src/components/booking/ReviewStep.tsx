"use client";

import { useLocale, useTranslations } from "next-intl";
import { Checkbox, SelectableCard } from "@/components/ui/Choice";
import { Link } from "@/i18n/navigation";
import { intakeKind, usesAttachedProfile } from "@/lib/booking/draft";
import { canSplit } from "@/lib/booking/pricing";
import { serviceForProblem } from "@/lib/booking/schemas";
import { formatINR } from "@/lib/format";
import { useBookingStore } from "@/stores/booking";
import { useQuote } from "./BookingSummary";
import { useServiceLookup } from "./PricingContext";

function EditRow({ label, value, step }: { label: string; value: React.ReactNode; step: number }) {
  const t = useTranslations("booking.review");
  const goTo = useBookingStore((s) => s.goTo);
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line-subtle py-3 last:border-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-ink-3">{label}</span>
        <span className="text-[15px] text-ink-1">{value}</span>
      </div>
      <button
        type="button"
        onClick={() => goTo(step)}
        className="min-h-11 shrink-0 rounded-sm px-2 text-sm text-violet-300 hover:text-gold-300 focus-visible:ring-focus"
        aria-label={`${t("edit")}: ${label}`}
      >
        {t("edit")}
      </button>
    </div>
  );
}

export function ReviewStep({ err }: { err: (k: string) => string | undefined }) {
  const t = useTranslations("booking.review");
  const td = useTranslations("booking.details");
  const locale = useLocale();
  const s = useBookingStore();
  const service = serviceForProblem(s.problemSlug);
  const q = useQuote();
  const kind = intakeKind(s);
  const lookup = useServiceLookup();
  const split = service ? canSplit(service.slug, lookup) : false;

  const intake =
    kind === "vastu"
      ? [s.vastuAddress, s.vastuPlace?.placeName, s.propertyType && td(`propertyTypes.${s.propertyType}`), s.facing && td(`facings.${s.facing}`)]
          .filter(Boolean)
          .join(" · ")
      : usesAttachedProfile(s)
        ? td("profileAttached")
        : [s.dob, kind === "birth" ? s.tob : t("timeUnknown"), s.place?.placeName].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-lg border border-line-subtle bg-night-s2/50 px-4">
        <EditRow label={t("contact")} value={`${s.name} · ${s.email} · ${s.phone}`} step={2} />
        <EditRow label={kind === "vastu" ? t("property") : t("birth")} value={intake || "—"} step={2} />
        {s.floorPlan && <EditRow label={td("floorPlan")} value={s.floorPlan.name} step={2} />}
        {s.question.trim() && <EditRow label={t("question")} value={s.question} step={2} />}
      </div>

      {service && q && (
        <fieldset>
          <legend className="mb-4 text-lg font-semibold text-ink-1">{t("planLegend")}</legend>
          {split ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectableCard
                name="plan"
                value="FULL_UPFRONT"
                checked={s.planType === "FULL_UPFRONT"}
                onChange={() => s.update({ planType: "FULL_UPFRONT" })}
                title={t("full")}
                subtitle={formatINR(q.totalInr, locale)}
              />
              <SelectableCard
                name="plan"
                value="SPLIT_PLAN"
                checked={s.planType === "SPLIT_PLAN"}
                onChange={() => s.update({ planType: "SPLIT_PLAN" })}
                title={t("split", { pct: service.advancePct ?? 50 })}
                subtitle={t("splitDesc", {
                  advance: formatINR(Math.round((q.totalInr * (service.advancePct ?? 50)) / 100), locale),
                })}
              />
            </div>
          ) : (
            <p className="text-ink-2">{t("fullOnly", { amount: formatINR(q.totalInr, locale) })}</p>
          )}
        </fieldset>
      )}

      <div className="flex flex-col gap-2">
        <Checkbox
          checked={s.consent}
          onChange={(e) => s.update({ consent: e.target.checked })}
          aria-invalid={!!err("consent")}
          label={t.rich("consent", {
            privacy: (c) => (
              <Link href="/privacy" className="text-violet-300 underline underline-offset-2 hover:text-gold-300">
                {c}
              </Link>
            ),
            terms: (c) => (
              <Link href="/terms" className="text-violet-300 underline underline-offset-2 hover:text-gold-300">
                {c}
              </Link>
            ),
            refund: (c) => (
              <Link href="/refund-policy" className="text-violet-300 underline underline-offset-2 hover:text-gold-300">
                {c}
              </Link>
            ),
          })}
        />
        <p className="text-sm text-ink-3">{t("holdNote")}</p>
      </div>
    </div>
  );
}
