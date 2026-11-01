import { useTranslations } from "next-intl";
import { withGlyph } from "@/lib/zodiac";
import type { ChartData } from "@/lib/contracts";
import { type ChartLang, PLANET_NAMES, dashaProgress } from "@/lib/kundali/chart-layout";

/** Lagna · Rashi · Nakshatra · current mahadasha, as glass chips over the aurora header. */
export function SummaryChips({ chart, lang }: { chart: ChartData; lang: ChartLang }) {
  const t = useTranslations("kundali.summary");
  const moon = chart.planets.moon;
  const running = dashaProgress(chart.vimshottari);
  const chips = [
    { label: t("lagna"), value: withGlyph(chart.ascendant.sign, lang === "hi" ? chart.ascendant.sign_hi : chart.ascendant.sign_en) },
    { label: t("rashi"), value: withGlyph(chart.rashi.sign, lang === "hi" ? chart.rashi.sign_hi : chart.rashi.sign_en) },
    moon && { label: t("nakshatra"), value: `${lang === "hi" ? moon.nakshatra.name_hi : moon.nakshatra.name_en} · ${t("pada", { pada: moon.nakshatra.pada })}` },
    running && {
      label: t("dasha"),
      value: `${PLANET_NAMES[lang][running.current.lord]} · ${t("until", { year: running.current.end.slice(0, 4) })}`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <dl className="flex flex-wrap gap-2.5">
      {chips.map((c) => (
        <div key={c.label} className="rounded-sm border border-white/10 bg-white/[.05] px-3.5 py-2 backdrop-blur-xl">
          <dt className="text-xs text-ink-3">{c.label}</dt>
          <dd className="font-semibold text-ink-1">{c.value}</dd>
        </div>
      ))}
    </dl>
  );
}
