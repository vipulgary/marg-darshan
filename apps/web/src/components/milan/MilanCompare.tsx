"use client";

import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/icons";
import { SummaryChips } from "@/components/kundali/SummaryChips";
import { SpokenText } from "@/components/report/SpokenText";
import { VoiceSectionPlayer } from "@/components/report/VoiceSectionPlayer";
import { cn } from "@/lib/cn";
import type { ChartData } from "@/lib/contracts";
import { type KundaliReport, buildReport } from "@/lib/report/build";

type Row = { key: string; icon: IconName; title: string; paras: (r: KundaliReport) => string[] };

/** Both people's readings side by side (50/50 on desktop), one row per life area, each half with its own Listen button. */
export function MilanCompare({ boy, girl, names, locale }: { boy: ChartData; girl: ChartData; names: { boy: string; girl: string }; locale: string }) {
  const t = useTranslations("report");
  const tm = useTranslations("milan");
  const l = locale === "en" ? "en" : "hi";
  const reports = { boy: buildReport(boy, l), girl: buildReport(girl, l) };

  const rows: Row[] = [
    { key: "overview", icon: "sparkle", title: t("overview"), paras: (r) => r.overview.slice(0, 3) },
    { key: "nature", icon: "sunrise", title: t("lagna"), paras: (r) => [r.lagna.personality, r.lagna.strengths, r.lagna.challenges] },
    { key: "career", icon: "briefcase", title: t("careerTitle"), paras: (r) => r.life.career.paragraphs },
    { key: "love", icon: "rings", title: t("loveTitle"), paras: (r) => r.life.love.paragraphs },
    { key: "health", icon: "heart-pulse", title: t("healthTitle"), paras: (r) => r.life.health.paragraphs },
    { key: "education", icon: "book", title: t("educationTitle"), paras: (r) => r.life.education.paragraphs },
    {
      key: "dasha",
      icon: "clock",
      title: t("dasha"),
      paras: (r) => (r.currentDasha ? [`${r.currentDasha.maha.name} (${r.currentDasha.maha.from} – ${r.currentDasha.maha.to}). ${r.currentDasha.theme} ${r.currentDasha.focus}`] : []),
    },
    { key: "sadeSati", icon: "hourglass", title: t("sadeSatiTitle"), paras: (r) => r.sadeSatiText },
    {
      key: "lucky",
      icon: "gem",
      title: t("lucky"),
      paras: (r) => [
        l === "hi"
          ? `शुभ रंग ${r.lucky.colour}, शुभ अंक ${r.lucky.number}, शुभ दिन ${r.lucky.day}, शुभ रत्न ${r.lucky.gem}।`
          : `Lucky colour ${r.lucky.colour}, number ${r.lucky.number}, day ${r.lucky.day}, gem ${r.lucky.gem}.`,
      ],
    },
  ];

  const side = (who: "boy" | "girl") => (
    <div className="flex items-baseline gap-2">
      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", who === "boy" ? "bg-info" : "bg-saffron-400")} aria-hidden />
      <span className="font-semibold text-ink-1">{names[who]}</span>
      <span className="text-xs text-ink-3">{tm(who)}</span>
    </div>
  );

  return (
    <section className="flex flex-col gap-4" aria-labelledby="milan-compare-h">
      <h2 id="milan-compare-h" className="text-xl">{tm("compareTitle")}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {(["boy", "girl"] as const).map((who) => (
          <div key={who} className="flex flex-col gap-3 rounded-xl border border-line bg-night-s1/70 p-4 shadow-e1 backdrop-blur-xl">
            {side(who)}
            <SummaryChips chart={who === "boy" ? boy : girl} lang={l} />
          </div>
        ))}
      </div>
      {rows.map((row) => (
        <article key={row.key} className="rounded-xl border border-line bg-night-s1/70 p-4 shadow-e1 backdrop-blur-xl sm:p-5">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Icon name={row.icon} size={20} className="text-gold-300" /> {row.title}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 md:divide-x md:divide-line-subtle">
            {(["boy", "girl"] as const).map((who, i) => {
              const paras = row.paras(reports[who]).filter(Boolean);
              return (
                <div key={who} className={cn("flex flex-col gap-2.5", i === 1 && "md:pl-4")}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {side(who)}
                    {paras.length > 0 && <VoiceSectionPlayer text={paras.join(" ")} locale={locale} title={`${row.title} — ${names[who]}`} spokenId={`say-${row.key}-${who}`} />}
                  </div>
                  {paras.length ? (
                    <SpokenText id={`say-${row.key}-${who}`} paragraphs={paras} className="gap-2.5 text-[15px] text-ink-2" />
                  ) : (
                    <p className="text-sm text-ink-3">—</p>
                  )}
                </div>
              );
            })}
          </div>
        </article>
      ))}
    </section>
  );
}
