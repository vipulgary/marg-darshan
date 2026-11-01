import type { Metadata } from "next";
import { withGlyph } from "@/lib/zodiac";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NorthIndianChart } from "@/components/kundali/NorthIndianChart";
import { PrintToolbar } from "@/components/kundali/PrintToolbar";
import { SouthIndianChart } from "@/components/kundali/SouthIndianChart";
import { PLANET_ORDER } from "@/lib/contracts";
import { type ChartLang, PLANET_NAMES, dashaProgress, formatDegMin, parseChartStyle } from "@/lib/kundali/chart-layout";
import { isDbConfigured, isUuid, loadKundali } from "@/lib/kundali/store";
import { SITE_URL } from "@/lib/seo";
import { Icon } from "@/components/icons";
import { KundaliReport } from "@/components/report/KundaliReport";

export async function generateMetadata({ params }: PageProps<"/[locale]/kundali/[id]/print">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "kundali.meta" });
  return { title: t("resultTitle"), robots: { index: false, follow: false } };
}

// Light "paper" palette: the chart SVGs use theme tokens, so re-point them here.
const PRINT_CSS = `
.kundali-print{--color-night-s1:#ffffff;--color-night-s2:#f6f1e7;--color-ink-1:#1c1917;--color-ink-2:#44403c;--color-ink-3:#78716c;
--color-gold-200:#92400e;--color-gold-300:#b45309;--color-saffron-400:#c2410c;--color-line:#e7e0d2;--color-line-subtle:#efe9dd;
background:#fff;color:#1c1917;font-size:12px;line-height:1.45}
.kundali-print table{width:100%;border-collapse:collapse}
.kundali-print th,.kundali-print td{border-bottom:1px solid #e7e0d2;padding:4px 6px;text-align:left;vertical-align:top}
.kundali-print thead th{background:#f6f1e7;font-size:11px;color:#57534e}
.kundali-print h2{font-size:15px;font-weight:700;color:#92400e;margin:0 0 6px}
.kundali-print .avoid-break{break-inside:avoid;page-break-inside:avoid}
@page{size:A4;margin:14mm 12mm 16mm}
@media print{
  html,body{background:#fff!important}
  body:has(.kundali-print) :is(header,footer,nav,aside,[class*="fixed"],[class*="sticky"]):not(.kundali-print *):not(.kundali-print){display:none!important}
  body:has(.kundali-print) main{padding:0!important;margin:0!important}
  .print-hide{display:none!important}
  .kundali-print{box-shadow:none!important;border:0!important;padding:0!important;max-width:none!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page-break{break-before:page;page-break-before:always}
}`;

function fmtDate(iso: string, lang: ChartLang, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { ...opts, timeZone: "UTC", numberingSystem: "latn" }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}

function fmtTime(tob: string): string {
  const [h, m] = tob.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "—";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** AMX-160 — printable kundali (browser "Save as PDF"), A4, light theme. */
export default async function KundaliPrintPage({ params, searchParams }: PageProps<"/[locale]/kundali/[id]/print">) {
  const { locale, id } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  if (!isUuid(id) || !isDbConfigured()) notFound();
  const k = await loadKundali(id);
  if (!k || k.status !== "DONE" || !k.chart) notFound();

  const chart = k.chart;
  const lang: ChartLang = locale === "en" ? "en" : "hi";
  const tReport = await getTranslations("report");
  const style = parseChartStyle(Array.isArray(sp.style) ? sp.style[0] : sp.style, k.chartStyle);
  const t = await getTranslations("kundali.print");
  const tp = await getTranslations("kundali.planets");
  const td = await getTranslations("kundali.doshas");
  const tr = await getTranslations("kundali.result");
  const Chart = style === "north" ? NorthIndianChart : SouthIndianChart;
  const s = k.subject;
  const a = chart.ascendant;
  const name = (o: { name_hi: string; name_en: string }) => (lang === "hi" ? o.name_hi : o.name_en);
  const progress = dashaProgress(chart.vimshottari ?? []);
  const doshas = chart.yogas_doshas?.doshas ?? [];
  const yogas = chart.yogas_doshas?.yogas ?? [];
  const site = SITE_URL.replace(/^https?:\/\//, "");

  const details: [string, string][] = [
    [t("name"), s.name || "—"],
    [t("dob"), fmtDate(s.dob, lang, { day: "numeric", month: "long", year: "numeric" })],
    [t("tob"), fmtTime(s.tob)],
    [t("place"), s.placeName || "—"],
    [t("lagna"), `${withGlyph(a.sign, lang === "hi" ? a.sign_hi : a.sign_en)} ${formatDegMin(a.degree_in_sign)}`],
    [t("rashi"), withGlyph(chart.rashi.sign, lang === "hi" ? chart.rashi.sign_hi : chart.rashi.sign_en)],
    [t("nakshatra"), `${name(chart.planets.moon?.nakshatra ?? a.nakshatra)}–${(chart.planets.moon?.nakshatra ?? a.nakshatra).pada}`],
    [t("ayanamsa"), `${chart.meta.ayanamsa} ${formatDegMin(chart.meta.ayanamsa_deg)}`],
  ];

  return (
    <div className="bg-night-1 px-4 py-8 print:bg-white print:p-0">
      <style>{PRINT_CSS}</style>
      <PrintToolbar id={id} />
      <article lang={locale} className="kundali-print mx-auto max-w-[210mm] rounded-lg p-[12mm] shadow-e3">
        <header className="avoid-break mb-4 flex items-start justify-between gap-4 border-b-2 border-[#b45309] pb-3">
          <div>
            <p className="flex items-center gap-2 text-[20px] font-bold tracking-wide text-[#92400e]">
              {/* eslint-disable-next-line @next/next/no-img-element -- plain img prints reliably */}
              <img src="/brand/emblem.png" alt="" width={40} height={40} className="h-10 w-10 rounded-full" />
              {locale === "en" ? "Marg Darshan" : "मार्ग-दर्शन"}
            </p>
            <p className="text-[11px] text-[#78716c]">{site}</p>
          </div>
          <div className="text-right">
            <h1 className="text-[22px] font-bold leading-tight">
              {t("title")} · {s.name || "—"}
            </h1>
            <p className="text-[11px] text-[#78716c]">{t("generated", { date: fmtDate(new Date().toISOString(), lang) })}</p>
          </div>
        </header>

        <section className="avoid-break mb-4">
          <h2>{t("birthDetails")}</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4 print:grid-cols-4">
            {details.map(([k2, v]) => (
              <div key={k2}>
                <dt className="text-[10px] uppercase tracking-wide text-[#78716c]">{k2}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="avoid-break mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2">
          <div>
            <h2>{t("d1")}</h2>
            <Chart chart={chart} lang={lang} division="d1" />
          </div>
          <div>
            <h2>{t("d9")}</h2>
            <Chart chart={chart} lang={lang} division="d9" />
          </div>
        </section>

        <section className="avoid-break mb-4">
          <h2>{t("planets")}</h2>
          <table>
            <thead>
              <tr>
                <th>{tp("planet")}</th>
                <th>{tp("sign")}</th>
                <th>{tp("degree")}</th>
                <th>{tp("nakshatra")}</th>
                <th>{tp("house")}</th>
                <th>D9</th>
                <th>{tp("status")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>{tp("ascendant")}</th>
                <td>{withGlyph(a.sign, lang === "hi" ? a.sign_hi : a.sign_en)}</td>
                <td>{formatDegMin(a.degree_in_sign)}</td>
                <td>{`${name(a.nakshatra)}–${a.nakshatra.pada}`}</td>
                <td>1</td>
                <td>{a.d9_sign}</td>
                <td>—</td>
              </tr>
              {PLANET_ORDER.filter((key) => chart.planets[key]).map((key) => {
                const p = chart.planets[key];
                return (
                  <tr key={key}>
                    <th>{PLANET_NAMES[lang][key]}</th>
                    <td>{withGlyph(p.sign, lang === "hi" ? p.sign_hi : p.sign_en)}</td>
                    <td>{formatDegMin(p.degree_in_sign)}</td>
                    <td>{`${name(p.nakshatra)}–${p.nakshatra.pada}`}</td>
                    <td>{p.house}</td>
                    <td>{p.d9_sign}</td>
                    <td>{p.retrograde ? `${tp("retro")} (R)` : tp("direct")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="avoid-break page-break mb-4">
          <h2>{t("dasha")}</h2>
          {chart.vimshottari?.length ? (
            <table>
              <thead>
                <tr>
                  <th>{t("lord")}</th>
                  <th>{t("from")}</th>
                  <th>{t("to")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {chart.vimshottari.map((d, i) => {
                  const current = progress?.index === i;
                  return (
                    <tr key={`${d.lord}-${d.start}`} style={current ? { background: "#fef3c7", fontWeight: 700 } : undefined}>
                      <th>{PLANET_NAMES[lang][d.lord]}</th>
                      <td>{fmtDate(d.start, lang)}</td>
                      <td>{fmtDate(d.end, lang)}</td>
                      <td>
                        {current
                          ? `${t("current")}${progress?.antardasha ? ` · ${PLANET_NAMES[lang][progress.antardasha.period.lord]} (${fmtDate(progress.antardasha.period.end, lang)})` : ""}`
                          : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p>—</p>
          )}
        </section>

        <section className="avoid-break mb-4">
          <h2>{t("doshas")}</h2>
          {doshas.length ? (
            <ul className="flex flex-col gap-1.5">
              {doshas.map((d) => (
                <li key={d.key}>
                  <strong>{name(d)}</strong> — {d.present ? (d.cancelled ? td("cancelled") : td("present")) : td("absent")}
                  {d.present && d.severity ? ` (${td(`severity_${d.severity}`)})` : ""}
                  {d.present && <span className="block text-[11px] text-[#57534e]">{lang === "hi" ? d.details_hi : d.details_en}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p>{t("noDoshas")}</p>
          )}
        </section>

        <section className="avoid-break mb-4">
          <h2>{t("yogas")}</h2>
          {yogas.length ? (
            <ul className="flex flex-col gap-1.5">
              {yogas.map((y) => (
                <li key={y.key}>
                  <strong>{name(y)}</strong>
                  <span className="block text-[11px] text-[#57534e]">{lang === "hi" ? y.description_hi : y.description_en}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t("noYogas")}</p>
          )}
        </section>

        <section className="page-break mb-4">

          <h2>{tReport("title")}</h2>

          <KundaliReport chart={chart} locale={locale} name={s.name} dob={s.dob} print />

        </section>


        <footer className="avoid-break mt-6 border-t border-[#e7e0d2] pt-3 text-[10px] text-[#78716c]">
          <p>{tr("disclaimer")}</p>
          <p className="mt-1">{t("footer", { url: site })}</p>
        </footer>
      </article>
    </div>
  );
}
