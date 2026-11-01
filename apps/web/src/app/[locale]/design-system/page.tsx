import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SectionTitle } from "@/components/ui/Display";
import { pageMetadata, withBrand } from "@/lib/seo";
import { ComponentShowcase } from "./ComponentShowcase";

export async function generateMetadata({ params }: PageProps<"/[locale]/design-system">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.designSystem" });
  return pageMetadata({ locale, path: "/design-system", title: withBrand(t("title")), description: t("lead"), noIndex: true });
}

/** QA-only living style guide (AMX-012), kept out of the sitemap and robots. */
export default async function DesignSystemPage({ params }: PageProps<"/[locale]/design-system">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.designSystem");
  return (
    <>
      <div className="container-page pt-12 md:pt-16">
        <SectionTitle as="h1" align="left" eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
      </div>
      <ComponentShowcase />
    </>
  );
}
