"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

interface Named {
  name_en: string;
  name_hi: string;
}
interface Panchang {
  date: string;
  sunrise: string | null;
  sunset: string | null;
  vara: Named;
  tithi: Named & { paksha_en: string; paksha_hi: string };
  nakshatra: Named;
  yoga: Named;
}

type State = { kind: "loading" } | { kind: "ready"; data: Panchang } | { kind: "unavailable" };

const hhmm = (iso: string | null) => (iso && iso.length >= 16 ? iso.slice(11, 16) : "—");

/** AMX-122: today's panchang (New Delhi). Renders nothing when the engine is unavailable. */
export function TodayPanchang({ className = "" }: { className?: string }) {
  const t = useTranslations("panchang");
  const locale = useLocale();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/panchang", { signal: ctrl.signal })
      .then(async (res) => (res.ok ? setState({ kind: "ready", data: (await res.json()) as Panchang }) : setState({ kind: "unavailable" })))
      .catch((err: unknown) => {
        if ((err as Error)?.name !== "AbortError") setState({ kind: "unavailable" });
      });
    return () => ctrl.abort();
  }, []);

  if (state.kind === "unavailable") return null;

  const hi = locale === "hi";
  const n = (x: Named) => (hi ? x.name_hi : x.name_en);

  if (state.kind === "loading") {
    return (
      <div role="status" aria-busy="true" className={`rounded-lg border border-line bg-night-s1 p-6 shadow-e1 ${className}`}>
        <span className="sr-only">{t("loading")}</span>
        <div className="h-4 w-32 animate-pulse rounded bg-night-s2" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-night-s2" />
          ))}
        </div>
      </div>
    );
  }

  const d = state.data;
  const dateLabel = new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${d.date}T00:00:00Z`),
  );
  const rows: [string, string][] = [
    [t("vara"), n(d.vara)],
    [t("tithi"), `${n(d.tithi)} · ${hi ? d.tithi.paksha_hi : d.tithi.paksha_en}`],
    [t("nakshatra"), n(d.nakshatra)],
    [t("yoga"), n(d.yoga)],
    [t("sunrise"), hhmm(d.sunrise)],
    [t("sunset"), hhmm(d.sunset)],
  ];

  return (
    <section aria-labelledby="today-panchang-title" className={`rounded-lg border border-line bg-night-s1 p-6 shadow-e1 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="today-panchang-title" className="text-xl">
          {t("title")}
        </h3>
        <span className="text-xs text-ink-3">{t("place")}</span>
      </div>
      <p className="mt-1 text-sm text-gold-300">{dateLabel}</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-wide text-ink-3">{label}</dt>
            <dd className="font-semibold text-ink-1 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
