import { useTranslations } from "next-intl";
import { useId } from "react";
import type { ChartData } from "@/lib/contracts";
import { type ChartDivision, type ChartLang, divisionChart, PLANET_NAMES, SIGN_NAMES, SIGN_SHORT, southIndianCells } from "@/lib/kundali/chart-layout";
import { PlanetLabels } from "./NorthIndianChart";

const C = 98; // cell size; grid spans 4..396
const O = 4;

/** AMX-063 — South Indian D1 chart: fixed signs on a 4×4 grid, centre 2×2 merged for the title. */
export function SouthIndianChart({ chart: base, lang, division = "d1" }: { chart: ChartData; lang: ChartLang; division?: ChartDivision }) {
  const t = useTranslations("kundali.chart");
  const tr = useTranslations("kundali.result");
  const id = useId();
  const chart = divisionChart(base, division);
  const cells = southIndianCells(chart, lang);
  const lagnaName = SIGN_NAMES[lang][chart.ascendant.sign - 1];
  const at = (n: number) => O + n * C;

  const lines = [
    `M${at(1)} ${at(0)}V${at(4)}`,
    `M${at(3)} ${at(0)}V${at(4)}`,
    `M${at(0)} ${at(1)}H${at(4)}`,
    `M${at(0)} ${at(3)}H${at(4)}`,
    `M${at(2)} ${at(0)}V${at(1)}`,
    `M${at(2)} ${at(3)}V${at(4)}`,
    `M${at(0)} ${at(2)}H${at(1)}`,
    `M${at(3)} ${at(2)}H${at(4)}`,
  ].join("");

  return (
    <figure className="mx-auto w-full max-w-[440px]">
      <svg viewBox="0 0 400 400" role="img" aria-labelledby={`${id}-t ${id}-d`} className="h-auto w-full">
        <title id={`${id}-t`}>{t(division === "d9" ? "southTitleD9" : "southTitle")}</title>
        <desc id={`${id}-d`}>{t("desc", { lagna: lagnaName })}</desc>
        <rect x={O} y={O} width={C * 4} height={C * 4} rx="4" className="fill-night-s1 stroke-gold-300" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <path d={lines} fill="none" className="stroke-gold-300" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <text x={200} y={186} textAnchor="middle" fontSize="15" fontWeight={600} className="fill-gold-200">
          {t(division === "d9" ? "centerD9" : "center")} · {division.toUpperCase()}
        </text>
        <text x={200} y={214} textAnchor="middle" fontSize="13" className="fill-ink-2">
          {t("lagnaLabel", { sign: lagnaName })}
        </text>
        {cells.map((c) => {
          const x = at(c.col);
          const y = at(c.row);
          return (
            <g key={c.sign}>
              <text x={x + 8} y={y + 16} fontSize="11" className="fill-ink-3">
                {SIGN_SHORT[lang][c.sign - 1]}
              </text>
              {c.isLagna && (
                <>
                  <path d={`M${x} ${y + 26}L${x + 26} ${y}`} className="stroke-saffron-400" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                  <text x={x + C - 8} y={y + 16} textAnchor="end" fontSize="12" fontWeight={700} className="fill-saffron-400">
                    {tr("ascMarker")}
                  </text>
                </>
              )}
              <PlanetLabels planets={c.planets} cx={x + C / 2} cy={y + C / 2 + 8} perRow={3} lang={lang} retroLabel={t("retro")} />
            </g>
          );
        })}
      </svg>
      <ul className="sr-only">
        {[...cells]
          .sort((a, b) => a.house - b.house)
          .map((c) => (
            <li key={c.sign}>
              {t("house", {
                house: c.house,
                sign: SIGN_NAMES[lang][c.sign - 1],
                planets: c.planets.length ? c.planets.map((p) => PLANET_NAMES[lang][p.key]).join(", ") : t("empty"),
              })}
            </li>
          ))}
      </ul>
    </figure>
  );
}
