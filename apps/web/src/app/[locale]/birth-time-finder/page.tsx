import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getService } from "@/content/catalog";
import { BirthTimeForm } from "@/components/birth-time/BirthTimeForm";
import { AuroraBackground, Reveal } from "@/components/effects";
import { SectionTitle } from "@/components/ui/Display";
import { formatINR } from "@/lib/format";
import { pageMetadata, withBrand } from "@/lib/seo";
import { Icon } from "@/components/icons";

export async function generateMetadata({ params }: PageProps<"/[locale]/birth-time-finder">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "birthTime.meta" });
  return pageMetadata({ locale, path: "/birth-time-finder", title: withBrand(t("title")), description: t("description") });
}

export default async function BirthTimeFinderPage({ params }: PageProps<"/[locale]/birth-time-finder">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("birthTime");
  const service = getService("birth-time");
  const duration = service?.durations[0] ?? 90;
  const price = service?.prices[duration];

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <AuroraBackground intensity="soft" className="-z-10" />
        <div className="container-page flex flex-col items-start gap-6 py-16 md:py-24">
          <SectionTitle as="h1" align="left" eyebrow={t("hero.eyebrow")} title={t("hero.title")} highlight={t("hero.highlight")} lead={t("hero.lead")} />
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#questionnaire"
              className="inline-flex h-14 items-center gap-2 rounded-full bg-grad-gold px-7 text-[17px] font-semibold text-ink-ongold shadow-e1 transition-transform hover:-translate-y-0.5 hover:shadow-glow-gold focus-visible:ring-focus"
            >
              {t("hero.cta")} <Icon name="arrow-down" size={18} />
            </a>
            {price !== undefined && (
              <span className="rounded-full border border-line bg-night-s1/60 px-4 py-2 text-sm text-ink-2">
                {t("hero.offer", { duration, price: formatINR(price, locale) })}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="container-page py-14 md:py-20">
        <SectionTitle eyebrow={t("steps.eyebrow")} title={t("steps.title")} highlight={t("steps.highlight")} />
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {([1, 2, 3] as const).map((n, i) => (
            <li key={n}>
              <Reveal delay={i * 0.07} className="h-full">
                <div className="h-full rounded-lg border border-line bg-night-s1 p-6 shadow-e1">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-grad-gold font-semibold text-ink-ongold">{n}</span>
                  <h3 className="mt-4 text-xl">{t(`steps.s${n}Title`)}</h3>
                  <p className="mt-2 text-ink-2">{t(`steps.s${n}Body`)}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section id="questionnaire" className="container-page scroll-mt-24 pb-16 md:pb-28">
        <div className="mx-auto max-w-3xl rounded-xl border border-line bg-night-s1 p-5 shadow-e2 md:p-10">
          <h2 className="font-display text-[clamp(26px,3.2vw,40px)] leading-tight">{t("form.title")}</h2>
          <p className="mb-8 mt-2 text-ink-2">{t("form.lead")}</p>
          <BirthTimeForm />
        </div>
      </section>
    </>
  );
}
