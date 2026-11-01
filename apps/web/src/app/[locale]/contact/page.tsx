import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ctaClass } from "@/components/sections/cta";
import { CalendarIcon, ClockIcon, MailIcon, MapPinIcon, WhatsAppIcon } from "@/components/sections/icons";
import { JsonLd } from "@/components/sections/JsonLd";
import { officeDays, officeTime } from "@/components/sections/office";
import { PageHero } from "@/components/sections/PageHero";
import { pick } from "@/content/catalog";
import { Link } from "@/i18n/navigation";
import { breadcrumbJsonLd, businessJsonLd, pageMetadata, withBrand } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { buildWhatsAppUrl, whatsappMessage } from "@/lib/whatsapp";

const PATH = "/contact";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.contact" });
  return pageMetadata({ locale, path: PATH, title: withBrand(t("metaTitle")), description: t("metaDescription") });
}

/** AMX-037 — contact: WhatsApp first (most visitors arrive from WhatsApp), email, office, booking. */
export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.contact");
  const ts = await getTranslations("pages.shared");
  const tNav = await getTranslations("nav");
  const tc = await getTranslations("cta");
  const settings = await getSettings();
  const whatsappUrl = buildWhatsAppUrl({ number: settings.whatsappNumber, message: whatsappMessage("general", locale) });
  const card = "flex flex-col gap-4 rounded-xl border border-line bg-night-s1 p-6 shadow-e1 md:p-8";
  const iconWrap = "grid h-12 w-12 place-items-center rounded-md bg-saffron-500/14 text-gold-300";

  return (
    <>
      <JsonLd
        data={[
          businessJsonLd(locale),
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
      />
      <div className="container-page grid gap-6 py-14 md:grid-cols-2 md:py-[72px] lg:py-24">
        <article className={`${card} border-[#25D366]/40 md:col-span-2 md:flex-row md:items-center md:gap-8`}>
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#25D366]/15 text-[#25D366]">
            <WhatsAppIcon className="h-7 w-7" />
          </span>
          <div className="flex flex-1 flex-col gap-1.5">
            <h2 className="text-2xl">{t("whatsapp.title")}</h2>
            <p className="text-ink-2">{t("whatsapp.body")}</p>
          </div>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={ctaClass("whatsapp", "lg")}>
            <WhatsAppIcon />
            {tc("whatsapp")}
          </a>
        </article>

        <article className={card}>
          <span className={iconWrap}>
            <MailIcon className="h-6 w-6" />
          </span>
          <h2 className="text-2xl">{t("email.title")}</h2>
          <p className="text-ink-2">{t("email.body")}</p>
          <a
            href={`mailto:${settings.contactEmail}`}
            className="mt-auto w-fit break-all rounded-sm font-semibold text-violet-300 underline-offset-[3px] hover:text-gold-300 hover:underline focus-visible:ring-focus"
          >
            {settings.contactEmail}
          </a>
        </article>

        <article className={card}>
          <span className={iconWrap}>
            <MapPinIcon className="h-6 w-6" />
          </span>
          <h2 className="text-2xl">{t("office.title")}</h2>
          <address className="not-italic text-ink-2">{pick(settings.officeAddress, locale)}</address>
          <p className="mt-auto flex items-center gap-2 text-[15px] text-ink-2">
            <ClockIcon className="text-gold-300" />
            <span>
              {officeDays(locale)} · {officeTime()}
            </span>
          </p>
          <p className="text-[13px] text-ink-3">{t("office.note")}</p>
        </article>

        <article className={`${card} md:col-span-2 md:flex-row md:items-center md:gap-8`}>
          <span className={iconWrap}>
            <CalendarIcon className="h-6 w-6" />
          </span>
          <div className="flex flex-1 flex-col gap-1.5">
            <h2 className="text-2xl">{t("book.title")}</h2>
            <p className="text-ink-2">{t("book.body")}</p>
          </div>
          <Link href="/book-appointment" className={ctaClass("primary", "lg")}>
            {tc("book")}
          </Link>
        </article>
      </div>
    </>
  );
}
