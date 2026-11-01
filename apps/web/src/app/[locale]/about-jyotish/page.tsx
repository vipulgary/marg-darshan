import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Starfield } from "@/components/effects";
import { CtaBand } from "@/components/sections/CtaBand";
import { ctaClass } from "@/components/sections/cta";
import { ArrowRightIcon, CheckIcon, PlayIcon } from "@/components/sections/icons";
import { JsonLd } from "@/components/sections/JsonLd";
import { ArchPortrait } from "@/components/sections/Jyotish";
import { Breadcrumbs } from "@/components/sections/PageHero";
import { Testimonials } from "@/components/sections/Testimonials";
import { Badge } from "@/components/ui/Display";
import { pick } from "@/content/catalog";
import { JYOTISH } from "@/content/jyotish";
import { Link } from "@/i18n/navigation";
import { breadcrumbJsonLd, pageMetadata, personJsonLd, withBrand } from "@/lib/seo";
import { Icon } from "@/components/icons";

const PATH = "/about-jyotish";

export async function generateMetadata({ params }: PageProps<"/[locale]/about-jyotish">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.about" });
  return pageMetadata({ locale, path: PATH, title: withBrand(t("metaTitle")), description: t("metaDescription") });
}

/** AMX-032 — design.md §11.2. Bio content is placeholder until the client supplies it (see content/jyotish.ts). */
export default async function AboutJyotishPage({ params }: PageProps<"/[locale]/about-jyotish">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.about");
  const tNav = await getTranslations("nav");
  const tc = await getTranslations("cta");
  const name = pick(JYOTISH.name, locale);

  const index = [
    ...JYOTISH.story.map((s) => ({ id: s.id, label: pick(s.heading, locale) })),
    { id: "lineage", label: t("lineage.title") },
    { id: "credentials", label: t("credentials.title") },
    { id: "media", label: t("media.title") },
  ];

  return (
    <>
      <JsonLd
        data={[
          personJsonLd(locale),
          breadcrumbJsonLd(locale, [
            { name: tNav("home"), path: "/" },
            { name: tNav("about"), path: PATH },
          ]),
        ]}
      />
      <section className="relative isolate overflow-hidden border-b border-line-subtle">
        <Starfield className="-z-10 opacity-40" density={90} />
        <div aria-hidden className="bg-aurora pointer-events-none absolute inset-x-0 -top-32 -z-10 h-[560px] opacity-50 blur-2xl" />
        <div className="container-page grid items-center gap-10 pb-16 pt-8 md:pt-12 lg:grid-cols-12 lg:pb-24">
          <div className="flex flex-col gap-6 lg:order-2 lg:col-span-7">
            <Breadcrumbs label={t("breadcrumbs")} items={[{ label: tNav("home"), href: "/" }, { label: tNav("about") }]} />
            <p className="flex items-center gap-2 text-[13px] font-semibold text-gold-300 [:lang(en)_&]:uppercase [:lang(en)_&]:tracking-[0.16em]">
              <Icon name="sparkle" size={14} animate="draw" />
              {t("eyebrow")}
            </p>
            <h1 className="font-display text-[clamp(40px,5.6vw,72px)] leading-[1.15]">
              <span className="text-gradient">{name}</span>
            </h1>
            <p className="text-xl font-semibold text-gold-200">{pick(JYOTISH.role, locale)}</p>
            <p className="max-w-[60ch] text-[19px] leading-relaxed text-ink-2">{pick(JYOTISH.tagline, locale)}</p>
            <ul className="flex flex-wrap gap-2" aria-label={t("chipsLabel")}>
              {JYOTISH.chips.map((c) => (
                <li key={c.en}>
                  <Badge tone="gold">{pick(c, locale)}</Badge>
                </li>
              ))}
              <li>
                <Badge tone="violet">{t("languages", { languages: pick(JYOTISH.languages, locale) })}</Badge>
              </li>
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/book-appointment" className={ctaClass("primary", "lg")}>
                {tc("book")}
                <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link href="/free-kundali" className={ctaClass("secondary", "lg")}>
                {tc("kundali")}
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:order-1 lg:col-span-5">
            <ArchPortrait locale={locale} label={t("portraitLabel", { name })} className="max-w-[400px]" />
          </div>
        </div>
      </section>

      <div className="container-page grid gap-12 py-14 md:py-[72px] lg:grid-cols-12 lg:py-24">
        <aside className="hidden lg:col-span-3 lg:block">
          <nav aria-label={t("index")} className="sticky top-28">
            <p className="mb-3 text-[13px] font-semibold text-ink-3">{t("index")}</p>
            <ol className="flex flex-col gap-1 border-l border-line">
              {index.map((i) => (
                <li key={i.id}>
                  <a
                    href={`#${i.id}`}
                    className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm text-ink-2 transition-colors hover:border-saffron-400 hover:text-ink-1 focus-visible:ring-focus"
                  >
                    {i.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="flex flex-col gap-16 lg:col-span-9">
          {JYOTISH.story.map((s) => (
            <section key={s.id} id={s.id} className="flex scroll-mt-28 flex-col gap-4">
              <h2 className="font-display text-[clamp(26px,3.2vw,36px)]">{pick(s.heading, locale)}</h2>
              {s.paragraphs.map((p, i) => (
                <p key={i} className="max-w-[68ch] text-ink-2">
                  {pick(p, locale)}
                </p>
              ))}
            </section>
          ))}

          <section id="lineage" className="flex scroll-mt-28 flex-col gap-8">
            <h2 className="font-display text-[clamp(26px,3.2vw,36px)]">{t("lineage.title")}</h2>
            <ol className="relative flex flex-col gap-8 border-l-2 border-gold-300/40 pl-8">
              {JYOTISH.lineage.map((l) => (
                <li key={l.title.en} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[41px] top-1.5 h-4 w-4 rounded-full border-2 border-night-0 bg-grad-gold shadow-glow-gold"
                  />
                  <p className="text-[13px] font-semibold text-gold-300">{pick(l.period, locale)}</p>
                  <h3 className="text-xl">{pick(l.title, locale)}</h3>
                  <p className="mt-1 text-[15px] text-ink-2">{pick(l.detail, locale)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="credentials" className="flex scroll-mt-28 flex-col gap-8">
            <h2 className="font-display text-[clamp(26px,3.2vw,36px)]">{t("credentials.title")}</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {JYOTISH.credentials.map((c) => (
                <li key={c.title.en} className="flex gap-4 rounded-lg border border-line bg-night-s1 p-5 shadow-e1">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-saffron-500/14 text-gold-300">
                    <CheckIcon />
                  </span>
                  <div>
                    <h3 className="text-lg">{pick(c.title, locale)}</h3>
                    <p className="text-[15px] text-ink-2">{pick(c.detail, locale)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section id="media" className="flex scroll-mt-28 flex-col gap-6">
            <h2 className="font-display text-[clamp(26px,3.2vw,36px)]">{t("media.title")}</h2>
            {JYOTISH.videoId ? (
              <iframe
                className="aspect-video w-full rounded-xl border border-line"
                src={`https://www.youtube-nocookie.com/embed/${JYOTISH.videoId}`}
                title={t("media.videoTitle", { name })}
                loading="lazy"
                allow="accelerometer; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="grid aspect-video w-full place-items-center rounded-xl border border-line bg-[linear-gradient(160deg,#4c1d95_0%,#15112a_70%)] text-center">
                <div className="flex flex-col items-center gap-3 px-6">
                  <PlayIcon className="h-14 w-14 text-gold-300" />
                  <p className="text-lg font-semibold text-ink-1">{t("media.soon")}</p>
                  <p className="text-sm text-ink-3">{t("media.soonHint")}</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="relative isolate overflow-hidden border-y border-line-subtle bg-night-1 py-16 md:py-24">
        <div aria-hidden className="bg-aurora pointer-events-none absolute inset-0 -z-10 opacity-40" />
        <figure className="container-page mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <span aria-hidden className="font-display text-6xl leading-none text-gold-300">
            “
          </span>
          <blockquote className="font-display text-[clamp(24px,3vw,34px)] italic leading-snug text-ink-1">
            {pick(JYOTISH.philosophy, locale)}
          </blockquote>
          <figcaption className="text-gold-300">— {name}</figcaption>
        </figure>
      </section>

      <Testimonials locale={locale} />

      <CtaBand
        title={t("cta.title")}
        highlight={t("cta.highlight")}
        lead={t("cta.lead")}
        primary={{ label: tc("book"), href: "/book-appointment" }}
        secondary={{ label: tc("kundali"), href: "/free-kundali" }}
      />
    </>
  );
}
