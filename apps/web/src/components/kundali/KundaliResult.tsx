"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { AuroraBackground } from "@/components/effects";
import { Tabs } from "@/components/ui/Interactive";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import type { ChartData } from "@/lib/contracts";
import type { ChartDivision, ChartLang } from "@/lib/kundali/chart-layout";
import { chartFilename, downloadSvg } from "@/lib/kundali/svg-export";
import { joinTob, splitTob } from "@/lib/kundali/schema";
import { DashaTimeline } from "./DashaTimeline";
import { DoshaYogaCards } from "./DoshaYogaCards";
import { NorthIndianChart } from "./NorthIndianChart";
import { PlanetTable } from "./PlanetTable";
import { SouthIndianChart } from "./SouthIndianChart";
import { SummaryChips } from "./SummaryChips";
import { Icon } from "@/components/icons";
import { KundaliReport } from "@/components/report/KundaliReport";

export interface KundaliHeaderData {
  name: string;
  dob: string; // YYYY-MM-DD
  tob: string; // HH:mm
  placeName: string;
}

function birthLine(s: KundaliHeaderData, lang: ChartLang): string {
  const parts: string[] = [];
  if (s.dob) {
    parts.push(
      new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC", numberingSystem: "latn" }).format(
        new Date(`${s.dob}T00:00:00Z`),
      ),
    );
  }
  const tm = splitTob(s.tob);
  if (tm && joinTob(tm)) parts.push(`${tm.hour}:${tm.minute} ${tm.period}`);
  if (s.placeName) parts.push(s.placeName);
  return parts.join(" · ");
}

export function KundaliHeader({ subject, chart }: { subject: KundaliHeaderData; chart?: ChartData | null }) {
  const t = useTranslations("kundali.result");
  const lang: ChartLang = useLocale() === "en" ? "en" : "hi";
  return (
    <header className="relative overflow-hidden border-b border-line-subtle">
      <AuroraBackground intensity="strong" />
      <div className="container-page relative flex flex-col gap-4 py-12 md:py-16">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-gold-300 [:lang(en)_&]:uppercase [:lang(en)_&]:tracking-[0.16em]">
          <Icon name="sparkle" size={14} animate="draw" />
          {t("eyebrow")}
        </p>
        <h1 className="font-display text-[clamp(32px,4.2vw,52px)] leading-[1.15]">{subject.name || "—"}</h1>
        <p className="text-ink-2">
          <span className="text-ink-3">{t("born")}: </span>
          {birthLine(subject, lang)}
        </p>
        {chart && <SummaryChips chart={chart} lang={lang} />}
      </div>
    </header>
  );
}

/** Small slide-in nudge to book a consultation: every ~2.5 min, visible 5 s, then hides itself. */
function ConsultToast() {
  const t = useTranslations("kundali.result");
  const [show, setShow] = useState(false);
  const [off, setOff] = useState(false);
  useEffect(() => {
    if (off) return;
    let hide = 0;
    const pop = () => {
      setShow(true);
      hide = window.setTimeout(() => setShow(false), 5000);
    };
    const first = window.setTimeout(pop, 60_000);
    const every = window.setInterval(pop, 150_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
      window.clearTimeout(hide);
    };
  }, [off]);
  return (
    <div
      role="status"
      aria-hidden={!show}
      className={cn(
        "no-print fixed bottom-24 right-4 z-30 w-[min(340px,calc(100vw-32px))] rounded-lg border border-line-gold bg-night-s1 p-4 shadow-e3 transition-[transform,opacity] duration-500 md:bottom-6 md:right-6",
        show ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-[110%] opacity-0",
      )}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => (setShow(false), setOff(true))}
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-ink-3 hover:text-ink-1 focus-visible:ring-focus"
      >
        ×
      </button>
      <p className="pr-6 font-semibold text-ink-1">{t("ctaTitle")}</p>
      <p className="mt-1 text-sm text-ink-2">{t("ctaBody")}</p>
      <Link
        href="/book-appointment?problem=career"
        tabIndex={show ? 0 : -1}
        className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-grad-gold px-4 text-sm font-semibold text-ink-ongold focus-visible:ring-focus"
      >
        {t("ctaButton")} <Icon name="arrow-right" size={16} />
      </Link>
    </div>
  );
}

/** AMX-063 — result body: tabs for chart / planets / dasha / doshas & yogas, plus booking CTA. */
export function KundaliResult({ id, chart, chartStyle, name = "", dob }: { id: string; chart: ChartData; chartStyle: "north" | "south"; name?: string; dob?: string }) {
  const t = useTranslations("kundali.result");
  const tReport = useTranslations("report");
  const locale = useLocale();
  const lang: ChartLang = useLocale() === "en" ? "en" : "hi";
  const [style, setStyle] = useState(chartStyle);
  const [division, setDivision] = useState<ChartDivision>("d1");
  const chartBox = useRef<HTMLDivElement>(null);
  const onDownload = () => {
    const svg = chartBox.current?.querySelector("svg");
    if (svg) downloadSvg(svg, chartFilename(name, division, style));
  };

  const chartTab = (
    <div className="flex flex-col items-center gap-5">
      <div role="radiogroup" aria-label={t("styleLabel")} className="inline-flex rounded-full border border-line bg-night-s2 p-1">
        {(["north", "south"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={style === s}
            onClick={() => setStyle(s)}
            className={cn(
              "h-11 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:ring-focus",
              style === s ? "bg-grad-gold text-ink-ongold" : "text-ink-2 hover:text-ink-1",
            )}
          >
            {t(s)}
          </button>
        ))}
      </div>
      <div role="radiogroup" aria-label={t("divisionLabel")} className="inline-flex rounded-full border border-line bg-night-s2 p-1">
        {(["d1", "d9"] as const).map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={division === d}
            onClick={() => setDivision(d)}
            className={cn(
              "h-10 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:ring-focus",
              division === d ? "bg-night-s1 text-gold-300 ring-1 ring-line-gold" : "text-ink-2 hover:text-ink-1",
            )}
          >
            {t(d)}
          </button>
        ))}
      </div>
      <div ref={chartBox} className="w-full max-w-[480px] rounded-xl border border-line-gold bg-night-s1 p-3 shadow-[0_0_48px_-16px_rgba(245,158,11,.45)] sm:p-5">
        {style === "north" ? <NorthIndianChart chart={chart} lang={lang} division={division} /> : <SouthIndianChart chart={chart} lang={lang} division={division} />}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink-2 transition-colors hover:text-ink-1 focus-visible:ring-focus"
        >
          <Icon name="download" size={18} /> {t("downloadSvg")}
        </button>
        <Link
          href={`/kundali/${id}/print?style=${style}`}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line-gold px-5 text-sm font-semibold text-gold-300 transition-colors hover:text-gold-200 focus-visible:ring-focus"
        >
          <Icon name="printer" size={18} /> {t("printLink")}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mb-6 flex justify-end">
        <Link
          href={`/kundali/${id}/print?style=${style}`}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-grad-gold px-5 text-sm font-semibold text-ink-ongold shadow-e1 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-glow-gold focus-visible:ring-focus"
        >
          <Icon name="download" size={18} /> {t("printLink")}
        </Link>
      </div>
      <Tabs
        tabs={[
          { id: "report", label: tReport("tab"), content: <KundaliReport chart={chart} locale={locale} name={name} dob={dob} /> },
          { id: "chart", label: t("tabChart"), content: chartTab },
          { id: "planets", label: t("tabPlanets"), content: <PlanetTable chart={chart} lang={lang} /> },
          { id: "dasha", label: t("tabDasha"), content: <DashaTimeline vimshottari={chart.vimshottari ?? []} lang={lang} /> },
          { id: "doshas", label: t("tabDoshas"), content: <DoshaYogaCards data={chart.yogas_doshas} lang={lang} /> },
        ]}
      />
      <p className="mt-10 text-center text-[13px] text-ink-3">{t("disclaimer")}</p>
      <ConsultToast />
    </div>
  );
}
