import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NumerologyCalculator } from "@/components/numerology/Numerology";
import { SectionTitle } from "@/components/ui/Display";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/numerology">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "numerology.meta" });
  return pageMetadata({ locale, path: "/numerology", title: t("title"), description: t("description") });
}

export default async function NumerologyPage({ params }: PageProps<"/[locale]/numerology">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("numerology");
  return (
    <div className="container-page flex flex-col gap-10 pb-20 pt-12 md:pt-16">
      <SectionTitle as="h1" align="left" eyebrow={t("eyebrow")} title={t("title")} highlight={t("highlight")} lead={t("lead")} />
      <NumerologyCalculator />
    </div>
  );
}
