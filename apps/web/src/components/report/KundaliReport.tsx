import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { CopyPara } from "./CopyPara";
import { NorthIndianChart } from "@/components/kundali/NorthIndianChart";
import { Badge } from "@/components/ui/Display";
import { cn } from "@/lib/cn";
import type { ChartData } from "@/lib/contracts";
import { type Dignity, buildReport } from "@/lib/report/build";
import { NumerologyCard } from "@/components/numerology/Numerology";
import { numerology } from "@/lib/numerology";

const DIGNITY_TONE: Record<Dignity, "success" | "gold" | "violet" | "neutral" | "warning" | "error"> = {
  exalted: "success",
  own: "gold",
  friend: "violet",
  neutral: "neutral",
  enemy: "warning",
  debilitated: "error",
};

function Section({ id, icon, title, children }: { id: string; icon: IconName; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="report-section scroll-mt-28 rounded-lg border border-line bg-night-s1 p-5 md:p-6 print:break-inside-avoid">
      <h3 id={`${id}-h`} className="mb-4 flex items-center gap-2 text-xl">
        <Icon name={icon} size={22} animate="draw" className="text-gold-300" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[150px_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-gold-300">{label}</dt>
      <dd className="text-ink-2">{children}</dd>
    </div>
  );
}

/** AMX-180/181 — interpretive report (phalit). Used on the result page tab and in the A4 print view. */
export function KundaliReport({ chart, locale, print = false, name, dob, showCharts = false }: { chart: ChartData; locale: string; print?: boolean; name?: string; dob?: string; showCharts?: boolean }) {
  const t = useTranslations("report");
  const tk = useTranslations("kundali.result");
  const r = buildReport(chart, locale === "en" ? "en" : "hi");
  const num = name && dob && /^d{4}-d{2}-d{2}$/.test(dob) ? numerology(name, dob) : null;
  const sections: [string, string, IconName][] = [
    ["rep-overview", t("overview"), "sparkle"],
    ["rep-lagna", t("lagna"), "sunrise"],
    ["rep-career", t("career"), "briefcase"],
    ["rep-love", t("love"), "rings"],
    ["rep-health", t("health"), "heart-pulse"],
    ["rep-education", t("education"), "book"],
    ["rep-dasha", t("dasha"), "clock"],
    ["rep-doshas", t("doshas"), "diya"],
    ["rep-lucky", t("lucky"), "gem"],
    ...(num ? ([["rep-numerology", t("numerology"), "sparkle"]] as [string, string, IconName][]) : []),
    ["rep-mind", t("mind"), "moon"],
    ["rep-planets", t("planets"), "astrology"],
  ];
  const areas = [
    ["rep-career", "career", "briefcase", r.life.career],
    ["rep-love", "love", "rings", r.life.love],
    ["rep-health", "health", "heart-pulse", r.life.health],
    ["rep-education", "education", "book", r.life.education],
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="gold">{t("summary", { lagna: r.summary.lagna, rashi: r.summary.rashi, nakshatra: r.summary.nakshatra })}</Badge>
        {r.summary.currentDasha && <Badge tone="violet">{t("runningDasha", { dasha: r.summary.currentDasha })}</Badge>}
        {!r.reviewed && <Badge tone="warning">{t("draft")}</Badge>}
      </div>

      {!print && (
        <nav aria-label={t("jump")}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {sections.map(([id, label, icon]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="group flex h-full min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-line bg-night-s1 p-3 text-center text-sm font-semibold text-ink-1 transition-all hover:-translate-y-0.5 hover:border-line-gold hover:shadow-e2 focus-visible:ring-focus"
                >
                  <Icon name={icon} size={30} className="text-gold-300" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <Section id="rep-overview" icon="sparkle" title={t("overviewTitle")}>
        <div className="relative flex flex-col gap-3 pr-9 leading-relaxed">
          <CopyPara text={r.overview.join("\n\n")} label={t("copy")} />
          {r.overview.map((para, i) => (
            <p key={i} className={i === 0 ? "text-ink-1" : undefined}>
              {para}
            </p>
          ))}
        </div>
      </Section>

      {showCharts && (
        <section aria-label={tk("tabChart")} className="grid gap-5 md:grid-cols-2">
          {(["d1", "d9"] as const).map((d) => (
            <figure key={d} className="flex flex-col items-center gap-3 rounded-xl border border-line-gold bg-night-s1 p-4 shadow-e1 sm:p-5">
              <figcaption className="text-sm font-semibold text-gold-300">{tk(d)}</figcaption>
              <div className="w-full max-w-[420px]">
                <NorthIndianChart chart={chart} lang={locale === "en" ? "en" : "hi"} division={d} />
              </div>
            </figure>
          ))}
        </section>
      )}

      <Section id="rep-lagna" icon="sunrise" title={t("lagnaTitle", { sign: r.lagna.sign })}>
        <p className="mb-3 text-ink-1">{r.lagna.personality}</p>
        <dl className="divide-y divide-line-subtle">
          <Row label={t("strengths")}>{r.lagna.strengths}</Row>
          <Row label={t("challenges")}>{r.lagna.challenges}</Row>
        </dl>
      </Section>

      {areas.map(([id, key, icon, a]) => (
        <Section key={id} id={id} icon={icon} title={t(`${key}Title`)}>
          {"manglik" in a && a.manglik && (
            <p className="mb-3 text-sm">
              <Badge tone={!a.manglik.present ? "success" : a.manglik.cancelled ? "neutral" : "warning"}>
                {!a.manglik.present ? t("manglikNo") : a.manglik.cancelled ? t("manglikCancelled") : t("manglikYes")}
              </Badge>
            </p>
          )}
          <div className="relative flex flex-col gap-3 pr-9 leading-relaxed">
            <CopyPara text={a.paragraphs.join("\n\n")} label={t("copy")} />
            {a.paragraphs.map((para, i) => (
              <p key={i} className={i === 0 ? "text-ink-1" : undefined}>
                {para}
              </p>
            ))}
          </div>
        </Section>
      ))}

      <Section id="rep-mind" icon="moon" title={t("mindTitle", { sign: r.rashi.sign, nakshatra: r.nakshatra.name })}>
        <p className="mb-3 text-ink-1">{r.rashi.mind}</p>
        <p className="mb-3">
          <span className="font-semibold text-gold-300">{t("tip")}: </span>
          {r.rashi.tip}
        </p>
        <p>
          <span className="font-semibold text-gold-300">{t("nakshatraLine", { name: r.nakshatra.name, pada: r.nakshatra.pada, deity: r.nakshatra.deity })}: </span>
          {r.nakshatra.traits}
        </p>
      </Section>

      <Section id="rep-planets" icon="astrology" title={t("planets")}>
        <ul className={cn("grid gap-3", !print && "md:grid-cols-2")}>
          {r.planets.map((p) => (
            <li key={p.key} className="rounded-md border border-line-subtle bg-night-s2 p-4 print:break-inside-avoid">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink-1">{p.name}</span>
                <span className="text-sm text-ink-3">
                  {t("inHouse", { sign: p.sign, house: p.house, topic: p.houseTopic })}
                </span>
                <Badge tone={DIGNITY_TONE[p.dignity]}>{t(`dignity.${p.dignity}`)}</Badge>
                {p.retrograde && <Badge tone="neutral">{t("retro")}</Badge>}
              </div>
              <p className="text-sm text-ink-2">{p.result}</p>
              <p className="mt-1 text-xs text-ink-3">{p.dignityNote}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="rep-dasha" icon="clock" title={t("dasha")}>
        {r.currentDasha ? (
          <>
            <p className="mb-2 text-ink-1">
              {t("dashaNow", { maha: r.currentDasha.maha.name, from: r.currentDasha.maha.from, to: r.currentDasha.maha.to })}
            </p>
            <p className="mb-2">{r.currentDasha.theme} {r.currentDasha.focus}</p>
            {r.currentDasha.antar && (
              <p className="mb-3 text-sm">
                <span className="font-semibold text-gold-300">{t("antarNow", { antar: r.currentDasha.antar.name, to: r.currentDasha.antar.to })}: </span>
                {r.currentDasha.antarNote}
              </p>
            )}
          </>
        ) : (
          <p className="text-ink-3">{t("noDasha")}</p>
        )}
        {r.upcomingDashas.length > 0 && (
          <>
            <h4 className="mb-2 mt-4 text-base">{t("upcoming")}</h4>
            <ul className="flex flex-col gap-2 text-sm">
              {r.upcomingDashas.map((d) => (
                <li key={d.from}>
                  <span className="font-semibold text-ink-1">{d.name}</span> <span className="text-ink-3">({d.from} – {d.to})</span>: {d.theme}
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section id="rep-doshas" icon="diya" title={t("doshas")}>
        {r.doshas.length === 0 && <p className="text-ink-3">{t("noDoshaData")}</p>}
        <ul className="flex flex-col gap-3">
          {r.doshas.map((d) => (
            <li key={d.key} className="print:break-inside-avoid">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink-1">{d.name}</span>
                <Badge tone={!d.present ? "success" : d.cancelled ? "neutral" : "warning"}>
                  {!d.present ? t("absent") : d.cancelled ? t("cancelled") : t("present")}
                </Badge>
              </div>
              {d.present && <p className="mt-1 text-sm">{d.details}</p>}
              {d.remedies.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {d.remedies.map((rem) => (
                    <li key={rem} className="flex gap-2">
                      <Icon name="check" size={16} animate="none" className="mt-1 shrink-0 text-gold-300" />
                      {rem}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        {r.yogas.length > 0 && (
          <>
            <h4 className="mb-2 mt-5 text-base">{t("yogas")}</h4>
            <ul className="flex flex-col gap-2 text-sm">
              {r.yogas.map((y) => (
                <li key={y.key}>
                  <span className="font-semibold text-ink-1">{y.name}:</span> {y.description}
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section id="rep-lucky" icon="gem" title={t("lucky")}>
        <dl className="grid gap-x-6 sm:grid-cols-2">
          <Row label={t("gem")}>
            {r.lucky.gem}
            {r.lucky.alternateGem && <span className="text-ink-3"> · {t("orGem", { gem: r.lucky.alternateGem })}</span>}
          </Row>
          <Row label={t("day")}>{r.lucky.day}</Row>
          <Row label={t("colour")}>{r.lucky.colour}</Row>
          <Row label={t("number")}>{r.lucky.number}</Row>
          <Row label={t("metal")}>{r.lucky.metal}</Row>
          <Row label={t("deity")}>{r.lucky.deity}</Row>
          <Row label={t("mantra")}>
            <span lang="sa">{r.lucky.mantra}</span>
          </Row>
          <Row label={t("daan")}>{r.lucky.daan}</Row>
        </dl>
        <p className="mt-3 rounded-md bg-warning/12 px-3 py-2 text-sm text-warning">{r.lucky.gemNote}</p>
      </Section>

      {num && (
        <Section id="rep-numerology" icon="sparkle" title={t("numerology")}>
          <NumerologyCard result={num} />
        </Section>
      )}

      <p className="text-xs text-ink-3">{r.disclaimer}</p>
    </div>
  );
}
