import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CtaBand } from "@/components/sections/CtaBand";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { JsonLd } from "@/components/sections/JsonLd";
import { PageHero } from "@/components/sections/PageHero";
import { FAQS, FAQ_CATEGORIES } from "@/content/faq";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, withBrand } from "@/lib/seo";
import { buildWhatsAppUrl, whatsappMessage } from "@/lib/whatsapp";

const PATH = "/faq";

export async function generateMetadata({ params }: PageProps<"/[locale]/faq">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.faq" });
  return pageMetadata({ locale, path: PATH, title: withBrand(t("metaTitle")), description: t("metaDescription") });
}

/** AMX-037 — grouped FAQ with FAQPage JSON-LD. */
export default async function FaqPage({ params }: PageProps<"/[locale]/faq">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.faq");
  const ts = await getTranslations("pages.shared");
  const tNav = await getTranslations("nav");
  const tc = await getTranslations("cta");
  const groups = FAQ_CATEGORIES.map((c) => ({ id: c, items: FAQS.filter((f) => f.category === c) })).filter((g) => g.items.length);

  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(FAQS, locale),
          breadcrumbJsonLd(locale, [
            { name: tNav("home"), path: "/" },
            { name: t("crumb"), path: PATH },
          ]),
        ]}
      />
      <PageHero
        crumbsLabel={ts("breadcrumbs")}
        crumbs={[{ label: tNav("home"), href: "/" }, { label: t("crumb") }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        highlight={t("highlight")}
        lead={t("lead")}
      >
        <nav aria-label={t("jump")}>
          <ul className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <li key={g.id}>
                <a
                  href={`#${g.id}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-line bg-night-s1 px-4 text-[15px] text-ink-2 transition-colors hover:border-line-gold hover:text-gold-200 focus-visible:ring-focus"
                >
                  {t(`categories.${g.id}`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>
      <div className="container-page flex max-w-3xl flex-col gap-14 py-14 md:py-[72px] lg:py-24">
        {groups.map((g) => (
          <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="flex scroll-mt-28 flex-col gap-5">
            <h2 id={`${g.id}-title`} className="font-display text-[clamp(24px,3vw,32px)]">
              {t(`categories.${g.id}`)}
            </h2>
            <FaqAccordion items={g.items} locale={locale} />
          </section>
        ))}
      </div>
      <CtaBand
        title={t("cta.title")}
        lead={t("cta.lead")}
        primary={{ label: tc("book"), href: "/book-appointment" }}
        secondary={{
          label: tc("whatsapp"),
          href: buildWhatsAppUrl({ message: whatsappMessage("general", locale) }),
          external: true,
          whatsapp: true,
        }}
      />
    </>
  );
}
