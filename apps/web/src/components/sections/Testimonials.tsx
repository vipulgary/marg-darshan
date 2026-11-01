import { getTranslations } from "next-intl/server";
import { Marquee } from "@/components/effects";
import { Badge, SectionTitle } from "@/components/ui/Display";
import { getProblem, pick } from "@/content/catalog";
import { TESTIMONIALS, type Testimonial } from "@/content/testimonials";
import { StarIcon } from "./icons";

function TestimonialCard({ item, locale, ratingLabel }: { item: Testimonial; locale: string; ratingLabel: string }) {
  const problem = getProblem(item.problemSlug);
  const name = pick(item.name, locale);
  return (
    <figure className="flex h-full w-[290px] shrink-0 flex-col gap-4 rounded-lg border border-line bg-night-s1 p-6 shadow-e1 sm:w-[340px]">
      <div className="flex items-center justify-between">
        <span aria-hidden className="font-display text-5xl leading-none text-gold-300">
          “
        </span>
        <span className="flex gap-0.5 text-saffron-400" role="img" aria-label={ratingLabel}>
          {Array.from({ length: item.rating }, (_, i) => (
            <StarIcon key={i} />
          ))}
        </span>
      </div>
      <blockquote className="flex-1 text-[15px] leading-relaxed text-ink-2">{pick(item.text, locale)}</blockquote>
      <figcaption className="flex items-center gap-3 border-t border-line-subtle pt-4">
        <span
          aria-hidden
          className="grid h-10 w-10 place-items-center rounded-full bg-grad-primary font-semibold text-white"
        >
          {name.slice(0, 1)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold text-ink-1">{name}</span>
          <span className="text-[13px] text-ink-3">{pick(item.city, locale)}</span>
        </span>
        {problem && <Badge tone="violet" className="max-w-[45%] truncate">{pick(problem.title, locale)}</Badge>}
      </figcaption>
    </figure>
  );
}

/** design.md §11.1 #10 — two marquee rows moving in opposite directions. */
export async function Testimonials({ locale }: { locale: string }) {
  const t = await getTranslations("pages.shared.testimonials");
  const half = Math.ceil(TESTIMONIALS.length / 2);
  const rows = [TESTIMONIALS.slice(0, half), TESTIMONIALS.slice(half)];

  return (
    <section className="overflow-hidden py-14 md:py-[72px] lg:py-28">
      <div className="container-page mb-10 md:mb-14">
        <SectionTitle eyebrow={t("eyebrow")} title={t("title")} highlight={t("highlight")} lead={t("lead")} />
      </div>
      <div className="flex flex-col gap-5 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        {rows.map((row, i) => (
          <Marquee key={i} reverse={i === 1} speed={i === 1 ? 50 : 45}>
            {row.map((item) => (
              <TestimonialCard
                key={item.id}
                item={item}
                locale={locale}
                ratingLabel={t("rating", { rating: item.rating })}
              />
            ))}
          </Marquee>
        ))}
      </div>
    </section>
  );
}
