import { useTranslations } from "next-intl";
import { withGlyph } from "@/lib/zodiac";
import { Badge } from "@/components/ui/Display";
import { type ChartData, PLANET_ORDER, type PlanetKey } from "@/lib/contracts";
import { type ChartLang, PLANET_COLORS, PLANET_NAMES, formatDegMin } from "@/lib/kundali/chart-layout";

interface Row {
  key: PlanetKey | "asc";
  name: string;
  sign: string;
  degree: string;
  nakshatra: string;
  house: number;
  retrograde: boolean | null;
}

/** AMX-063 — planet table (design.md §7.5); stacked cards below md. */
export function PlanetTable({ chart, lang }: { chart: ChartData; lang: ChartLang }) {
  const t = useTranslations("kundali.planets");
  const nak = (n: { name_hi: string; name_en: string; pada: number }) => `${lang === "hi" ? n.name_hi : n.name_en}–${n.pada}`;
  const a = chart.ascendant;
  const rows: Row[] = [
    { key: "asc", name: t("ascendant"), sign: withGlyph(a.sign, lang === "hi" ? a.sign_hi : a.sign_en), degree: formatDegMin(a.degree_in_sign), nakshatra: nak(a.nakshatra), house: 1, retrograde: null },
    ...PLANET_ORDER.filter((k) => chart.planets[k]).map((k) => {
      const p = chart.planets[k];
      return {
        key: k,
        name: PLANET_NAMES[lang][k],
        sign: withGlyph(p.sign, lang === "hi" ? p.sign_hi : p.sign_en),
        degree: formatDegMin(p.degree_in_sign),
        nakshatra: nak(p.nakshatra),
        house: p.house,
        retrograde: p.retrograde,
      };
    }),
  ];

  const dot = (key: Row["key"]) => (
    <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: key === "asc" ? "var(--color-saffron-400, #fbbf24)" : PLANET_COLORS[key] }} />
  );
  const status = (r: Row) =>
    r.retrograde === null ? <span className="text-ink-3">—</span> : r.retrograde ? <Badge tone="gold">{t("retro")} <sup>R</sup></Badge> : <span className="text-ink-3">{t("direct")}</span>;

  return (
    <div>
      <table className="hidden w-full border-collapse overflow-hidden rounded-lg text-[15px] md:table">
        <caption className="sr-only">{t("caption")}</caption>
        <thead>
          <tr className="bg-night-s2 text-left text-xs font-semibold text-ink-3 [:lang(en)_&]:uppercase [:lang(en)_&]:tracking-wider">
            {(["planet", "sign", "degree", "nakshatra", "house", "status"] as const).map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-semibold">
                {t(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="h-12 border-b border-line-subtle transition-colors hover:bg-night-s2">
              <th scope="row" className="px-4 text-left font-semibold text-ink-1">
                <span className="flex items-center gap-2.5">
                  {dot(r.key)}
                  {r.name}
                </span>
              </th>
              <td className="px-4">{r.sign}</td>
              <td className="px-4 tabular-nums">{r.degree}</td>
              <td className="px-4">{r.nakshatra}</td>
              <td className="px-4 tabular-nums">{r.house}</td>
              <td className="px-4">{status(r)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col gap-2.5 md:hidden" aria-label={t("caption")}>
        {rows.map((r) => (
          <li key={r.key} className="rounded-md border border-line bg-night-s1 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 font-semibold text-ink-1">
                {dot(r.key)}
                {r.name}
              </span>
              {status(r)}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-ink-3">{t("sign")}</dt>
              <dd>{r.sign}</dd>
              <dt className="text-ink-3">{t("degree")}</dt>
              <dd className="tabular-nums">{r.degree}</dd>
              <dt className="text-ink-3">{t("nakshatra")}</dt>
              <dd>{r.nakshatra}</dd>
              <dt className="text-ink-3">{t("house")}</dt>
              <dd className="tabular-nums">{r.house}</dd>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
