import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getService } from "@/content/catalog";
import { UUID_RE } from "@/lib/payments/http";
import { quoteFor } from "@/lib/payments/plan";
import { getServiceLookup } from "@/lib/settings";
import { Card, MerchantHeader, PaymentCheckout } from "@/components/payment/PaymentCheckout";

export async function generateMetadata({ params }: PageProps<"/[locale]/payment/[appointmentId]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "payment.meta" });
  return { title: t("title"), description: t("description"), robots: { index: false, follow: false } };
}

async function loadAppointment(id: string) {
  try {
    if (!process.env.DATABASE_URL) return { error: true as const };
    const appt = await db.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        holdExpiresAt: true,
        slotStart: true,
        slotEnd: true,
        durationMins: true,
        visitMode: true,
        service: { select: { slug: true } },
        problem: { select: { slug: true } },
        payments: { where: { installmentNo: 1 }, select: { planType: true } },
      },
    });
    // Evaluated here, outside render, so the component stays pure.
    const holdActive = !!appt?.holdExpiresAt && appt.holdExpiresAt.getTime() > Date.now();
    return { appt, holdActive };
  } catch (e) {
    console.error("[payment page] could not load appointment", e);
    return { error: true as const };
  }
}

function StateCard({ title, body, href, cta }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <Card>
      <MerchantHeader />
      <h1 className="text-2xl">{title}</h1>
      <p className="text-ink-2">{body}</p>
      {href && cta && (
        <Link
          href={href}
          className="inline-flex h-12 items-center justify-center rounded-full bg-grad-gold px-6 font-semibold text-ink-ongold focus-visible:ring-focus"
        >
          {cta}
        </Link>
      )}
    </Card>
  );
}

export default async function PaymentPage({ params }: PageProps<"/[locale]/payment/[appointmentId]">) {
  const { locale, appointmentId } = await params;
  setRequestLocale(locale);
  if (!UUID_RE.test(appointmentId)) notFound();
  await connection();

  const t = await getTranslations("payment");
  const result = await loadAppointment(appointmentId);
  if ("error" in result) return <StateCard title={t("unavailable.title")} body={t("unavailable.body")} />;
  const { appt, holdActive } = result;
  if (!appt) notFound();

  const statusHref = `/payment/success?appointment=${appt.id}`;
  if (["CONFIRMED", "PARTIALLY_PAID", "COMPLETED"].includes(appt.status)) {
    return <StateCard title={t("alreadyPaid.title")} body={t("alreadyPaid.body")} href={statusHref} cta={t("alreadyPaid.cta")} />;
  }
  const rebook = `/book-appointment?problem=${appt.problem.slug}`;
  if (appt.status === "EXPIRED" || ((appt.status === "HELD" || appt.status === "PENDING_PAYMENT") && !holdActive)) {
    return <StateCard title={t("expired.title")} body={t("expired.body")} href={rebook} cta={t("expired.cta")} />;
  }
  if (appt.status !== "HELD" && appt.status !== "PENDING_PAYMENT") {
    return <StateCard title={t("closed.title")} body={t("closed.body")} href={rebook} cta={t("closed.cta")} />;
  }

  const lookup = await getServiceLookup();
  let full;
  try {
    full = quoteFor({ serviceSlug: appt.service.slug, durationMin: appt.durationMins, planType: "FULL_UPFRONT" }, lookup);
  } catch {
    return <StateCard title={t("unavailable.title")} body={t("unavailable.body")} />;
  }
  const splitAllowed = getService(appt.service.slug)?.splitAllowed ?? false;
  const split = splitAllowed ? quoteFor({ serviceSlug: appt.service.slug, durationMin: appt.durationMins, planType: "SPLIT_PLAN" }, lookup) : null;

  return (
    <PaymentCheckout
      appointmentId={appt.id}
      holdExpiresAt={appt.holdExpiresAt!.toISOString()}
      summary={{
        problemSlug: appt.problem.slug,
        serviceSlug: appt.service.slug,
        mode: appt.visitMode,
        slotStart: appt.slotStart.toISOString(),
        slotEnd: appt.slotEnd.toISOString(),
        durationMin: appt.durationMins,
      }}
      totalInr={full.totalInr}
      splitAllowed={splitAllowed}
      advancePct={split?.advancePct ?? 100}
      advanceInr={split?.advanceInr ?? full.totalInr}
      balanceInr={split?.balanceInr ?? 0}
      initialPlan={appt.payments[0]?.planType ?? "FULL_UPFRONT"}
    />
  );
}
