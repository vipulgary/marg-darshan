import Form from "next/form";
import { getTranslations } from "next-intl/server";
import { AuroraBackground, CountUp, Marquee, PlasmaHero, SpotlightCard, Starfield, ZodiacWheel } from "@/components/effects";
import { SectionTitle } from "@/components/ui/Display";
import { controlClass } from "@/components/ui/Field";
import { PROBLEMS, SERVICES, getProblem, pick } from "@/content/catalog";
import { JYOTISH } from "@/content/jyotish";
import { Link, getPathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import { ctaClass, textLinkClass } from "./cta";
import { Icon } from "@/components/icons";
import { ArrowRightIcon, CompassIcon, GemIcon, HourglassIcon, StarIcon, SunIcon, VideoIcon } from "./icons";
import { bookHref } from "./links";

/** Glass "Quick Kundali" — a plain GET form, so it works without JS and lands on /free-kundali prefilled. */
async function QuickKundaliForm({ locale }: { locale: string }) {
  const t = await getTranslations("home.quick");
  const action = getPathname({ href: "/free-kundali", locale });
  const fields = [
    { name: "name", type: "text", autoComplete: "name", placeholder: t("namePlaceholder") },
    { name: "dob", type: "date", autoComplete: "bday" },
    { name: "tob", type: "time" },
    { name: "place", type: "text", autoComplete: "off", placeholder: t("placePlaceholder") },
  ] as const;
  return (
    <Form
      action={action}
      aria-labelledby="quick-kundali-title"
      className="relative flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[.04] p-6 shadow-e3 backdrop-blur-[20px] md:p-7"
    >
      <div className="flex flex-col gap-1">
        <h2 id="quick-kundali-title" className="text-xl">
          {t("title")}
        </h2>
        <p className="text-sm text-ink-3">{t("lead")}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.name} className={cn("flex flex-col gap-1.5", (f.name === "name" || f.name === "place") && "col-span-2")}>
            <label htmlFor={`qk-${f.name}`} className="text-[13px] font-medium text-ink-2">
              {t(f.name)}
            </label>
            <input
              id={`qk-${f.name}`}
              name={f.name}
              type={f.type}
              autoComplete={"autoComplete" in f ? f.autoComplete : undefined}
              placeholder={"placeholder" in f ? f.placeholder : undefined}
              className={cn(controlClass, "h-12 bg-night-s2/80 text-[15px] [color-scheme:dark]")}
            />
          </div>
        ))}
      </div>
      <button type="submit" className={ctaClass("primary", "md", "mt-1 w-full")}>
        {t("submit")}
        <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-1" />
      </button>
    </Form>
  );
}

/** Home hero (design.md §11.1 #1): plasma + starfield, title left, zodiac wheel + quick form right. */
export async function HomeHero({ locale }: { locale: string }) {
  const t = await getTranslations("home");
  const tc = await getTranslations("cta");
  return (
    <PlasmaHero className="min-h-[min(100svh,860px)]">
      <Starfield className="opacity-95" density={170} />
      <div className="container-page relative grid items-center gap-12 pb-20 pt-10 md:pt-16 lg:grid-cols-12 lg:pb-28 lg:pt-20">
        <div className="flex flex-col gap-7 lg:col-span-7">
          <p className="flex items-center gap-2 text-sm font-semibold text-gold-300 [:lang(en)_&]:text-[13px] [:lang(en)_&]:uppercase [:lang(en)_&]:tracking-[0.16em]">
            <Icon name="sparkle" size={16} animate="draw" />
            {t("eyebrow")}
          </p>
          <h1 className="font-display text-[clamp(40px,5.6vw,72px)] leading-[1.22] [:lang(en)_&]:text-[clamp(44px,6.2vw,80px)] [:lang(en)_&]:leading-[1.04] [:lang(en)_&]:tracking-[-0.025em]">
            {t("titleStart")} <span className="text-gradient">{t("titleHighlight")}</span>
          </h1>
          <p className="max-w-[56ch] text-[19px] leading-relaxed text-ink-2 [:lang(hi)_&]:text-xl">{t("lead")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/book-appointment" className={ctaClass("primary", "lg")}>
              {tc("book")}
              <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link href="/free-kundali" className={ctaClass("secondary", "lg")}>
              {tc("kundali")}
            </Link>
          </div>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px] text-ink-2" aria-label={t("hero.trustLabel")}>
            <li className="flex items-center gap-1.5">
              <StarIcon className="text-saffron-400" />
              <span className="font-semibold text-ink-1 tabular-nums">{JYOTISH.stats.rating}</span> {t("hero.rating")}
            </li>
            <li aria-hidden className="hidden h-4 w-px bg-line sm:block" />
            <li>
              <span className="font-semibold text-ink-1">
                <CountUp to={JYOTISH.stats.consultations} suffix="+" />
              </span>{" "}
              {t("hero.consultations")}
            </li>
            <li aria-hidden className="hidden h-4 w-px bg-line sm:block" />
            <li>
              <span className="font-semibold text-ink-1">
                <CountUp to={JYOTISH.stats.years} suffix="+" />
              </span>{" "}
              {t("hero.years")}
            </li>
          </ul>
        </div>
        <div className="relative lg:col-span-5">
          <div aria-hidden className="absolute inset-0 -z-0 hidden place-items-center lg:grid">
            <ZodiacWheel size={520} className="opacity-60" />
          </div>
          <div className="relative mx-auto max-w-md lg:mt-10">
            <QuickKundaliForm locale={locale} />
          </div>
        </div>
      </div>
    </PlasmaHero>
  );
}

export async function TrustMarquee() {
  const t = await getTranslations("home.trust");
  const items = ["i1", "i2", "i3", "i4", "i5", "i6", "i7", "i8"] as const;
  return (
    <section aria-label={t("label")} className="border-y border-line-subtle bg-night-1 py-5">
      <Marquee speed={50} className="[--amx-gap:2.5rem]">
        {items.map((k) => (
          <span key={k} className="flex items-center gap-3 whitespace-nowrap text-[15px] font-medium text-ink-2">
            <Icon name="sparkle" size={14} className="text-gold-300" />
            {t(k)}
          </span>
        ))}
      </Marquee>
    </section>
  );
}

const HOME_PROBLEMS = ["career", "marriage", "health", "finance", "santaan", "vastu-residential", "gemstone", "birth-time-unknown"];

/** design.md §11.1 #3 + §5.6 — each card deep-links into booking with the problem preselected. */
export async function ProblemGrid({ locale, slugs = HOME_PROBLEMS }: { locale: string; slugs?: string[] }) {
  const t = await getTranslations("home.problems");
  const other = locale === "en" ? "hi" : "en";
  const problems = slugs.map((s) => getProblem(s)).filter((p) => p !== undefined);
  return (
    <div className="flex flex-col gap-10">
      <SectionTitle eyebrow={t("eyebrow")} title={t("title")} highlight={t("highlight")} lead={t("lead")} />
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {problems.map((p) => (
          <li key={p.slug}>
            <SpotlightCard className="h-full focus-within:ring-focus">
              <Link
                href={bookHref(p.slug)}
                className="flex h-full min-h-[148px] flex-col gap-3 p-5 outline-none after:absolute after:inset-0"
              >
                <Icon
                  name={p.icon}
                  size={40}
                  animate="draw"
                  className="text-gold-300 transition-[filter] duration-300 group-hover/spot:drop-shadow-[0_0_10px_rgba(252,217,138,.4)]"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[17px] font-semibold leading-snug text-ink-1">{pick(p.title, locale)}</span>
                  <span lang={other} className="text-[13px] text-ink-3">
                    {pick(p.title, other)}
                  </span>
                </span>
              </Link>
            </SpotlightCard>
          </li>
        ))}
      </ul>
      <p className="text-center">
        <Link href="/book-appointment" className={textLinkClass}>
          {t("all", { count: PROBLEMS.length })} <Icon name="arrow-right" size={16} className="inline-block align-[-3px]" />
        </Link>
      </p>
    </div>
  );
}

/** design.md §7.2 bento — Free Kundali is the 2×2 key tile with aurora + zodiac wheel. */
export async function ServicesBento({ locale }: { locale: string }) {
  const t = await getTranslations("home.bento");
  const tc = await getTranslations("cta");
  const icons = { astrology: SunIcon, vastu: CompassIcon, gems: GemIcon } as const;
  const tile = "relative flex h-full flex-col gap-3 rounded-xl p-6 md:p-7";
  const fromPrice = (slug: string) => {
    const s = SERVICES.find((x) => x.slug === slug);
    return s ? Math.min(...Object.values(s.prices)) : 0;
  };

  return (
    <div className="flex flex-col gap-10">
      <SectionTitle eyebrow={t("eyebrow")} title={t("title")} highlight={t("highlight")} lead={t("lead")} />
      <ul className="grid gap-4 md:grid-cols-6 lg:grid-cols-12">
        <li className="md:col-span-6 lg:row-span-2">
          <div className={cn(tile, "isolate min-h-[340px] overflow-hidden border border-line-gold shadow-glow-violet")}>
            <AuroraBackground intensity="strong" />
            <div aria-hidden className="absolute -bottom-24 -right-24 -z-0 opacity-70">
              <ZodiacWheel size={380} />
            </div>
            <div className="relative flex h-full flex-col gap-4">
              <span className="w-fit rounded-sm bg-white/10 px-2.5 py-1 text-xs font-semibold text-gold-200 backdrop-blur">
                {t("kundali.badge")}
              </span>
              <h3 className="max-w-[16ch] font-display text-[clamp(28px,3vw,38px)] leading-tight">{t("kundali.title")}</h3>
              <p className="max-w-[40ch] text-ink-2">{t("kundali.body")}</p>
              <Link href="/free-kundali" className={ctaClass("primary", "md", "mt-auto self-start")}>
                {tc("kundali")}
                <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </li>
        {(["astrology", "vastu", "gems"] as const).map((slug) => {
          const s = SERVICES.find((x) => x.slug === slug)!;
          const ServiceIcon = icons[slug];
          return (
            <li key={slug} className="md:col-span-3">
              <SpotlightCard className="h-full rounded-xl focus-within:ring-focus">
                <div className={tile}>
                  <ServiceIcon className="h-8 w-8 text-gold-300" animate="draw" />
                  <h3 className="text-xl">
                    <Link href={`/services/${slug}`} className="outline-none after:absolute after:inset-0">
                      {pick(s.title, locale)}
                    </Link>
                  </h3>
                  <p className="line-clamp-2 text-[15px] text-ink-2">{pick(s.summary, locale)}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <span className="rounded-sm bg-saffron-500/14 px-2.5 py-1 text-xs font-semibold text-gold-300">
                      {t("from", { price: formatINR(fromPrice(slug), locale) })}
                    </span>
                    <span aria-hidden className="inline-flex items-center gap-1 text-sm font-semibold text-violet-300">
                      {t("more")} <Icon name="arrow-right" size={16} className="transition-transform duration-200 group-hover/spot:translate-x-1" />
                    </span>
                  </div>
                </div>
              </SpotlightCard>
            </li>
          );
        })}
        <li className="md:col-span-3">
          <div className={cn(tile, "border border-line bg-night-s1 shadow-e1")}>
            <VideoIcon className="h-8 w-8 text-gold-300" animate="draw" />
            <h3 className="text-xl">{t("modes.title")}</h3>
            <p className="text-[15px] text-ink-2">{t("modes.body")}</p>
          </div>
        </li>
        <li className="md:col-span-3">
          <div className={cn(tile, "justify-center border border-line bg-night-s1 shadow-e1")}>
            <p className="font-display text-5xl text-gradient">
              <CountUp to={JYOTISH.stats.years} suffix="+" />
            </p>
            <p className="text-ink-2">{t("stats.years")}</p>
          </div>
        </li>
        <li className="md:col-span-3">
          <div className={cn(tile, "justify-center border border-line bg-night-s1 shadow-e1")}>
            <p className="font-display text-5xl text-gradient">
              <CountUp to={JYOTISH.stats.consultations} suffix="+" />
            </p>
            <p className="text-ink-2">{t("stats.clients")}</p>
          </div>
        </li>
        <li className="md:col-span-6">
          <SpotlightCard className="h-full rounded-xl focus-within:ring-focus">
            <div className={cn(tile, "bg-[linear-gradient(160deg,rgba(76,29,149,.45),transparent_70%)] [.light_&]:bg-[linear-gradient(160deg,rgba(235,151,131,.32),transparent_70%)] sm:flex-row sm:items-center sm:gap-6")}>
              <HourglassIcon className="h-10 w-10 text-gold-300" animate="draw" />
              <div className="flex flex-1 flex-col gap-1.5">
                <h3 className="text-xl">
                  <Link href="/birth-time-finder" className="outline-none after:absolute after:inset-0">
                    {t("birthTime.title")}
                  </Link>
                </h3>
                <p className="text-[15px] text-ink-2">{t("birthTime.body")}</p>
              </div>
              <ArrowRightIcon className="hidden h-6 w-6 text-violet-300 sm:block" />
            </div>
          </SpotlightCard>
        </li>
      </ul>
    </div>
  );
}
