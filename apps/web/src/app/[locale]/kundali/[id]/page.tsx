import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { KundaliFailed, KundaliPoller } from "@/components/kundali/KundaliPoller";
import { KundaliHeader, KundaliResult } from "@/components/kundali/KundaliResult";
import { isDbConfigured, isUuid, loadKundali } from "@/lib/kundali/store";

export async function generateMetadata({ params }: PageProps<"/[locale]/kundali/[id]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "kundali.meta" });
  // Personal data: never index result pages.
  return { title: t("resultTitle"), description: t("resultDescription"), robots: { index: false, follow: false } };
}

export default async function KundaliPage({ params }: PageProps<"/[locale]/kundali/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (!isUuid(id)) notFound();

  if (!isDbConfigured()) {
    const t = await getTranslations("kundali.result");
    return (
      <div className="container-page py-20 text-center">
        <p role="alert" className="text-ink-2">
          {t("unavailable")}
        </p>
      </div>
    );
  }

  const k = await loadKundali(id);
  if (!k) notFound();
  const subject = { name: k.subject.name, dob: k.subject.dob, tob: k.subject.tob, placeName: k.subject.placeName };

  if (k.status === "DONE" && k.chart) {
    return (
      <>
        <KundaliHeader subject={subject} chart={k.chart} />
        <KundaliResult id={k.id} chart={k.chart} chartStyle={k.chartStyle} name={subject.name} dob={subject.dob} />
      </>
    );
  }
  if (k.status === "FAILED") {
    return (
      <>
        <KundaliHeader subject={subject} />
        <KundaliFailed />
      </>
    );
  }
  return <KundaliPoller id={k.id} subject={subject} chartStyle={k.chartStyle} initialStatus={k.status} />;
}
