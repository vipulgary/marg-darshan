import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CtaBand } from "@/components/sections/CtaBand";
import { textLinkClass } from "@/components/sections/cta";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { CheckIcon, LockIcon } from "@/components/sections/icons";
import { JsonLd } from "@/components/sections/JsonLd";
import { serviceBookHref } from "@/components/sections/links";
import { PageHero } from "@/components/sections/PageHero";
import { PricingCards, planCard } from "@/components/sections/PricingCards";
import { Section } from "@/components/sections/Section";
import { Badge, SectionTitle } from "@/components/ui/Display";
import { PLANS, SERVICES, pick } from "@/content/catalog";
import { FAQS } from "@/content/faq";
import { Link } from "@/i18n/navigation";
import { formatINR } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata, withBrand } from "@/lib/seo";
import { Icon } from "@/components/icons";

const PATH = "/pricing";

export async function generateMetadata({ params }: PageProps<"/[locale]/pricing">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.pricing" });
  return pageMetadata({ locale, path: PATH, title: withBrand(t("metaTitle")), description: t("metaDescription") });
}

/** AMX-036 — all plans, per-service duration prices, full vs split explanation. */
export default async function PricingPage({ params }: PageProps<"/[locale]/pricing">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.pricing");
  const ts = await getTranslations("pages.shared");
  const tNav = await getTranslations("nav");
  const tc = await getTranslations("cta");
  const splitPct = SERVICES.find((s) => s.splitAllowed)?.advancePct ?? 50;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: tNav("home"), path: "/" },
          { name: t("crumb"), path: PATH },
        ])}
      />
      <PageHero
        crumbsLabel={ts("breadcrumbs")}
        crumbs={[{ label: tNav("home"), href: "/" }, { label: t("crumb") }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        highlight={t("highlight")}
        lead={t("lead")}
      />

      <Section id="plans">
        <div className="flex flex-col gap-12">
          <SectionTitle eyebrow={t("plans.eyebrow")} title={t("plans.title")} highlight={t("plans.highlight")} />
          <PricingCards items={PLANS.map((p) => planCard(p, locale, true))} locale={locale} />
        </div>
      </Section>

      <Section id="services" alt>
        <div className="flex flex-col gap-12">
          <SectionTitle eyebrow={t("services.eyebrow")} title={t("services.title")} highlight={t("services.highlight")} lead={t("services.lead")} />
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <li key={s.slug} className="flex flex-col gap-4 rounded-lg border border-line bg-night-s1 p-6 shadow-e1">
                <div className="flex min-h-[26px] flex-wrap gap-2">
                  {s.splitAllowed && <Badge tone="violet">{ts("pricing.splitBadge")}</Badge>}
                </div>
                <h3 className="text-xl">{pick(s.title, locale)}</h3>
                <p className="text-[15px] text-ink-2">{pick(s.summary, locale)}</p>
                <table className="w-full text-[15px]">
                  <caption className="sr-only">{t("services.tableCaption", { service: pick(s.title, locale) })}</caption>
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">{t("services.duration")}</th>
                      <th scope="col">{t("services.price")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.durations.map((d) => (
                      <tr key={d} className="border-t border-line-subtle">
                        <th scope="row" className="py-2.5 text-left font-medium text-ink-2">
                          {ts("pricing.minutes", { count: d })}
                        </th>
                        <td className="py-2.5 text-right font-semibold text-ink-1 tabular-nums">{formatINR(s.prices[d], locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[13px] text-ink-3">{ts("side.modes")}</p>
                <Link href={s.slug === "birth-time" ? "/birth-time-finder" : serviceBookHref(s.slug)} className={`${textLinkClass} mt-auto self-start`}>
                  {tc("book")} <Icon name="arrow-right" size={16} className="inline-block align-[-3px]" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="plan-types">
        <div className="flex flex-col gap-12">
          <SectionTitle eyebrow={t("types.eyebrow")} title={t("types.title")} highlight={t("types.highlight")} />
          <div className="grid gap-6 md:grid-cols-2">
            {(["full", "split"] as const).map((k) => (
              <article key={k} className="flex flex-col gap-4 rounded-xl border border-line bg-night-s1 p-6 shadow-e1 md:p-8">
                <Badge tone={k === "full" ? "gold" : "violet"} className="w-fit">
                  {k === "full" ? ts("pricing.fullUpfront") : ts("pricing.splitBadge")}
                </Badge>
                <h3 className="text-2xl">{t(`types.${k}.title`)}</h3>
                <p className="text-ink-2">{t(`types.${k}.body`, { pct: splitPct })}</p>
                <ul className="flex flex-col gap-2.5">
                  {(["p1", "p2"] as const).map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-[15px]">
                      <CheckIcon className="mt-0.5 h-[18px] w-[18px] text-gold-300" />
                      {t(`types.${k}.${p}`, { pct: splitPct })}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="flex flex-col items-start gap-3 rounded-lg border border-line bg-night-s2 p-5 sm:flex-row sm:items-center">
            <LockIcon className="h-6 w-6 text-success" />
            <p className="flex-1 text-[15px] text-ink-2">{t("secure")}</p>
            <Link href="/refund-policy" className={textLinkClass}>
              {t("refundLink")}
            </Link>
          </div>
        </div>
      </Section>

      <Section id="faq" alt>
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
          <SectionTitle title={t("faqTitle")} />
          <FaqAccordion items={FAQS.filter((f) => f.category === "payments")} locale={locale} />
        </div>
      </Section>

      <CtaBand
        title={t("cta.title")}
        highlight={t("cta.highlight")}
        lead={t("cta.lead")}
        primary={{ label: tc("book"), href: "/book-appointment" }}
        secondary={{ label: tc("kundali"), href: "/free-kundali" }}
      />
    </>
  );
}
