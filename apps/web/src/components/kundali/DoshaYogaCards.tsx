import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Display";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import type { Dosha, Yoga } from "@/lib/contracts";
import { type ChartLang, PLANET_ABBR, PLANET_COLORS } from "@/lib/kundali/chart-layout";
import { Icon } from "@/components/icons";

const rank = (d: Dosha) => (d.present && !d.cancelled ? 0 : d.present ? 1 : 2);

/** AMX-063 — dosha badges and yoga list. */
export function DoshaYogaCards({ data, lang }: { data?: { doshas: Dosha[]; yogas: Yoga[] }; lang: ChartLang }) {
  const t = useTranslations("kundali.doshas");
  if (!data) return <p className="rounded-lg border border-line bg-night-s1 p-6 text-ink-2">{t("soon")}</p>;
  const doshas = [...data.doshas].sort((a, b) => rank(a) - rank(b));

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="doshas-h" className="flex flex-col gap-4">
        <h3 id="doshas-h" className="text-xl">
          {t("doshasTitle")}
        </h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {doshas.map((d) => {
            const active = d.present && !d.cancelled;
            return (
              <li key={d.key} className={cn("flex flex-col gap-3 rounded-lg border bg-night-s1 p-5", active ? "border-sindoor-600/50" : "border-line")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-lg">{lang === "hi" ? d.name_hi : d.name_en}</h4>
                  {active ? (
                    d.severity === "high" ? (
                      <Badge tone="error">
                        {t("present")} · {t("severity_high")}
                      </Badge>
                    ) : (
                      <Badge tone="warning">
                        {t("present")}
                        {d.severity && ` · ${t(`severity_${d.severity}`)}`}
                      </Badge>
                    )
                  ) : d.present ? (
                    <Badge tone="neutral">{t("cancelled")}</Badge>
                  ) : (
                    <Badge tone="success">{t("absent")}</Badge>
                  )}
                </div>
                <p className="text-[15px] text-ink-2">{lang === "hi" ? d.details_hi : d.details_en}</p>
                {d.present && d.cancelled && <p className="text-[13px] text-ink-3">{t("cancelledNote")}</p>}
                {active && (
                  <Link href="/book-appointment?problem=dosha" className="mt-auto inline-flex min-h-11 items-center text-sm font-semibold text-violet-300 hover:text-gold-300 hover:underline focus-visible:ring-focus">
                    {t("remedyCta")} <Icon name="arrow-right" size={16} className="ml-1" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="yogas-h" className="flex flex-col gap-4">
        <h3 id="yogas-h" className="text-xl">
          {t("yogasTitle")}
        </h3>
        {data.yogas.length === 0 ? (
          <p className="text-ink-3">{t("noYogas")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.yogas.map((y) => (
              <li key={y.key} className="flex flex-col gap-2.5 rounded-lg border border-line-gold/60 bg-night-s1 p-5">
                <h4 className="flex items-center gap-2 text-lg text-gold-200"><Icon name="sparkle" size={16} animate="draw" /> {lang === "hi" ? y.name_hi : y.name_en}</h4>
                <p className="text-[15px] text-ink-2">{lang === "hi" ? y.description_hi : y.description_en}</p>
                {y.planets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {y.planets.map((p) => (
                      <span key={p} className="inline-flex items-center gap-1.5 rounded-sm bg-white/6 px-2 py-0.5 text-xs text-ink-2">
                        <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: PLANET_COLORS[p] }} />
                        {PLANET_ABBR[lang][p]}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
