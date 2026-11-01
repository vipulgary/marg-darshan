import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookingFunnel } from "@/components/booking/BookingFunnel";
import { PricingProvider } from "@/components/booking/PricingContext";
import { getSettings } from "@/lib/settings";
import { SectionTitle } from "@/components/ui/Display";

export async function generateMetadata({ params }: PageProps<"/[locale]/book-appointment">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "booking.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === "hi" ? "/book-appointment" : "/en/book-appointment",
      languages: { "hi-IN": "/book-appointment", "en-IN": "/en/book-appointment", "x-default": "/book-appointment" },
    },
  };
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function BookAppointmentPage({ params, searchParams }: PageProps<"/[locale]/book-appointment">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("booking.page");
  const q = await searchParams;
  const settings = await getSettings();

  return (
    <div className="pt-28 md:pt-32">
      <div className="container-page mb-10">
        <SectionTitle as="h1" align="left" eyebrow={t("eyebrow")} title={t("title")} highlight={t("highlight")} lead={t("lead")} />
      </div>
      <PricingProvider services={settings.services}>
        <BookingFunnel initialProblem={first(q.problem)} initialProfile={first(q.profile)} />
      </PricingProvider>
    </div>
  );
}
