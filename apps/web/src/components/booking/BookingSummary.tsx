"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { getProblem, pick } from "@/content/catalog";
import { quote } from "@/lib/booking/pricing";
import { serviceForProblem } from "@/lib/booking/schemas";
import { cn } from "@/lib/cn";
import { formatDateIST, formatINR, formatSlotRange } from "@/lib/format";
import { useBookingStore } from "@/stores/booking";
import { HoldCountdown } from "./HoldCountdown";
import { useNow } from "./useNow";
import { Icon } from "@/components/icons";
import { useServiceLookup } from "./PricingContext";

export function useQuote() {
  const { problemSlug, mode, durationMin, planType } = useBookingStore();
  const lookup = useServiceLookup();
  const service = serviceForProblem(problemSlug);
  if (!service || !durationMin) return null;
  try {
    return quote({ serviceSlug: service.slug, durationMin, mode: mode || service.modes[0], planType }, lookup);
  } catch {
    return null;
  }
}

/** Live hold (if the stored one has not run out). */
export function useActiveHold() {
  const hold = useBookingStore((s) => s.hold);
  const now = useNow(!!hold);
  return hold && now && new Date(hold.holdExpiresAt).getTime() > now ? hold : null;
}

function Rows() {
  const t = useTranslations("booking.summary");
  const tm = useTranslations("booking.mode");
  const locale = useLocale();
  const { problemSlug, mode, durationMin, slotStart } = useBookingStore();
  const problem = getProblem(problemSlug);
  const service = serviceForProblem(problemSlug);
  const q = useQuote();
  const hold = useActiveHold();
  const dash = <span className="text-ink-3">—</span>;
  const rows: [string, React.ReactNode][] = [
    [t("problem"), problem ? pick(problem.title, locale) : dash],
    [t("service"), service ? pick(service.title, locale) : dash],
    [t("mode"), mode ? tm(`${mode}.title`) : dash],
    [t("duration"), durationMin ? tm("minutes", { count: durationMin }) : dash],
    [
      t("slot"),
      slotStart && durationMin ? (
        <>
          {formatDateIST(slotStart, locale, { weekday: "short", day: "numeric", month: "short" })}
          <br />
          {formatSlotRange(slotStart, new Date(new Date(slotStart).getTime() + durationMin * 60_000), locale)} IST
        </>
      ) : (
        dash
      ),
    ],
  ];
  return (
    <>
      <dl className="flex flex-col gap-3 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-ink-3">{k}</dt>
            <dd className="text-right text-ink-1">{v}</dd>
          </div>
        ))}
      </dl>
      {q && (
        <div className="mt-5 flex flex-col gap-2 border-t border-line-subtle pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-ink-2">{t("total")}</span>
            <span className="font-display text-2xl text-gold-200">{formatINR(q.totalInr, locale)}</span>
          </div>
          {q.planType === "SPLIT_PLAN" && (
            <p className="text-sm text-ink-3">
              {t("splitNote", { advance: formatINR(q.advanceInr, locale), balance: formatINR(q.balanceInr, locale) })}
            </p>
          )}
        </div>
      )}
      {hold && <HoldCountdown expiresAt={hold.holdExpiresAt} className="mt-4" />}
    </>
  );
}

export function BookingSummary() {
  const t = useTranslations("booking.summary");
  const reset = useBookingStore((s) => s.reset);
  return (
    <aside aria-label={t("title")} className="rounded-lg border border-line bg-night-s1 p-6 shadow-e1">
      <h2 className="mb-5 text-lg font-semibold text-ink-1">{t("title")}</h2>
      <Rows />
      <button
        type="button"
        onClick={reset}
        className="mt-6 min-h-11 text-sm text-ink-3 underline-offset-4 hover:text-ink-1 hover:underline focus-visible:ring-focus rounded-sm"
      >
        {t("startOver")}
      </button>
    </aside>
  );
}

/** Mobile: collapsible bottom sheet with the price always visible. */
export function MobileSummaryBar() {
  const t = useTranslations("booking.summary");
  const locale = useLocale();
  const q = useQuote();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div
        id={panelId}
        hidden={!open}
        className="max-h-[60vh] overflow-y-auto rounded-t-xl border border-b-0 border-line bg-night-s1 p-5 shadow-e3"
      >
        <Rows />
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-16 w-full items-center justify-between gap-4 border-t border-line bg-night-s1/90 px-4 backdrop-blur-xl focus-visible:ring-focus",
          "pb-[env(safe-area-inset-bottom)]",
        )}
      >
        <span className="flex flex-col items-start">
          <span className="text-xs text-ink-3">{t("total")}</span>
          <span className="font-display text-xl text-gold-200">{q ? formatINR(q.totalInr, locale) : "—"}</span>
        </span>
        <span className="flex items-center gap-2 text-sm text-ink-2">
          {open ? t("hide") : t("show")}
          <Icon name="chevron-up" size={16} className={cn("transition-transform", open && "rotate-180")} />
        </span>
      </button>
    </div>
  );
}
