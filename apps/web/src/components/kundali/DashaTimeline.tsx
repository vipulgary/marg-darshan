"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import type { ChartData, DashaPeriod } from "@/lib/contracts";
import { type ChartLang, PLANET_COLORS, PLANET_NAMES, dashaProgress, periodYears, timelinePeriods } from "@/lib/kundali/chart-layout";

type SadeSatiRow = NonNullable<ChartData["sade_sati_periods"]>[number];

function monthYear(iso: string, lang: ChartLang): string {
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { month: "short", year: "numeric", timeZone: "UTC", numberingSystem: "latn" }).format(
    new Date(`${iso.slice(0, 10)}T00:00:00Z`),
  );
}

const glass = "rounded-xl border border-line bg-night-s1/70 shadow-e1 backdrop-blur-xl";

/** One Sade Sati or small-Panoti stretch, with retrograde returns folded in. */
interface Stretch {
  kind: SadeSatiRow["kind"];
  start: string;
  end: string;
  phases: { phase: SadeSatiRow["phase"]; start: string; end: string }[];
}

function stretches(rows: SadeSatiRow[]): Stretch[] {
  const out: Stretch[] = [];
  for (const r of rows) {
    const last = out.at(-1);
    if (last && last.kind === r.kind && (Date.parse(r.start) - Date.parse(last.end)) / 864e5 < 400) {
      last.end = r.end;
      const ph = last.phases.find((p) => p.phase === r.phase);
      if (ph) ph.end = r.end;
      else last.phases.push({ phase: r.phase, start: r.start, end: r.end });
    } else out.push({ kind: r.kind, start: r.start, end: r.end, phases: [{ phase: r.phase, start: r.start, end: r.end }] });
  }
  return out;
}

const PHASE_STYLE: Record<SadeSatiRow["phase"], string> = {
  rising: "bg-saffron-400/60",
  peak: "bg-saffron-600",
  setting: "bg-saffron-400/80",
  "4th": "bg-gold-300/45",
  "8th": "bg-gold-300/45",
};
const PHASE_NAME: Record<SadeSatiRow["phase"], [string, string]> = {
  rising: ["Rising", "आरोही"],
  peak: ["Peak", "शीर्ष"],
  setting: ["Setting", "अवरोही"],
  "4th": ["Small Panoti (4th)", "छोटी पनोती (4था)"],
  "8th": ["Small Panoti (8th)", "छोटी पनोती (8वाँ)"],
};

/** Sade Sati & Dhaiya: a proportional ribbon over the years plus a card per Sade Sati with phase dates. */
function SaturnCycles({ rows, lang, from, to }: { rows: SadeSatiRow[]; lang: ChartLang; from: string; to: string }) {
  const hi = lang === "hi";
  const today = new Date().toISOString().slice(0, 10);
  const groups = stretches(rows.filter((r) => r.end >= from && r.start <= to));
  const t0 = Date.parse(from);
  const span = Date.parse(to) - t0;
  const pos = (iso: string) => Math.min(100, Math.max(0, ((Date.parse(iso) - t0) / span) * 100));
  const sadeSatis = groups.filter((g) => g.kind === "sade_sati");
  const panotis = groups.filter((g) => g.kind === "small_panoti");
  const decades: number[] = [];
  for (let y = Math.ceil(new Date(from).getUTCFullYear() / 10) * 10; y <= new Date(to).getUTCFullYear(); y += 10) decades.push(y);

  return (
    <section className={cn(glass, "flex flex-col gap-5 p-5 sm:p-6")}>
      <div>
        <h3 className="text-lg font-semibold text-ink-1">{hi ? "शनि की साढ़े साती और ढैय्या" : "Saturn's Sade Sati & Dhaiya"}</h3>
        <p className="text-[13px] text-ink-3">{hi ? "कब शुरू, कब शीर्ष पर, कब समाप्त — वास्तविक शनि गति से।" : "When each one starts, peaks and ends — from Saturn's real motion."}</p>
      </div>

      {/* Ribbon: whole life on one line, no scrolling */}
      <div className="flex flex-col gap-1.5">
        {[
          [hi ? "साढ़े साती" : "Sade Sati", sadeSatis],
          [hi ? "ढैय्या" : "Dhaiya", panotis],
        ].map(([label, list]) => (
          <div key={label as string} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs font-semibold text-ink-2">{label as string}</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-night-s3/70">
              {(list as Stretch[]).flatMap((g) =>
                g.phases.map((p) => (
                  <span
                    key={`${p.phase}-${p.start}`}
                    title={`${PHASE_NAME[p.phase][hi ? 1 : 0]}: ${monthYear(p.start, lang)} – ${monthYear(p.end, lang)}`}
                    className={cn("absolute inset-y-0", PHASE_STYLE[p.phase])}
                    style={{ left: `${pos(p.start)}%`, width: `${Math.max(0.6, pos(p.end) - pos(p.start))}%` }}
                  />
                )),
              )}
              <span aria-hidden className="absolute inset-y-0 w-0.5 bg-ink-1" style={{ left: `${pos(today)}%` }} />
            </div>
          </div>
        ))}
        <div className="ml-[92px] flex justify-between text-[11px] tabular-nums text-ink-3">
          {decades.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </div>

      {/* Bento: one card per Sade Sati, current one highlighted */}
      <ul className="grid gap-3 md:grid-cols-3">
        {sadeSatis.map((g) => {
          const now = g.start <= today && today <= g.end;
          const past = g.end < today;
          return (
            <li key={g.start} className={cn("flex flex-col gap-3 rounded-lg border p-4", now ? "border-saffron-400 bg-saffron-500/10" : "border-line bg-night-s1/60", past && "opacity-70")}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink-1">{hi ? "साढ़े साती" : "Sade Sati"}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", now ? "bg-grad-gold text-ink-ongold" : past ? "bg-night-s3 text-ink-3" : "bg-success/14 text-success")}>
                  {now ? (hi ? "अभी" : "Now") : past ? (hi ? "बीत गई" : "Past") : hi ? "आगे" : "Upcoming"}
                </span>
              </div>
              <p className="text-sm tabular-nums text-ink-2">
                {monthYear(g.start, lang)} → <strong className="text-ink-1">{monthYear(g.end, lang)}</strong>
              </p>
              <ol className="flex flex-col gap-1.5">
                {g.phases.map((p) => {
                  const active = p.start <= today && today <= p.end;
                  return (
                    <li key={p.phase} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-2">
                        <span aria-hidden className={cn("h-2.5 w-2.5 rounded-full", PHASE_STYLE[p.phase])} />
                        <span className={cn(active ? "font-bold text-ink-1" : "text-ink-2")}>{PHASE_NAME[p.phase][hi ? 1 : 0]}</span>
                      </span>
                      <span className="tabular-nums text-ink-3">
                        {monthYear(p.start, lang)} – {monthYear(p.end, lang)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </li>
          );
        })}
      </ul>

      {panotis.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {panotis.map((g) => (
            <span key={g.start} className={cn("rounded-full border px-3 py-1 text-xs tabular-nums", g.start <= today && today <= g.end ? "border-saffron-400 bg-saffron-500/10 font-semibold text-ink-1" : "border-line text-ink-2")}>
              {PHASE_NAME[g.phases[0].phase][hi ? 1 : 0]} · {monthYear(g.start, lang)} – {monthYear(g.end, lang)}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

/** AMX-063 — dasha view as a glass bento: current period, whole-life ribbon, tile grid, antardashas, Saturn cycles. */
export function DashaTimeline({ vimshottari, lang, sadeSati }: { vimshottari: DashaPeriod[]; lang: ChartLang; sadeSati?: SadeSatiRow[] }) {
  const t = useTranslations("kundali.dasha");
  const panelId = useId();
  const progress = dashaProgress(vimshottari);
  const periods = timelinePeriods(vimshottari);
  const [open, setOpen] = useState<number | null>(progress?.current.antardashas?.length ? progress.index : null);

  if (!periods.length) return <p className="text-ink-3">{t("none")}</p>;
  const selected = open !== null ? periods[open] : null;
  const total = periods.reduce((n, p) => n + periodYears(p), 0);

  return (
    <div className="flex flex-col gap-5">
      {progress && (
        <section className={cn(glass, "relative overflow-hidden p-5 sm:p-6")}>
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl" style={{ background: `${PLANET_COLORS[progress.current.lord]}33` }} />
          <p className="text-sm text-gold-300">{t("current")}</p>
          <p className="mt-1 font-display text-3xl text-ink-1">
            {PLANET_NAMES[lang][progress.current.lord]}{" "}
            <span className="font-sans text-base font-normal text-ink-2">
              · {monthYear(progress.current.start, lang)} – {monthYear(progress.current.end, lang)}
            </span>
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-night-s3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.percent)} aria-label={t("current")}>
            <div className="h-full bg-grad-gold" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="mt-2 text-sm text-ink-3">
            {t("elapsed", { percent: Math.round(progress.percent) })}
            {progress.antardasha && ` · ${t("currentAntardasha", { lord: PLANET_NAMES[lang][progress.antardasha.period.lord] })}`}
          </p>
        </section>
      )}

      <section className={cn(glass, "flex flex-col gap-4 p-5 sm:p-6")}>
        <h3 className="text-lg font-semibold text-ink-1">{t("title")}</h3>
        {/* Whole life as one proportional ribbon — no horizontal scroll */}
        <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
          {periods.map((p, i) => (
            <span
              key={`${p.lord}-${p.start}`}
              className={cn("h-full", progress?.index === i && "ring-2 ring-inset ring-ink-1")}
              style={{ width: `${(periodYears(p) / total) * 100}%`, background: PLANET_COLORS[p.lord] }}
            />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5" role="group" aria-label={t("timeline")}>
          {periods.map((p, i) => {
            const isNow = progress?.index === i;
            const color = PLANET_COLORS[p.lord];
            return (
              <li key={`${p.lord}-${p.start}`} className={cn(isNow && "col-span-2")}>
                <button
                  type="button"
                  aria-expanded={open === i}
                  aria-controls={panelId}
                  aria-current={isNow ? "true" : undefined}
                  onClick={() => setOpen(open === i ? null : i)}
                  style={{ borderLeftColor: color }}
                  className={cn(
                    "relative flex h-full w-full flex-col items-start gap-0.5 rounded-lg border border-l-4 border-line bg-night-s1/60 px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-e2 focus-visible:ring-focus",
                    isNow && "border-saffron-400 bg-saffron-500/10",
                    open === i && !isNow && "bg-night-s2",
                  )}
                >
                  {isNow && <span className="absolute right-2 top-2 rounded-full bg-grad-gold px-2 text-[11px] font-bold text-ink-ongold">{t("now")}</span>}
                  <span className="text-sm font-semibold text-ink-1">{PLANET_NAMES[lang][p.lord]}</span>
                  <span className="text-xs tabular-nums text-ink-3">
                    {p.start.slice(0, 4)}–{p.end.slice(0, 4)} · {t("years", { count: Math.round(periodYears(p)) })}
                  </span>
                  {isNow && progress && (
                    <span aria-hidden className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-night-s3">
                      <span className="block h-full bg-grad-gold" style={{ width: `${progress.percent}%` }} />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div id={panelId} aria-live="polite">
        {selected && (
          <section className={cn(glass, "p-5 sm:p-6")}>
            <h4 className="mb-3 text-base font-semibold">
              {PLANET_NAMES[lang][selected.lord]} — {t("antardasha")}
            </h4>
            {selected.antardashas?.length ? (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {selected.antardashas.map((a, j) => {
                  const current = open === progress?.index && progress?.antardasha?.index === j;
                  return (
                    <li key={`${a.lord}-${a.start}`} className={cn("flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm", current ? "bg-saffron-500/14 font-semibold text-ink-1" : "bg-night-s2/70 text-ink-2")}>
                      <span className="flex items-center gap-2">
                        <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: PLANET_COLORS[a.lord] }} />
                        {PLANET_NAMES[lang][a.lord]}
                        {current && <span className="text-[11px] font-bold text-gold-300">· {t("now")}</span>}
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
          </section>
        )}
      </div>

      {sadeSati && sadeSati.length > 0 && <SaturnCycles rows={sadeSati} lang={lang} from={periods[0].start} to={periods.at(-1)!.end} />}
    </div>
  );
}
