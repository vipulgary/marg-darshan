import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuroraBackground, Reveal } from "@/components/effects";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { TodayPanchang } from "@/components/panchang/TodayPanchang";
import { SectionTitle } from "@/components/ui/Display";
import { pageMetadata, withBrand } from "@/lib/seo";
import { Icon } from "@/components/icons";

export async function generateMetadata({ params }: PageProps<"/[locale]/newsletter">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsletter.meta" });
  return pageMetadata({ locale, path: "/newsletter", title: withBrand(t("title")), description: t("description") });
}

const BENEFITS = [
  { key: "panchang", icon: "calendar" },
  { key: "festivals", icon: "diya" },
  { key: "muhurta", icon: "hourglass" },
] as const;

export default async function NewsletterPage({ params, searchParams }: PageProps<"/[locale]/newsletter">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const confirmed = (await searchParams).confirmed;
  const t = await getTranslations("newsletter.page");

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <AuroraBackground intensity="soft" className="-z-10" />
        <div className="container-page grid items-center gap-10 py-14 md:py-24 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <SectionTitle as="h1" align="left" eyebrow={t("eyebrow")} title={t("title")} highlight={t("highlight")} lead={t("lead")} />
            <ul className="flex flex-wrap gap-2 text-sm text-ink-2">
              <li className="inline-flex items-center gap-1.5 rounded-full border border-line bg-night-s1/60 px-3.5 py-1.5"><Icon name="sparkle" size={14} className="text-gold-300" animate="draw" /> {t("free")}</li>
              <li className="inline-flex items-center gap-1.5 rounded-full border border-line bg-night-s1/60 px-3.5 py-1.5"><Icon name="sparkle" size={14} className="text-gold-300" animate="draw" /> {t("weekly")}</li>
            </ul>
          </div>
          <div id="subscribe" className="flex flex-col gap-4">
            {(confirmed === "1" || confirmed === "0") && (
              <div
                role="status"
                className={
                  confirmed === "1"
                    ? "rounded-lg border border-success/40 bg-success/12 p-4"
                    : "rounded-lg border border-warning/40 bg-warning/12 p-4"
                }
              >
                <p className="font-semibold text-ink-1">{confirmed === "1" ? t("confirmedTitle") : t("invalidTitle")}</p>
                <p className="text-sm text-ink-2">{confirmed === "1" ? t("confirmedBody") : t("invalidBody")}</p>
              </div>
            )}
            <NewsletterSignup variant="page" />
            <TodayPanchang />
          </div>
        </div>
      </section>

      <section className="container-page py-14 md:py-24">
        <SectionTitle eyebrow={t("benefitsEyebrow")} title={t("benefitsTitle")} highlight={t("benefitsHighlight")} />
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <li key={b.key}>
              <Reveal delay={i * 0.07} className="h-full">
                <div className="h-full rounded-lg border border-line bg-night-s1 p-6 shadow-e1">
                  <Icon name={b.icon} size={36} animate="draw" className="text-gold-300" />
                  <h3 className="mt-3 text-xl">{t(`${b.key}Title`)}</h3>
                  <p className="mt-2 text-ink-2">{t(`${b.key}Body`)}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page pb-16 md:pb-28">
        <SectionTitle align="left" eyebrow={t("archiveEyebrow")} title={t("archiveTitle")} highlight={t("archiveHighlight")} />
        {/* TODO(AMX-121): list approved Listmonk campaigns here once the weekly panchang job exists. */}
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-night-s1/60 px-6 py-14 text-center">
          <svg aria-hidden viewBox="0 0 120 60" className="h-14 w-28 text-gold-300/60">
            <path d="M8 40 L32 18 L58 32 L84 12 L112 36" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
            {[8, 32, 58, 84, 112].map((x, i) => (
              <circle key={x} cx={x} cy={[40, 18, 32, 12, 36][i]} r="2.5" fill="currentColor" />
            ))}
          </svg>
          <h3 className="text-xl">{t("archiveEmptyTitle")}</h3>
          <p className="max-w-[52ch] text-ink-2">{t("archiveEmptyBody")}</p>
          <a href="#subscribe" className="mt-2 inline-flex h-11 items-center rounded-full border border-line-gold px-6 font-semibold text-gold-300 hover:bg-gold-300/8 focus-visible:ring-focus">
            {t("archiveCta")}
          </a>
        </div>
      </section>
    </>
  );
}
