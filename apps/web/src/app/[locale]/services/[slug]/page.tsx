import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CtaBand } from "@/components/sections/CtaBand";
import { ctaClass, textLinkClass } from "@/components/sections/cta";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { ArrowRightIcon, CheckIcon, CompassIcon, GemIcon, SunIcon, WhatsAppIcon } from "@/components/sections/icons";
import { JsonLd } from "@/components/sections/JsonLd";
import { bookHref, serviceBookHref } from "@/components/sections/links";
import { PageHero } from "@/components/sections/PageHero";
import { PricingCards, serviceCards } from "@/components/sections/PricingCards";
import { Steps } from "@/components/sections/Steps";
import { Badge } from "@/components/ui/Display";
import { PRODUCTS, PROBLEMS, getService, pick } from "@/content/catalog";
import { faqsForService } from "@/content/faq";
import { Link } from "@/i18n/navigation";
import { formatINR } from "@/lib/format";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, serviceJsonLd, withBrand } from "@/lib/seo";
import { buildWhatsAppUrl, whatsappMessage } from "@/lib/whatsapp";
import { Icon } from "@/components/icons";

// birth-time has its own page (/birth-time-finder), owned by the shop agent.
const SLUGS = ["astrology", "vastu", "gems"] as const;
type Slug = (typeof SLUGS)[number];

export const dynamicParams = false;

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

const isSlug = (s: string): s is Slug => (SLUGS as readonly string[]).includes(s);

export async function generateMetadata({ params }: PageProps<"/[locale]/services/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isSlug(slug)) return {};
  const t = await getTranslations({ locale, namespace: `pages.services.${slug}` });
  return pageMetadata({ locale, path: `/services/${slug}`, title: withBrand(t("metaTitle")), description: t("metaDescription") });
}

const ICONS = { astrology: SunIcon, vastu: CompassIcon, gems: GemIcon } as const;

/** AMX-033/034/035 — design.md §11.3. */
export default async function ServicePage({ params }: PageProps<"/[locale]/services/[slug]">) {
  const { locale, slug } = await params;
  const service = getService(slug);
  if (!isSlug(slug) || !service) notFound();
  setRequestLocale(locale);

  const t = await getTranslations(`pages.services.${slug}`);
  const ts = await getTranslations("pages.shared");
  const tNav = await getTranslations("nav");
  const tc = await getTranslations("cta");

  const path = `/services/${slug}`;
  const title = pick(service.title, locale);
  const problems = PROBLEMS.filter((p) => p.serviceSlug === slug);
  const faqs = faqsForService(slug);
  const cards = serviceCards(service, locale, (min) => ts("pricing.durationName", { minutes: min }));
  const minPrice = Math.min(...Object.values(service.prices));
  const whatsappUrl = buildWhatsAppUrl({ message: whatsappMessage(slug, locale) });
  const ServiceIcon = ICONS[slug];
  const compareRows = ["r1", "r2", "r3", "r4", "r5"] as const;
  const h2 = "font-display text-[clamp(26px,3.2vw,36px)] leading-tight";

  return (
    <>
      <JsonLd
        data={[
          serviceJsonLd(service, locale),
          breadcrumbJsonLd(locale, [
            { name: tNav("home"), path: "/" },
            { name: title, path },
          ]),
          ...(faqs.length ? [faqJsonLd(faqs, locale)] : []),
        ]}
      />
      <PageHero
        crumbsLabel={ts("breadcrumbs")}
        crumbs={[{ label: tNav("home"), href: "/" }, { label: tNav("services") }, { label: title }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        highlight={t("highlight")}
        lead={t("lead")}
        aside={
          <div aria-hidden className="relative mx-auto hidden aspect-square w-full max-w-[340px] place-items-center lg:grid">
            <div className="absolute inset-6 rounded-full bg-grad-primary opacity-30 blur-3xl" />
            <div className="relative grid h-[78%] w-[78%] place-items-center rounded-full border border-line-gold bg-night-s1/70 shadow-glow-violet">
              <div className="absolute inset-5 rounded-full border border-dashed border-gold-300/25" />
              <ServiceIcon className="h-28 w-28 text-gold-300 [stroke-width:1]" animate="draw" />
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={serviceBookHref(slug)} className={ctaClass("primary", "lg")}>
            {tc("book")}
            <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={ctaClass("whatsapp", "lg")}>
            <WhatsAppIcon />
            {tc("whatsapp")}
          </a>
        </div>
      </PageHero>

      <div className="container-page grid gap-12 py-14 md:py-[72px] lg:grid-cols-12 lg:gap-10 lg:py-24">
        <div className="flex min-w-0 flex-col gap-16 lg:col-span-8">
          <section className="flex flex-col gap-5" aria-labelledby="help-title">
            <h2 id="help-title" className={h2}>
              {ts("helpTitle")}
            </h2>
            <ul className="flex flex-wrap gap-2.5">
              {problems.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={bookHref(p.slug)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-night-s1 px-4 text-[15px] text-ink-1 transition-colors hover:border-line-gold hover:text-gold-200 focus-visible:ring-focus"
                  >
                    <Icon name={p.icon} size={18} className="text-gold-300" />
                    {pick(p.title, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Service-specific block */}
          <section className="flex flex-col gap-6" aria-labelledby="about-title">
            <h2 id="about-title" className={h2}>
              {t("about.title")}
            </h2>
            <p className="max-w-[68ch] text-ink-2">{t("about.body")}</p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {(["c1", "c2", "c3"] as const).map((c) => (
                <li key={c} className="flex flex-col gap-2 rounded-lg border border-line bg-night-s1 p-5 shadow-e1 last:sm:col-span-2">
                  <h3 className="text-lg">{t(`about.${c}.title`)}</h3>
                  <p className="text-[15px] text-ink-2">{t(`about.${c}.body`)}</p>
                </li>
              ))}
            </ul>
            {slug === "vastu" && service.splitAllowed && (
              <div className="flex flex-col gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 p-5">
                <Badge tone="violet" className="w-fit">
                  {ts("pricing.splitBadge")}
                </Badge>
                <p className="text-ink-1">{ts("splitInfo", { pct: service.advancePct ?? 50 })}</p>
              </div>
            )}
            {slug === "gems" && (
              <div className="flex flex-col gap-5">
                <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {PRODUCTS.filter((p) => p.category === "GEM").map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/shop/${p.slug}`}
                        className="group flex h-full flex-col gap-3 rounded-lg border border-line bg-night-s1 p-4 transition-all hover:-translate-y-1 hover:border-line-hover focus-visible:ring-focus"
                      >
                        <span
                          aria-hidden
                          className="grid aspect-square place-items-center rounded-md bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,.35),rgba(124,58,237,.25)_45%,#07060f_80%)]"
                        >
                          <GemIcon className="h-10 w-10 text-gold-200 transition-transform group-hover:scale-110" />
                        </span>
                        <span className="text-[15px] font-semibold leading-snug text-ink-1">{pick(p.title, locale)}</span>
                        <span className="text-[13px] text-ink-3">{pick(p.priceHint, locale)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="text-[15px] text-ink-2">{ts("gemNote")}</p>
                <Link href="/shop" className={`${textLinkClass} self-start`}>
                  {ts("toShop")} <Icon name="arrow-right" size={16} className="inline-block align-[-3px]" />
                </Link>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-8" aria-labelledby="process-title">
            <h2 id="process-title" className={h2}>
              {ts("processTitle")}
            </h2>
            <Steps
              className="lg:!grid-cols-2"
              items={(["s1", "s2", "s3", "s4"] as const).map((s) => ({
                title: t(`steps.${s}.title`),
                body: t(`steps.${s}.body`),
              }))}
            />
          </section>

          <section className="flex flex-col gap-6" aria-labelledby="compare-title">
            <h2 id="compare-title" className={h2}>
              {ts("compare.title")}
            </h2>
            <table className="hidden w-full overflow-hidden rounded-lg border border-line text-left md:table">
              <thead className="bg-night-s2 text-[13px] text-ink-3 [:lang(en)_&]:uppercase [:lang(en)_&]:tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    <span className="sr-only">{ts("compare.feature")}</span>
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    {ts("modes.online.title")}
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    {ts("modes.visit.title")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((r) => (
                  <tr key={r} className="border-t border-line-subtle transition-colors hover:bg-night-s2/60">
                    <th scope="row" className="px-5 py-4 font-semibold text-ink-1">
                      {t(`compare.${r}.label`)}
                    </th>
                    <td className="px-5 py-4 text-[15px] text-ink-2">{t(`compare.${r}.online`)}</td>
                    <td className="px-5 py-4 text-[15px] text-ink-2">{t(`compare.${r}.visit`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="flex flex-col gap-3 md:hidden">
              {compareRows.map((r) => (
                <div key={r} className="rounded-lg border border-line bg-night-s1 p-4">
                  <dt className="mb-2 font-semibold text-ink-1">{t(`compare.${r}.label`)}</dt>
                  <dd className="text-[15px] text-ink-2">
                    <span className="font-medium text-gold-300">{ts("modes.online.title")}: </span>
                    {t(`compare.${r}.online`)}
                  </dd>
                  <dd className="mt-1 text-[15px] text-ink-2">
                    <span className="font-medium text-gold-300">{ts("modes.visit.title")}: </span>
                    {t(`compare.${r}.visit`)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="flex flex-col gap-8" aria-labelledby="plans-title">
            <h2 id="plans-title" className={h2}>
              {ts("plansTitle")}
            </h2>
            <PricingCards items={cards} locale={locale} />
          </section>

          {faqs.length > 0 && (
            <section className="flex flex-col gap-6" aria-labelledby="faq-title">
              <h2 id="faq-title" className={h2}>
                {ts("faqTitle")}
              </h2>
              <FaqAccordion items={faqs} locale={locale} />
            </section>
          )}
        </div>

        <aside className="lg:col-span-4" aria-label={ts("side.label")}>
          <div className="flex flex-col gap-5 rounded-xl border border-line-gold bg-night-s1 p-6 shadow-e2 lg:sticky lg:top-28">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-saffron-500/14 text-gold-300">
                <ServiceIcon />
              </span>
              <p className="text-lg font-semibold text-ink-1">{title}</p>
            </div>
            <p className="flex items-baseline gap-2">
              <span className="text-[13px] text-ink-3">{ts("side.from")}</span>
              <span className="text-[32px] font-bold leading-none text-ink-1 tabular-nums">{formatINR(minPrice, locale)}</span>
            </p>
            <ul className="flex flex-col gap-2 text-[15px]">
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-[18px] w-[18px] text-gold-300" />
                {ts("side.durations", { list: service.durations.map((d) => ts("pricing.minutes", { count: d })).join(" · ") })}
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-[18px] w-[18px] text-gold-300" />
                {ts("side.modes")}
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-[18px] w-[18px] text-gold-300" />
                {ts("side.secure")}
              </li>
            </ul>
            <Link href={serviceBookHref(slug)} className={ctaClass("primary", "md", "w-full")}>
              {tc("book")}
              <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={ctaClass("secondary", "md", "w-full")}>
              <WhatsAppIcon />
              {tc("whatsapp")}
            </a>
          </div>
        </aside>
      </div>

      <CtaBand
        title={t("cta.title")}
        highlight={t("cta.highlight")}
        lead={t("cta.lead")}
        primary={{ label: tc("book"), href: serviceBookHref(slug) }}
        secondary={{ label: ts("allPricing"), href: "/pricing" }}
      />
    </>
  );
}
