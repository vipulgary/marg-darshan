import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { TodayPanchang } from "@/components/panchang/TodayPanchang";
import { CtaBand } from "@/components/sections/CtaBand";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { HomeHero, ProblemGrid, ServicesBento, TrustMarquee } from "@/components/sections/Home";
import { HourglassIcon, CheckIcon } from "@/components/sections/icons";
import { JsonLd } from "@/components/sections/JsonLd";
import { MeetJyotish } from "@/components/sections/Jyotish";
import { OnlineVsVisit } from "@/components/sections/OnlineVsVisit";
import { PricingCards, planCard } from "@/components/sections/PricingCards";
import { Section } from "@/components/sections/Section";
import { Steps } from "@/components/sections/Steps";
import { Testimonials } from "@/components/sections/Testimonials";
import { textLinkClass } from "@/components/sections/cta";
import { SectionTitle } from "@/components/ui/Display";
import { PLANS } from "@/content/catalog";
import { topFaqs } from "@/content/faq";
import { Link } from "@/i18n/navigation";
import { businessJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { Icon } from "@/components/icons";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata({ locale, path: "/", title: t("title"), description: t("description") });
}

/** AMX-031 — home page, sections in the order of design.md §11.1. */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tc = await getTranslations("cta");
  const faqs = topFaqs(5);

  return (
    <>
      <JsonLd data={[businessJsonLd(locale), faqJsonLd(faqs, locale)]} />
      <HomeHero locale={locale} />
      <TrustMarquee />
      <Section id="problems">
        <ProblemGrid locale={locale} />
      </Section>
      <Section id="services" alt>
        <ServicesBento locale={locale} />
      </Section>
      <Section id="jyotish">
        <MeetJyotish locale={locale} />
      </Section>
      <Section id="how" alt>
        <div className="flex flex-col gap-12">
          <SectionTitle eyebrow={t("how.eyebrow")} title={t("how.title")} highlight={t("how.highlight")} lead={t("how.lead")} />
          <Steps
            items={(["s1", "s2", "s3", "s4"] as const).map((s) => ({ title: t(`how.${s}.title`), body: t(`how.${s}.body`) }))}
          />
        </div>
      </Section>
      <Section id="modes">
        <OnlineVsVisit />
      </Section>
      <Section id="pricing" alt>
        <div className="flex flex-col gap-12">
          <SectionTitle
            eyebrow={t("pricing.eyebrow")}
            title={t("pricing.title")}
            highlight={t("pricing.highlight")}
            lead={t("pricing.lead")}
          />
          <PricingCards items={PLANS.slice(0, 3).map((p) => planCard(p, locale, true))} locale={locale} />
          <p className="text-center">
            <Link href="/pricing" className={textLinkClass}>
              {t("pricing.all")} <Icon name="arrow-right" size={16} className="inline-block align-[-3px]" />
            </Link>
          </p>
        </div>
      </Section>
      <CtaBand
        icon={<HourglassIcon className="h-7 w-7" />}
        eyebrow={t("birthTime.eyebrow")}
        title={t("birthTime.title")}
        highlight={t("birthTime.highlight")}
        lead={t("birthTime.lead")}
        primary={{ label: t("birthTime.cta"), href: "/birth-time-finder" }}
      />
      <Testimonials locale={locale} />
      <Section id="newsletter" alt>
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <SectionTitle
              align="left"
              eyebrow={t("newsletter.eyebrow")}
              title={t("newsletter.title")}
              highlight={t("newsletter.highlight")}
              lead={t("newsletter.lead")}
            />
            <ul className="flex flex-col gap-2.5">
              {(["p1", "p2", "p3"] as const).map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <CheckIcon className="mt-1 h-[18px] w-[18px] text-gold-300" />
                  {t(`newsletter.${p}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-6 lg:col-span-7">
            <NewsletterSignup variant="page" />
            <TodayPanchang />
          </div>
        </div>
      </Section>
      <Section id="faq">
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
          <SectionTitle eyebrow={t("faq.eyebrow")} title={t("faq.title")} highlight={t("faq.highlight")} />
          <FaqAccordion items={faqs} locale={locale} />
          <p className="text-center">
            <Link href="/faq" className={textLinkClass}>
              {t("faq.all")} <Icon name="arrow-right" size={16} className="inline-block align-[-3px]" />
            </Link>
          </p>
        </div>
      </Section>
      <CtaBand
        title={t("final.title")}
        highlight={t("final.highlight")}
        lead={t("final.lead")}
        primary={{ label: tc("book"), href: "/book-appointment" }}
        secondary={{ label: tc("kundali"), href: "/free-kundali" }}
      />
    </>
  );
}
