import { useTranslations } from "next-intl";
import { useId } from "react";
import type { ChartData } from "@/lib/contracts";
import { type ChartDivision, type ChartLang, divisionChart, type ChartPlanet, PLANET_NAMES, SIGN_NAMES, formatDegMin, northIndianHouses } from "@/lib/kundali/chart-layout";

// Classic diamond-in-square on a 400×400 box: outer square, both diagonals, inner diamond.
const L = 4;
const R = 396;
const M = 200;

// Per house: planet block centre (cx, cy), sign-number spot near the inner vertex (nx, ny), labels per row.
const GEO: Record<number, { cx: number; cy: number; nx: number; ny: number; perRow: number }> = {
  1: { cx: 200, cy: 110, nx: 200, ny: 180, perRow: 3 },
  2: { cx: 102, cy: 36, nx: 102, ny: 84, perRow: 3 },
  3: { cx: 40, cy: 102, nx: 84, ny: 102, perRow: 2 },
  4: { cx: 98, cy: 200, nx: 180, ny: 200, perRow: 3 },
  5: { cx: 40, cy: 298, nx: 84, ny: 298, perRow: 2 },
  6: { cx: 102, cy: 364, nx: 102, ny: 316, perRow: 3 },
  7: { cx: 200, cy: 292, nx: 200, ny: 220, perRow: 3 },
  8: { cx: 298, cy: 364, nx: 298, ny: 316, perRow: 3 },
  9: { cx: 360, cy: 298, nx: 316, ny: 298, perRow: 2 },
  10: { cx: 302, cy: 200, nx: 220, ny: 200, perRow: 3 },
  11: { cx: 360, cy: 102, nx: 316, ny: 102, perRow: 2 },
  12: { cx: 298, cy: 36, nx: 298, ny: 84, perRow: 3 },
};

export function PlanetLabels({
  planets,
  cx,
  cy,
  perRow,
  lang,
  retroLabel,
}: {
  planets: ChartPlanet[];
  cx: number;
  cy: number;
  perRow: number;
  lang: ChartLang;
  retroLabel: string;
}) {
  const crowded = planets.length > 4;
  const per = crowded ? perRow + 1 : perRow;
  const fontSize = crowded ? 12 : 15;
  const rowH = crowded ? 15 : 19;
  const colW = crowded ? 27 : 32;
  const rows = Math.ceil(planets.length / per);
  return (
    <>
      {planets.map((p, i) => {
        const row = Math.floor(i / per);
        const inRow = Math.min(per, planets.length - row * per);
        const col = i % per;
        const x = cx + (col - (inRow - 1) / 2) * colW;
        const y = cy + (row - (rows - 1) / 2) * rowH;
        return (
          <text key={p.key} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={fontSize} fontWeight={600} className="fill-ink-1">
            <title>{`${PLANET_NAMES[lang][p.key]} ${formatDegMin(p.degree)}${p.retrograde ? ` (${retroLabel})` : ""}`}</title>
            <tspan textDecoration={p.retrograde ? "underline" : undefined}>{p.abbr}</tspan>
            {p.retrograde && (
              <tspan fontSize={fontSize * 0.7} dy={-fontSize * 0.3} className="fill-gold-300">
                ᴿ
              </tspan>
            )}
          </text>
        );
      })}
    </>
  );
}

/** AMX-063 — North Indian (diamond) D1 chart, design.md §7.7. */
export function NorthIndianChart({ chart: base, lang, division = "d1" }: { chart: ChartData; lang: ChartLang; division?: ChartDivision }) {
  const t = useTranslations("kundali.chart");
  const tr = useTranslations("kundali.result");
  const id = useId();
  const chart = divisionChart(base, division);
  const houses = northIndianHouses(chart, lang);
  const lagnaName = SIGN_NAMES[lang][chart.ascendant.sign - 1];
  const summary = houses.map((h) =>
    t("house", {
      house: h.house,
      sign: SIGN_NAMES[lang][h.sign - 1],
      planets: h.planets.length ? h.planets.map((p) => `${PLANET_NAMES[lang][p.key]}${p.retrograde ? ` (${t("retro")})` : ""}`).join(", ") : t("empty"),
    }),
  );

  return (
    <figure className="mx-auto w-full max-w-[440px]">
      <svg viewBox="0 0 400 400" role="img" aria-labelledby={`${id}-t ${id}-d`} className="h-auto w-full">
        <title id={`${id}-t`}>{t(division === "d9" ? "northTitleD9" : "northTitle")}</title>
        <desc id={`${id}-d`}>{t("desc", { lagna: lagnaName })}</desc>
        <rect x={L} y={L} width={R - L} height={R - L} rx="4" className="fill-night-s1 stroke-gold-300" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <path
          d={`M${L} ${L}L${R} ${R}M${R} ${L}L${L} ${R}M${M} ${L}L${R} ${M}L${M} ${R}L${L} ${M}Z`}
          fill="none"
          className="stroke-gold-300"
          strokeWidth="1.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <text x={M} y={40} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight={700} className="fill-saffron-400">
          {tr("ascMarker")}
        </text>
        {houses.map((h) => {
          const g = GEO[h.house];
          return (
            <g key={h.house}>
              <text x={g.nx} y={g.ny} textAnchor="middle" dominantBaseline="central" fontSize="12" className="fill-ink-3">
                {h.sign}
              </text>
              <PlanetLabels planets={h.planets} cx={g.cx} cy={g.cy} perRow={g.perRow} lang={lang} retroLabel={t("retro")} />
            </g>
          );
        })}
      </svg>
      <ul className="sr-only">
        {summary.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </figure>
  );
}
