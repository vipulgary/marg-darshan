"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Display";
import { formatDateIST, formatSlotRange } from "@/lib/format";
import { serviceForProblem } from "@/lib/booking/schemas";
import { IST_OFFSET_MIN, type SlotDay, istDateKey } from "@/lib/booking/slots";
import { cn } from "@/lib/cn";
import { useBookingStore } from "@/stores/booking";
import { HoldCountdown } from "./HoldCountdown";
import { useNow } from "./useNow";

type Load = { key: string; status: "ready"; days: SlotDay[] } | { key: string; status: "error" };

const noonOf = (date: string) => new Date(`${date}T12:00:00+05:30`);

function localTimeNote(iso: string, locale: string): string | null {
  const start = new Date(iso);
  // getTimezoneOffset is minutes *behind* UTC, so IST is -330.
  if (start.getTimezoneOffset() === -IST_OFFSET_MIN) return null;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const time = new Intl.DateTimeFormat(locale === "en" ? "en-IN" : "hi-IN", { hour: "numeric", minute: "2-digit", weekday: "short" }).format(start);
  return `${time} (${tz.replace(/_/g, " ")})`;
}

export function SlotStep({ refreshKey }: { refreshKey: number }) {
  const t = useTranslations("booking.slot");
  const locale = useLocale();
  const { problemSlug, mode, durationMin, slotDate, slotStart, hold, update } = useBookingStore();
  const service = serviceForProblem(problemSlug);
  const [load, setLoad] = useState<Load | null>(null);
  const [retry, setRetry] = useState(0);
  const now = useNow(!!hold);
  const holdLive = !!hold && !!now && new Date(hold.holdExpiresAt).getTime() > now;

  const queryKey = `${service?.slug}|${mode}|${durationMin}|${refreshKey}|${retry}`;
  useEffect(() => {
    if (!service || !mode || !durationMin) return;
    const ctrl = new AbortController();
    const q = new URLSearchParams({ service: service.slug, mode, duration: String(durationMin), days: "14" });
    fetch(`/api/booking/slots?${q}`, { signal: ctrl.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { days: SlotDay[] };
        setLoad({ key: queryKey, status: "ready", days: body.days });
        const state = useBookingStore.getState();
        const all = body.days.flatMap((d) => d.slots);
        const ownHold = state.hold && new Date(state.hold.holdExpiresAt).getTime() > Date.now() ? state.hold.slotStart : null;
        // drop a remembered slot that is gone, then default to the first day with free slots
        if (state.slotStart && state.slotStart !== ownHold && !all.some((s) => s.start === state.slotStart && s.available))
          state.update({ slotStart: null });
        if (!body.days.some((d) => d.date === state.slotDate && !d.closed && d.slots.length)) {
          const first = body.days.find((d) => d.availableCount > 0);
          state.update({ slotDate: first?.date ?? body.days[0]?.date ?? null });
        }
      })
      .catch((e: unknown) => {
        if ((e as Error).name !== "AbortError") setLoad({ key: queryKey, status: "error" });
      });
    return () => ctrl.abort();
  }, [queryKey, service, mode, durationMin]);

  const current = load?.key === queryKey ? load : null;
  if (!current)
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <span className="sr-only" aria-live="polite">
          {t("loading")}
        </span>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-[76px] w-16 shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-11 rounded-full" />
          ))}
        </div>
      </div>
    );

  if (current.status === "error")
    return (
      <div role="alert" className="flex flex-col items-start gap-4 rounded-lg border border-error/40 bg-error/8 p-6">
        <p className="text-ink-1">{t("error")}</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => setRetry((r) => r + 1)}>
          {t("retry")}
        </Button>
      </div>
    );

  const days = current.days;
  const today = days[0]?.date;
  const day = days.find((d) => d.date === slotDate) ?? days[0];
  const ownSlot = holdLive ? hold!.slotStart : null;
  const note = slotStart ? localTimeNote(slotStart, locale) : null;

  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label={t("daysLabel")} className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
        {days.map((d) => {
          const full = d.closed || d.availableCount === 0;
          const selected = d.date === day?.date;
          const date = noonOf(d.date);
          return (
            <button
              key={d.date}
              type="button"
              aria-pressed={selected}
              disabled={full}
              onClick={() => update({ slotDate: d.date })}
              aria-label={`${formatDateIST(date, locale, { weekday: "long", day: "numeric", month: "long" })} — ${
                d.closed ? t("closed") : full ? t("fullyBooked") : t("availableCount", { count: d.availableCount })
              }`}
              className={cn(
                "relative flex h-[76px] w-16 shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-md border text-center transition-colors focus-visible:ring-focus",
                selected ? "border-transparent bg-grad-gold text-ink-ongold" : "border-line text-ink-2 hover:border-gold-300 hover:text-ink-1",
                full && "opacity-40 line-through",
              )}
            >
              <span className="text-xs">{formatDateIST(date, locale, { weekday: "short" })}</span>
              <span className="text-xl font-semibold leading-none">{formatDateIST(date, locale, { day: "numeric" })}</span>
              <span className="text-[11px]">{formatDateIST(date, locale, { month: "short" })}</span>
              {d.date === today && (
                <span aria-hidden className={cn("absolute bottom-1 h-1 w-1 rounded-full", selected ? "bg-ink-ongold" : "bg-saffron-400")} />
              )}
            </button>
          );
        })}
      </div>

      {day && (
        <fieldset>
          <legend className="mb-3 text-base font-semibold text-ink-1">
            {formatDateIST(noonOf(day.date), locale, { weekday: "long", day: "numeric", month: "long" })}
          </legend>
          {day.slots.length === 0 ? (
            <p className="text-ink-3">{day.closed ? t("closed") : t("fullyBooked")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {day.slots.map((slot) => {
                const mine = slot.start === ownSlot;
                const available = slot.available || mine;
                const selected = slot.start === slotStart;
                const label = formatSlotRange(slot.start, slot.end, locale);
                return (
                  <button
                    key={slot.start}
                    type="button"
                    disabled={!available}
                    aria-pressed={selected}
                    aria-label={available ? label : `${label} — ${t("unavailable")}`}
                    onClick={() => update({ slotStart: slot.start, slotDate: istDateKey(new Date(slot.start)) })}
                    className={cn(
                      "h-11 rounded-full border text-[15px] tabular-nums transition-[border-color,color,box-shadow] focus-visible:ring-focus",
                      selected
                        ? "border-transparent bg-grad-gold font-semibold text-ink-ongold shadow-glow-gold"
                        : available
                          ? "border-line text-ink-2 hover:border-gold-300 hover:text-ink-1"
                          : "border-line-subtle text-ink-3 line-through opacity-35",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>
      )}

      {ownSlot && slotStart === ownSlot && <HoldCountdown expiresAt={hold!.holdExpiresAt} />}

      <p className="text-sm text-ink-3" aria-live="polite">
        {t("istNote")}
        {note && <> · {t("localTime", { time: note })}</>}
      </p>
    </div>
  );
}
