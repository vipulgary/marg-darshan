import type { ReactNode } from "react";
import { AuroraBackground, Reveal } from "@/components/effects";
import { Link } from "@/i18n/navigation";
import { ctaClass } from "./cta";
import { ArrowRightIcon } from "./icons";
import { Icon } from "@/components/icons";

/** Full-width aurora CTA band (design.md §9.1 — CTA bands may use the moving aurora). */
export function CtaBand({
  eyebrow,
  title,
  highlight,
  lead,
  primary,
  secondary,
  icon,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  lead?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string; external?: boolean; whatsapp?: boolean };
  icon?: ReactNode;
}) {
  return (
    <section className="py-14 md:py-[72px] lg:py-24">
      <div className="container-page">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-xl border border-line px-6 py-12 text-center shadow-e2 md:px-12 md:py-16">
            <AuroraBackground className="absolute inset-0 -z-10" intensity="strong" />
            <div aria-hidden className="absolute inset-0 -z-10 bg-night-0/35" />
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
              {icon && <span className="grid h-14 w-14 place-items-center rounded-full bg-white/8 text-gold-300 backdrop-blur">{icon}</span>}
              {eyebrow && (
                <p className="flex items-center gap-2 text-[13px] font-semibold text-gold-300 [:lang(en)_&]:uppercase [:lang(en)_&]:tracking-[0.16em]">
                  <Icon name="sparkle" size={14} animate="draw" />
                  {eyebrow}
                </p>
              )}
              <h2 className="font-display text-[clamp(26px,3.2vw,40px)] leading-[1.2]">
                {title} {highlight && <span className="text-gradient">{highlight}</span>}
              </h2>
              {lead && <p className="max-w-[56ch] text-lg text-ink-2">{lead}</p>}
              <div className="mt-2 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
                <Link href={primary.href} className={ctaClass("primary", "lg")}>
                  {primary.label}
                  <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                {secondary &&
                  (secondary.external ? (
                    <a
                      href={secondary.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={ctaClass(secondary.whatsapp ? "whatsapp" : "secondary", "lg")}
                    >
                      {secondary.label}
                    </a>
                  ) : (
                    <Link href={secondary.href} className={ctaClass("secondary", "lg")}>
                      {secondary.label}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
