import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/sections/LegalPage";
import { SERVICES, SETTINGS } from "@/content/catalog";
import { CONTACT_EMAIL, pageMetadata, withBrand } from "@/lib/seo";

// TODO(legal review): copy in messages/{hi,en}/pages.json → legal.terms must be reviewed by counsel before launch.
const PATH = "/terms";

export async function generateMetadata({ params }: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.legal.terms" });
  return pageMetadata({ locale, path: PATH, title: withBrand(t("title")), description: t("metaDescription") });
}

export default async function TermsPage({ params }: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage
      locale={locale}
      doc="terms"
      path={PATH}
      vars={{ hours: SETTINGS.cancellationHours, holdMinutes: SETTINGS.holdMinutes, email: CONTACT_EMAIL, pct: SERVICES.find((s) => s.splitAllowed)?.advancePct ?? 50 }}
    />
  );
}
