import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/components/ui/Display";
import { Link } from "@/i18n/navigation";
import { CheckIcon, MapPinIcon, VideoIcon } from "./icons";
import { bookHref } from "./links";
import { textLinkClass } from "./cta";
import { Icon } from "@/components/icons";

/** design.md §11.1 #7 — two cards side by side: Online (Zoom) vs Personal visit. */
export async function OnlineVsVisit({ problem, withTitle = true }: { problem?: string; withTitle?: boolean }) {
  const t = await getTranslations("pages.shared.modes");
  const cards = [
    { key: "online", Icon: VideoIcon },
    { key: "visit", Icon: MapPinIcon },
  ] as const;

  return (
    <div className="flex flex-col gap-10">
      {withTitle && <SectionTitle eyebrow={t("eyebrow")} title={t("title")} highlight={t("highlight")} lead={t("lead")} />}
      <div className="grid gap-6 md:grid-cols-2">
        {cards.map(({ key, Icon: CardIcon }) => (
          <article
            key={key}
            className="relative flex flex-col gap-5 overflow-hidden rounded-xl border border-line bg-night-s1 p-6 shadow-e1 md:p-8"
          >
            <div
              aria-hidden
              className={
                key === "online"
                  ? "pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl"
                  : "pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-saffron-500/15 blur-3xl"
              }
            />
            <span className="grid h-12 w-12 place-items-center rounded-md bg-saffron-500/14 text-gold-300">
              <CardIcon className="h-6 w-6" animate="draw" />
            </span>
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl">{t(`${key}.title`)}</h3>
              <p className="text-ink-2">{t(`${key}.body`)}</p>
            </div>
            <ul className="flex flex-col gap-2.5">
              {(["p1", "p2", "p3"] as const).map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[15px]">
                  <CheckIcon className="mt-0.5 h-[18px] w-[18px] text-gold-300" />
                  {t(`${key}.${p}`)}
                </li>
              ))}
            </ul>
            <Link href={bookHref(problem)} className={`${textLinkClass} mt-auto self-start`}>
              {t("cta")} <Icon name="arrow-right" size={16} className="inline-block align-[-3px]" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
