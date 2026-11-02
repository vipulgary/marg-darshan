import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { CopyPara } from "./CopyPara";
import { SpokenText } from "./SpokenText";
import { VoiceSectionPlayer } from "./VoiceSectionPlayer";
import { NorthIndianChart } from "@/components/kundali/NorthIndianChart";
import { Badge } from "@/components/ui/Display";
import { cn } from "@/lib/cn";
import type { ChartData } from "@/lib/contracts";
import { type Dignity, buildReport } from "@/lib/report/build";
import type { SadeSatiCycle } from "@/lib/report/sade-sati";
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

const NoControl = () => null;

const RANK_TONE = [
  "border-[#34a46a]/60 bg-[#34a46a]/18",
  "border-[#34a46a]/30 bg-[#34a46a]/8",
  "border-[#e3b23c]/50 bg-[#f2c94c]/16",
];

/** Next good dates as highlighted boxes: soonest deep green, then light green, then yellow; weddings add a 12-month strip. */
function GoodTimes({
  block,
  locale,
}: {
  block: { area: string; title: string; items: { date: string; weekday: string; nakshatra: string; from: string; to: string; rank: number }[]; months: [string, number][] };
  locale: string;
}) {
  const hi = locale !== "en";
  const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const time = (iso: string) => new Date(iso).toLocaleTimeString(hi ? "hi-IN" : "en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
  const mon = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleDateString(hi ? "hi-IN" : "en-IN", { month: "short", timeZone: "UTC" });
  return (
    <div className="mt-4 rounded-xl border border-line-subtle bg-night-s2/60 p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-1">
        <Icon name="calendar" size={16} className="text-gold-300" /> {block.title}
      </p>
      <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        {block.items.map((w) => (
          <li key={w.date} className={cn("flex flex-col gap-0.5 rounded-lg border p-3", RANK_TONE[w.rank])}>
            <span className="text-[15px] font-semibold tabular-nums text-ink-1">{day(w.date)}</span>
            <span className="text-xs font-semibold text-ink-2">{w.weekday}</span>
            <span className="text-xs text-ink-3">{w.nakshatra}</span>
            <span className="mt-1 text-xs tabular-nums text-ink-2">
              {time(w.from)} – {time(w.to)}
              {w.to.slice(0, 10) !== w.date && <span className="text-ink-3"> ({hi ? "अगली सुबह" : "next morning"})</span>}
            </span>
          </li>
        ))}
      </ol>
      {block.months.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={hi ? "अगले 12 महीनों में मुहूर्त" : "Muhurats in the next 12 months"}>
          {block.months.map(([ym, n]) => (
            <li key={ym} className="rounded-full border border-success/30 bg-success/8 px-2.5 py-0.5 text-xs text-ink-1">
              {mon(ym)} {ym.slice(0, 4)} · <strong>{n}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Section({
  id,
  icon,
  title,
  action,
  children,
}: {
  id: string;
  icon: IconName;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="report-section scroll-mt-28 rounded-lg border border-line bg-night-s1 p-5 md:p-6 print:break-inside-avoid">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 id={`${id}-h`} className="flex items-center gap-2 text-xl font-semibold">
          <Icon name={icon} size={22} animate="draw" className="text-gold-300" />
          {title}
        </h3>
        {action && <div className="no-print flex items-center gap-2 print:hidden">{action}</div>}
      </div>
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

// ─── AMX-200 Sade Sati & small Panoti timeline (real Saturn transits) ───────
const SIGNS_EN = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const SIGNS_HI = ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
const PHASE_LABEL: Record<string, [string, string]> = {
  rising: ["Rising", "आरोही"],
  peak: ["Peak", "शीर्ष"],
  setting: ["Setting", "अवरोही"],
  "4th": ["Small Panoti (4th)", "छोटी पनोती (4था)"],
  "8th": ["Small Panoti (8th)", "छोटी पनोती (8वाँ)"],
};
const dmy = (iso: string, locale: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale === "en" ? "en-IN" : "hi-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function SadeSatiTimeline({ timeline, text, locale }: { timeline: SadeSatiCycle; text: string[]; locale: string }) {
  const hi = locale !== "en";
  const today = new Date().toISOString().slice(0, 10);
  const status = timeline.status === "sade_sati" ? (hi ? "साढ़े साती चल रही है" : "Sade Sati running") : timeline.status === "small_panoti" ? (hi ? "छोटी पनोती चल रही है" : "Small Panoti running") : hi ? "मुक्त काल" : "Free period";
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={timeline.status === "free" ? "success" : "warning"}>{status}</Badge>
        {timeline.currentEnd && <span className="text-sm text-ink-2">{hi ? "पूर्ण समाप्ति" : "Fully ends"}: <strong className="text-ink-1">{dmy(timeline.currentEnd, locale)}</strong></span>}
      </div>
      <div className="flex flex-col gap-3 leading-relaxed">
        {text.map((p, i) => (
          <p key={i} className={i === 0 ? "text-ink-1" : undefined}>{p}</p>
        ))}
      </div>
      {timeline.freeFrom && timeline.status !== "free" && (
        <p className="rounded-md border border-success/30 bg-success/8 px-4 py-3 text-sm text-ink-1">
          <strong className="text-success">{hi ? "अच्छा, मुक्त समय" : "Good, free period"}:</strong> {dmy(timeline.freeFrom, locale)}
          {timeline.freeUntil ? ` – ${dmy(timeline.freeUntil, locale)}` : ""}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink-3">
              <th className="py-2 pr-3 font-semibold">{hi ? "प्रकार" : "Type"}</th>
              <th className="py-2 pr-3 font-semibold">{hi ? "शनि राशि" : "Saturn in"}</th>
              <th className="py-2 pr-3 font-semibold">{hi ? "से" : "From"}</th>
              <th className="py-2 font-semibold">{hi ? "तक" : "To"}</th>
            </tr>
          </thead>
          <tbody>
            {timeline.rows.map((r) => {
              const now = r.start <= today && today <= r.end;
              return (
                <tr key={r.start} className={cn("border-b border-line-subtle", now && "bg-warning/8 font-semibold")}>
                  <td className="py-2 pr-3 text-ink-1">
                    {r.kind === "sade_sati" ? (hi ? "साढ़े साती · " : "Sade Sati · ") : ""}
                    {PHASE_LABEL[r.phase][hi ? 1 : 0]}
                    {now && <Badge tone="warning" className="ml-2">{hi ? "अभी" : "Now"}</Badge>}
                  </td>
                  <td className="py-2 pr-3 text-ink-2">{(hi ? SIGNS_HI : SIGNS_EN)[r.saturn_sign - 1]}</td>
                  <td className="py-2 pr-3 tabular-nums text-ink-2">{dmy(r.start, locale)}</td>
                  <td className="py-2 tabular-nums text-ink-2">{dmy(r.end, locale)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-3">
        {hi ? "तिथियाँ स्विस एफ़ेमेरिस (लाहिड़ी) से शनि की वास्तविक गति पर आधारित हैं; वक्री शनि की वापसी अलग पंक्ति में दिखाई गई है।" : "Dates come from Saturn's actual motion (Swiss Ephemeris, Lahiri); retrograde returns are shown as separate rows."}
      </p>
    </div>
  );
}

/** AMX-180/181 — interpretive report (phalit). Used on the result page tab and in the A4 print view. */
export function KundaliReport({ chart, locale, print = false, name, dob, showCharts = false }: { chart: ChartData; locale: string; print?: boolean; name?: string; dob?: string; showCharts?: boolean }) {
  const t = useTranslations("report");
  // The printable page (always light) gets no Listen/Copy controls.
  const Voice = print ? NoControl : VoiceSectionPlayer;
  const Copy = print ? NoControl : CopyPara;
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
    ["rep-sade-sati", t("sadeSati"), "hourglass"],
    ["rep-doshas", t("doshas"), "diya"],
    ["rep-lucky", t("lucky"), "gem"],
    ...(num ? ([["rep-numerology", t("numerology"), "sparkle"]] as [string, string, IconName][]) : []),
    ["rep-mind", t("mind"), "moon"],
    ["rep-seva", t("sevaTitle"), "lotus"],
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

      <Section
        id="rep-overview"
        icon="sparkle"
        title={t("overviewTitle")}
        action={
          <div className="flex items-center gap-2">
            <Voice text={r.overview.join(" ")} locale={locale} title={t("overviewTitle")} spokenId="say-overview" />
            <Copy text={r.overview.join("\n\n")} label={t("copy")} />
          </div>
        }
      >
        <SpokenText id="say-overview" paragraphs={r.overview} />
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

      <Section
        id="rep-lagna"
        icon="sunrise"
        title={t("lagnaTitle", { sign: r.lagna.sign })}
        action={
          <Voice
            text={`${r.lagna.personality}. ${t("strengths")}: ${r.lagna.strengths}. ${t("challenges")}: ${r.lagna.challenges}.`}
            locale={locale}
            title={t("lagnaTitle", { sign: r.lagna.sign })}
          />
        }
      >
        <p className="mb-3 text-ink-1">{r.lagna.personality}</p>
        <dl className="divide-y divide-line-subtle">
          <Row label={t("strengths")}>{r.lagna.strengths}</Row>
          <Row label={t("challenges")}>{r.lagna.challenges}</Row>
        </dl>
      </Section>

      {areas.map(([id, key, icon, a]) => (
        <Section
          key={id}
          id={id}
          icon={icon}
          title={t(`${key}Title`)}
          action={
            <div className="flex items-center gap-2">
              <Voice text={[...a.paragraphs, ...a.timeline.map((x) => x.spoken ?? "")].join(" ")} locale={locale} title={t(`${key}Title`)} spokenId={`say-${key}`} />
              <Copy text={a.paragraphs.join("\n\n")} label={t("copy")} />
            </div>
          }
        >
          {"manglik" in a && a.manglik && (
            <p className="mb-3 text-sm">
              <Badge tone={!a.manglik.present ? "success" : a.manglik.cancelled ? "neutral" : "warning"}>
                {!a.manglik.present ? t("manglikNo") : a.manglik.cancelled ? t("manglikCancelled") : t("manglikYes")}
              </Badge>
            </p>
          )}
          <SpokenText id={`say-${key}`} paragraphs={a.paragraphs} />
          {a.timeline.map((tl) => (
            <GoodTimes key={tl.area} block={tl} locale={locale} />
          ))}
        </Section>
      ))}

      <Section
        id="rep-mind"
        icon="moon"
        title={t("mindTitle", { sign: r.rashi.sign, nakshatra: r.nakshatra.name })}
        action={
          <Voice
            text={`${r.rashi.mind}. ${t("tip")}: ${r.rashi.tip}. ${r.nakshatra.name}: ${r.nakshatra.traits}`}
            locale={locale}
            title={t("mindTitle", { sign: r.rashi.sign, nakshatra: r.nakshatra.name })}
          />
        }
      >
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

      <Section id="rep-seva" icon="lotus" title={t("sevaTitle")} action={<Voice text={r.seva} locale={locale} title={t("sevaTitle")} spokenId="say-seva" />}>
        <SpokenText id="say-seva" paragraphs={[r.seva]} />
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

      {/* AMX-200 — Sade Sati & small Panoti timeline */}
      {r.sadeSati && (
        <Section id="rep-sade-sati" icon="hourglass" title={t("sadeSatiTitle")} action={<Voice text={r.sadeSatiText.join(" ")} locale={locale} title={t("sadeSatiTitle")} />}>
          <SadeSatiTimeline timeline={r.sadeSati} text={r.sadeSatiText} locale={locale} />
        </Section>
      )}

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
