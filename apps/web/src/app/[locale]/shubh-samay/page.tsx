import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShubhSamay } from "@/components/muhurat/ShubhSamay";
import { SectionTitle } from "@/components/ui/Display";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/shubh-samay">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "muhurat.meta" });
  return pageMetadata({ locale, path: "/shubh-samay", title: t("title"), description: t("description") });
}

export default async function ShubhSamayPage({ params }: PageProps<"/[locale]/shubh-samay">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("muhurat");
  return (
    <div className="container-page flex flex-col gap-10 pb-20 pt-12 md:pt-16">
      <SectionTitle as="h1" align="left" eyebrow={t("eyebrow")} title={t("title")} highlight={t("highlight")} lead={t("lead")} />
      <ShubhSamay />
    </div>
  );
}
