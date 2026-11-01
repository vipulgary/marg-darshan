import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { KundaliForm } from "@/components/kundali/KundaliForm";
import { Card, SectionTitle, Skeleton } from "@/components/ui/Display";
import { Icon } from "@/components/icons";

export async function generateMetadata({ params }: PageProps<"/[locale]/free-kundali">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "kundali.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === "hi" ? "/free-kundali" : "/en/free-kundali",
      languages: { "hi-IN": "/free-kundali", "en-IN": "/en/free-kundali", "x-default": "/free-kundali" },
    },
  };
}

const BENEFITS = [
  { key: "charts", icon: "kundali" },
  { key: "dasha", icon: "clock" },
  { key: "dosha", icon: "sun" },
  { key: "pdf", icon: "mail" },
] as const;

/** AMX-061 — /free-kundali (design.md §11.4): benefits left, form card right; stacked on mobile. */
export default async function FreeKundaliPage({ params }: PageProps<"/[locale]/free-kundali">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("kundali.page");

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-aurora opacity-50" />
      <div className="container-page relative grid gap-10 py-12 md:py-20 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-8 lg:col-span-5 lg:pt-6">
          <SectionTitle as="h1" align="left" eyebrow={t("eyebrow")} title={t("title")} highlight={t("highlight")} lead={t("lead")} />
          <div>
            <h2 className="mb-4 text-xl">{t("benefitsTitle")}</h2>
            <ul className="flex flex-col gap-4">
              {BENEFITS.map((b) => (
                <li key={b.key} className="flex gap-4">
                  <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line-gold bg-saffron-500/10 text-gold-300">
                    <Icon name={b.icon} size={22} animate="draw" />
                  </span>
                  <span>
                    <span className="block font-semibold text-ink-1">{t(`${b.key}Title`)}</span>
                    <span className="block text-[15px] text-ink-2">{t(`${b.key}Body`)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-7">
          <Card className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl">{t("formTitle")}</h2>
              <p className="mt-1 text-sm text-ink-3">{t("formLead")}</p>
            </div>
            <Suspense fallback={<Skeleton className="h-[640px] w-full" />}>
              <KundaliForm />
            </Suspense>
          </Card>
        </div>
      </div>
    </section>
  );
}
