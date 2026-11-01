import { getTranslations } from "next-intl/server";
import { formatDateIST } from "@/lib/format";
import { localePath } from "@/lib/seo";
import { Breadcrumbs } from "./PageHero";
import { JsonLd } from "./JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

type LegalKey = "privacy" | "terms" | "refund";
type RawSection = { title: string; body?: string; items?: Record<string, string>; note?: string };

// TODO(legal review): bump when the policy text changes.
export const LEGAL_UPDATED = "2026-10-31";

const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

/** Calm light-theme document layout (design.md §1.3) for privacy / terms / refund pages. */
export async function LegalPage({
  locale,
  doc,
  path,
  vars = {},
}: {
  locale: string;
  doc: LegalKey;
  path: string;
  vars?: Record<string, string | number>;
}) {
  const t = await getTranslations("pages.legal");
  const tNav = await getTranslations("nav");
  const sections = Object.entries(t.raw(`${doc}.sections`) as Record<string, RawSection>);
  const title = t(`${doc}.title`);

  return (
    <div className="bg-night-0 text-ink-2">
      <JsonLd data={breadcrumbJsonLd(locale, [{ name: tNav("home"), path: "/" }, { name: title, path }])} />
      <div className="container-page grid gap-10 py-10 md:py-16 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <nav aria-label={t("toc")} className="lg:sticky lg:top-28">
            <p className="mb-3 text-[13px] font-semibold text-ink-3">{t("toc")}</p>
            <ol className="flex flex-col gap-1 text-sm">
              {sections.map(([id, s]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="block rounded-sm py-1.5 text-ink-2 transition-colors hover:text-gold-300 focus-visible:ring-focus"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
        <article className="flex max-w-[72ch] flex-col gap-8 lg:col-span-9">
          <header className="flex flex-col gap-4 border-b border-line pb-8">
            <Breadcrumbs label={t("breadcrumbs")} items={[{ label: tNav("home"), href: "/" }, { label: title }]} />
            <h1 className="font-display text-[clamp(32px,4.2vw,52px)] leading-tight">{title}</h1>
            <p className="text-sm text-ink-3">
              {t("updated", { date: formatDateIST(LEGAL_UPDATED, locale, { day: "numeric", month: "long", year: "numeric" }) })}
            </p>
            <p className="text-[17px]">{fill(t.raw(`${doc}.intro`) as string, vars)}</p>
          </header>
          {sections.map(([id, s]) => (
            <section key={id} id={id} className="flex scroll-mt-28 flex-col gap-3">
              <h2 className="text-2xl">{s.title}</h2>
              {s.body && <p>{fill(s.body, vars)}</p>}
              {s.items && (
                <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-saffron-600">
                  {Object.entries(s.items).map(([k, v]) => (
                    <li key={k}>{fill(v, vars)}</li>
                  ))}
                </ul>
              )}
              {s.note && <p className="rounded-md border border-line bg-night-s2 p-4 text-[15px]">{fill(s.note, vars)}</p>}
            </section>
          ))}
          <p className="border-t border-line pt-6 text-sm text-ink-3">
            {t("disclaimer")}{" "}
            <a href={localePath(locale, "/contact")} className="font-semibold text-gold-300 underline-offset-[3px] hover:underline">
              {t("contactLink")}
            </a>
          </p>
        </article>
      </div>
    </div>
  );
}
