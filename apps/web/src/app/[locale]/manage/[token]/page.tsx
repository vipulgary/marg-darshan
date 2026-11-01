import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProblem, getService, pick } from "@/content/catalog";
import { ManageBooking, type ManageBookingProps } from "@/components/manage/ManageBooking";
import { manageSecret, readManageToken } from "@/lib/manage/links";
import { manageOptions } from "@/lib/manage/policy";
import { getSettings } from "@/lib/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export async function generateMetadata({ params }: PageProps<"/[locale]/manage/[token]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "manage.meta" });
  return { title: t("title"), description: t("description"), robots: { index: false, follow: false } };
}

type Loaded = { state: "unavailable" | "invalid" } | { state: "ok"; props: Omit<ManageBookingProps, "token" | "whatsappUrl"> };

async function load(token: string, locale: string): Promise<Loaded> {
  const secret = manageSecret();
  if (!secret || !process.env.DATABASE_URL) return { state: "unavailable" };
  const id = readManageToken(token, secret);
  if (!id) return { state: "invalid" };
  try {
    const { db } = await import("@/lib/db");
    const appt = await db.appointment.findUnique({
      where: { id },
      select: {
        status: true,
        slotStart: true,
        slotEnd: true,
        durationMins: true,
        visitMode: true,
        service: { select: { slug: true, titleHi: true, titleEn: true } },
        problem: { select: { slug: true, titleHi: true, titleEn: true } },
      },
    });
    if (!appt) return { state: "invalid" };
    const service = getService(appt.service.slug);
    const problem = getProblem(appt.problem.slug);
    return {
      state: "ok",
      props: {
        serviceSlug: appt.service.slug,
        serviceTitle: service ? pick(service.title, locale) : locale === "en" ? appt.service.titleEn : appt.service.titleHi,
        problemTitle: problem ? pick(problem.title, locale) : locale === "en" ? appt.problem.titleEn : appt.problem.titleHi,
        mode: appt.visitMode,
        durationMin: appt.durationMins,
        slotStart: appt.slotStart.toISOString(),
        slotEnd: appt.slotEnd.toISOString(),
        options: manageOptions(appt.slotStart, new Date(), appt.status, (await getSettings()).cancellationHours),
      },
    };
  } catch (e) {
    console.error("[manage page] could not load appointment", e);
    return { state: "unavailable" };
  }
}

export default async function ManagePage({ params }: PageProps<"/[locale]/manage/[token]">) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  await connection();
  const t = await getTranslations("manage");
  const result = await load(decodeURIComponent(token), locale);
  const whatsappUrl = buildWhatsAppUrl({ number: (await getSettings()).whatsappNumber, message: t("whatsappMessage") });

  return (
    <div className="min-h-full bg-night-0 px-4 py-10 text-ink-2 sm:py-16">
      <div className="mx-auto w-full max-w-[560px]">
        {result.state === "ok" ? (
          <ManageBooking {...result.props} token={decodeURIComponent(token)} whatsappUrl={whatsappUrl} />
        ) : (
          <div className="flex flex-col gap-4 rounded-xl border border-line bg-night-1 p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl text-ink-1">{t(`${result.state}.title`)}</h1>
            <p>{t(`${result.state}.body`)}</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#25D366] px-6 font-semibold text-[#052e16] focus-visible:ring-focus"
            >
              {t("whatsappCta")}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
