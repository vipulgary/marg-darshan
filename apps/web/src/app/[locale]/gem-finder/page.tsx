import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GemFinder } from "@/components/gems/GemFinder";
import { SectionTitle } from "@/components/ui/Display";
import { listSavedProfiles } from "@/lib/account/queries";
import { getCurrentClient } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/gem-finder">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gems.meta" });
  return pageMetadata({ locale, path: "/gem-finder", title: t("title"), description: t("description") });
}

export default async function GemFinderPage({ params }: PageProps<"/[locale]/gem-finder">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("gems");
  const me = await getCurrentClient().catch(() => null);
  const profiles = me ? await listSavedProfiles(me.id) : [];
  return (
    <div className="container-page flex flex-col gap-10 pb-20 pt-12 md:pt-16">
      <SectionTitle as="h1" align="left" eyebrow={t("eyebrow")} title={t("title")} highlight={t("highlight")} lead={t("lead")} />
      <GemFinder profiles={profiles} />
    </div>
  );
}
