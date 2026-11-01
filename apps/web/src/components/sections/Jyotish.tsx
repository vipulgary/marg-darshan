import { existsSync } from "node:fs";
import { join } from "node:path";
import { getTranslations } from "next-intl/server";
import { Badge, SectionTitle } from "@/components/ui/Display";
import { pick } from "@/content/catalog";
import { JYOTISH } from "@/content/jyotish";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { textLinkClass } from "./cta";
import { Icon } from "@/components/icons";

/** Line-art Acharya: seated in meditation, tilak, shikha, rudraksha mala, with a halo and diya. */
function AcharyaArt({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 200 220" className={cn("[.light_&]:text-[#9c3a26]", className)} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="100" cy="62" r="44" strokeWidth="1.2" strokeDasharray="2 5" opacity=".7" />
      <circle cx="100" cy="62" r="34" strokeWidth="1" opacity=".45" />
      {/* head, shikha, tilak, closed eyes, beard */}
      <path d="M100 30c-14 0-23 11-23 25 0 9 3 17 9 22 4 4 9 6 14 6s10-2 14-6c6-5 9-13 9-22 0-14-9-25-23-25Z" />
      <path d="M100 30c2-6 7-9 12-8" />
      <path d="M100 42v8M96 46h8" strokeWidth="1.6" />
      <path d="M88 58q4 3 8 0M104 58q4 3 8 0" strokeWidth="1.6" />
      <path d="M86 70c3 14 9 22 14 24 5-2 11-10 14-24" />
      {/* shoulders, shawl, folded hands */}
      <path d="M100 94c-26 0-44 14-50 40l-6 34M100 94c26 0 44 14 50 40l6 34" />
      <path d="M70 104c10 22 20 34 30 40 10-6 20-18 30-40" />
      <path d="M93 128l7-16 7 16-7 10Z" />
      {/* mala */}
      <path d="M80 100c4 26 12 40 20 44 8-4 16-18 20-44" strokeDasharray="0.5 6" strokeWidth="3.2" />
      {/* crossed legs */}
      <path d="M40 176c20-10 40-12 60-6 20-6 40-4 60 6M44 168c-6 8-4 16 8 18h96c12-2 14-10 8-18" />
      {/* diya */}
      <path d="M86 204h28M90 198c4 6 16 6 20 0H90Z" />
      <path d="M100 190c-3 3-3 6 0 8 3-2 3-5 0-8Z" />
    </svg>
  );
}

/** Licensed Acharya artwork dropped into public/ replaces the line-art automatically. */
const PORTRAIT_SRC = ["/brand/acharya.webp", "/brand/acharya.png"].find((f) => existsSync(join(process.cwd(), "public", f)));

/** Temple-arch portrait frame (design.md §10). No photo supplied yet → gradient arch with initials. */
export function ArchPortrait({ locale, label, className }: { locale: string; label: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative aspect-[4/5] w-full max-w-[360px] rounded-[200px_200px_20px_20px] bg-grad-primary p-[1.5px] shadow-glow-violet",
        className,
      )}
    >
      <div className="relative grid h-full w-full place-items-center overflow-hidden rounded-[199px_199px_19px_19px] bg-[radial-gradient(120%_80%_at_50%_0%,#4c1d95_0%,#15112a_55%,#07060f_100%)] [.light_&]:bg-[radial-gradient(120%_80%_at_50%_0%,#fde3cf_0%,#f6c9ae_55%,#e9a587_100%)] [.light_&]:text-saffron-600">
        <svg aria-hidden viewBox="0 0 200 200" className="absolute inset-0 m-auto h-[85%] w-[85%] text-gold-300 opacity-[0.12]">
          <g fill="none" stroke="currentColor" strokeWidth="0.8">
            <circle cx="100" cy="100" r="90" />
            <circle cx="100" cy="100" r="64" />
            <circle cx="100" cy="100" r="38" />
            <path d="M100 10 178 145H22Z" />
            <path d="M100 190 22 55h156Z" />
            <path d="M10 100h180M100 10v180" />
          </g>
        </svg>
{PORTRAIT_SRC ? (
          // eslint-disable-next-line @next/next/no-img-element -- static artwork, sized by the frame
          <img src={PORTRAIT_SRC} alt="" className="relative h-[92%] w-[92%] self-end object-contain object-bottom" />
        ) : (
          <AcharyaArt className="relative h-[78%] w-[78%] text-gold-300" />
        )}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,rgba(7,6,15,.7))] [.light_&]:hidden" />
      </div>
    </div>
  );
}

/** Home §11.1 #5 — arch portrait left; quote, short bio, credentials chips and a link right. */
export async function MeetJyotish({ locale }: { locale: string }) {
  const t = await getTranslations("home.jyotish");
  return (
    <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="flex justify-center lg:col-span-5">
        <ArchPortrait locale={locale} label={t("portraitLabel", { name: pick(JYOTISH.name, locale) })} />
      </div>
      <div className="flex flex-col gap-6 lg:col-span-7">
        <SectionTitle align="left" eyebrow={t("eyebrow")} title={t("title")} highlight={pick(JYOTISH.name, locale)} />
        <p className="text-[15px] font-semibold text-gold-200">{pick(JYOTISH.role, locale)}</p>
        <blockquote className="border-l-2 border-saffron-400 pl-5 font-display text-2xl italic leading-snug text-ink-1">
          {pick(JYOTISH.quote, locale)}
        </blockquote>
        <p className="max-w-[68ch] text-ink-2">{pick(JYOTISH.shortBio, locale)}</p>
        <ul className="flex flex-wrap gap-2" aria-label={t("chipsLabel")}>
          {JYOTISH.chips.map((c) => (
            <li key={c.en}>
              <Badge tone="gold">{pick(c, locale)}</Badge>
            </li>
          ))}
        </ul>
        <Link href="/about-jyotish" className={cn(textLinkClass, "self-start")}>
          {t("more")} <Icon name="arrow-right" size={16} className="inline-block align-[-3px]" />
        </Link>
      </div>
    </div>
  );
}
