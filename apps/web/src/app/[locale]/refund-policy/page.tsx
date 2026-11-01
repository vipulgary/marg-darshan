import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/sections/LegalPage";
import { SERVICES, SETTINGS } from "@/content/catalog";
import { CONTACT_EMAIL, pageMetadata, withBrand } from "@/lib/seo";

// TODO(legal review): copy in messages/{hi,en}/pages.json → legal.refund must be reviewed by counsel before launch.
const PATH = "/refund-policy";

export async function generateMetadata({ params }: PageProps<"/[locale]/refund-policy">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.legal.refund" });
  return pageMetadata({ locale, path: PATH, title: withBrand(t("title")), description: t("metaDescription") });
}

export default async function RefundPage({ params }: PageProps<"/[locale]/refund-policy">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage
      locale={locale}
      doc="refund"
      path={PATH}
      vars={{ hours: SETTINGS.cancellationHours, holdMinutes: SETTINGS.holdMinutes, email: CONTACT_EMAIL, pct: SERVICES.find((s) => s.splitAllowed)?.advancePct ?? 50 }}
    />
  );
}
