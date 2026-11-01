"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { DashaPeriod } from "@/lib/contracts";
import { type ChartLang, PLANET_COLORS, PLANET_NAMES, dashaProgress, periodYears, timelinePeriods } from "@/lib/kundali/chart-layout";

function monthYear(iso: string, lang: ChartLang): string {
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { month: "short", year: "numeric", timeZone: "UTC", numberingSystem: "latn" }).format(
    new Date(`${iso.slice(0, 10)}T00:00:00Z`),
  );
}

/** AMX-063 — horizontal mahadasha timeline (design.md §7.6); tap a segment for its antardashas. */
export function DashaTimeline({ vimshottari, lang }: { vimshottari: DashaPeriod[]; lang: ChartLang }) {
  const t = useTranslations("kundali.dasha");
  const panelId = useId();
  const progress = dashaProgress(vimshottari);
  const periods = timelinePeriods(vimshottari);
  const [open, setOpen] = useState<number | null>(progress?.current.antardashas?.length ? progress.index : null);
  const scroller = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const s = scroller.current;
    const el = currentRef.current;
    if (s && el) s.scrollLeft = el.offsetLeft - (s.clientWidth - el.clientWidth) / 2;
  }, []);

  if (!periods.length) return <p className="text-ink-3">{t("none")}</p>;
  const selected = open !== null ? periods[open] : null;

  return (
    <div className="flex flex-col gap-6">
      {progress && (
        <div className="rounded-lg border border-line-gold bg-saffron-500/8 p-5">
          <p className="text-sm text-gold-300">{t("current")}</p>
          <p className="mt-1 text-xl font-semibold text-ink-1">
            {PLANET_NAMES[lang][progress.current.lord]}{" "}
            <span className="text-base font-normal text-ink-2">
              · {monthYear(progress.current.start, lang)} – {monthYear(progress.current.end, lang)}
            </span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-night-s3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.percent)} aria-label={t("current")}>
            <div className="h-full bg-grad-gold" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="mt-2 text-sm text-ink-3">
            {t("elapsed", { percent: Math.round(progress.percent) })}
            {progress.antardasha && ` · ${t("currentAntardasha", { lord: PLANET_NAMES[lang][progress.antardasha.period.lord] })}`}
          </p>
        </div>
      )}

      <div>
        <h3 className="mb-1 text-lg">{t("title")}</h3>
        <p className="mb-3 text-[13px] text-ink-3">{t("scrollHint")}</p>
        <div ref={scroller} className="overflow-x-auto pb-3 pt-4" role="group" aria-label={t("timeline")}>
          <div className="flex min-w-max gap-1.5">
            {periods.map((p, i) => {
              const isNow = progress?.index === i;
              const color = PLANET_COLORS[p.lord];
              const years = periodYears(p);
              return (
                <button
                  key={`${p.lord}-${p.start}`}
                  ref={isNow ? currentRef : undefined}
                  type="button"
                  aria-expanded={open === i}
                  aria-controls={panelId}
                  aria-current={isNow ? "true" : undefined}
                  onClick={() => setOpen(open === i ? null : i)}
                  style={{ width: `${Math.max(84, years * 11)}px`, background: `${color}1f`, borderTopColor: color }}
                  className={cn(
                    "relative flex min-h-[72px] flex-col items-start justify-center gap-0.5 rounded-sm border-t-[3px] px-3 py-2 text-left transition-colors hover:bg-white/8 focus-visible:ring-focus",
                    isNow && "outline-2 outline-offset-2 outline-saffron-400 outline",
                    open === i && "bg-white/10",
                  )}
                >
                  {isNow && (
                    <span className="absolute -top-3.5 right-2 rounded-xs bg-grad-gold px-1.5 text-[11px] font-bold text-ink-ongold">{t("now")}</span>
                  )}
                  <span className="text-sm font-semibold text-ink-1">{PLANET_NAMES[lang][p.lord]}</span>
                  <span className="text-xs tabular-nums text-ink-3">
                    {p.start.slice(0, 4)}–{p.end.slice(0, 4)}
                  </span>
                  <span className="text-[11px] text-ink-3">{t("years", { count: Math.round(years) })}</span>
                  {isNow && progress && <span aria-hidden className="absolute bottom-0 h-1 bg-saffron-400" style={{ left: 0, width: `${progress.percent}%` }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div id={panelId} aria-live="polite">
        {selected && (
          <div className="rounded-lg border border-line bg-night-s1 p-5">
            <h4 className="mb-3 text-base">
              {PLANET_NAMES[lang][selected.lord]} — {t("antardasha")}
            </h4>
            {selected.antardashas?.length ? (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {selected.antardashas.map((a, j) => {
                  const current = open === progress?.index && progress?.antardasha?.index === j;
                  return (
                    <li key={`${a.lord}-${a.start}`} className={cn("flex items-center justify-between gap-3 rounded-sm px-3 py-2 text-sm", current ? "bg-saffron-500/14 text-gold-200" : "bg-night-s2 text-ink-2")}>
                      <span className="flex items-center gap-2 font-medium">
                        <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: PLANET_COLORS[a.lord] }} />
                        {PLANET_NAMES[lang][a.lord]}
                        {current && <span className="text-[11px] font-bold">· {t("now")}</span>}
                      </span>
                      <span className="text-xs tabular-nums text-ink-3">
                        {monthYear(a.start, lang)} – {monthYear(a.end, lang)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-ink-3">{t("antardashaSoon")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
