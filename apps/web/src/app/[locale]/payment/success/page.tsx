import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UUID_RE } from "@/lib/payments/http";
import { PaymentStatusView } from "@/components/payment/PaymentStatusView";

export async function generateMetadata({ params }: PageProps<"/[locale]/payment/success">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "payment.meta" });
  return { title: t("successTitle"), robots: { index: false, follow: false } };
}

/** "Checking payment" screen: the client polls /api/payments/status (webhook is the source of truth). */
export default async function PaymentSuccessPage({ params, searchParams }: PageProps<"/[locale]/payment/success">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { appointment } = await searchParams;
  const id = typeof appointment === "string" && UUID_RE.test(appointment) ? appointment : null;
  return <PaymentStatusView appointmentId={id} />;
}
