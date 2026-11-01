import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";

type Tone = "gold" | "violet" | "success" | "warning" | "error" | "neutral";

const tones: Record<Tone, string> = {
  gold: "bg-saffron-500/14 text-gold-300",
  violet: "bg-violet-500/18 text-violet-300",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  error: "bg-error/12 text-error",
  neutral: "bg-white/6 text-ink-2",
};

/** design.md §7.4 */
export function Badge({ tone = "gold", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-[26px] items-center gap-1 rounded-sm px-2.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

/** design.md §2.3 — eyebrow + title (one gradient keyword) + lead. */
export function SectionTitle({
  eyebrow,
  title,
  highlight,
  lead,
  align = "center",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  lead?: string;
  align?: "center" | "left";
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("flex flex-col gap-3", align === "center" && "items-center text-center")}>
      {eyebrow && (
        <p className="flex items-center gap-2 text-[13px] font-semibold text-gold-300 [:lang(en)_&]:uppercase [:lang(en)_&]:tracking-[0.16em]">
          <Icon name="sparkle" size={14} animate="draw" />
          {eyebrow}
        </p>
      )}
      <Tag
        className={cn(
          "font-display tracking-[-0.015em]",
          Tag === "h1" ? "text-[clamp(40px,5.6vw,72px)] leading-[1.05]" : "text-[clamp(26px,3.2vw,40px)] leading-[1.15]",
        )}
      >
        {title} {highlight && <span className="text-gradient">{highlight}</span>}
      </Tag>
      {lead && <p className="mt-1 max-w-[60ch] text-[19px] leading-relaxed text-ink-2">{lead}</p>}
    </div>
  );
}

/** design.md §7.1 base card with hover lift. */
export function Card({ children, className, interactive }: { children: ReactNode; className?: string; interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-night-s1 p-6 shadow-e1 md:p-7",
        interactive && "transition-all duration-200 ease-out hover:-translate-y-1 hover:border-line-hover hover:shadow-e2",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** design.md §8 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-skeleton rounded-md bg-night-s2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.05),transparent)] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}

/** design.md §6.5 — booking stepper; collapses to "Step x/y" + progress bar on mobile. */
export function Stepper({ steps, current, progressLabel }: { steps: string[]; current: number; progressLabel: string }) {
  return (
    <nav aria-label="progress">
      <div className="md:hidden">
        <p className="mb-2 text-sm text-ink-2">
          {progressLabel} · <span className="font-semibold text-ink-1">{steps[current]}</span>
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-night-s3">
          <div className="h-full bg-grad-gold transition-[width] duration-500" style={{ width: `${((current + 1) / steps.length) * 100}%` }} />
        </div>
      </div>
      <ol className="hidden items-start md:flex">
        {steps.map((label, i) => {
          const state = i < current ? "done" : i === current ? "current" : "upcoming";
          return (
            <li key={label} className="flex flex-1 items-start last:flex-none">
              <div className="flex flex-col items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
                <span
                  className={cn(
                    "relative grid h-7 w-7 place-items-center rounded-full text-sm font-semibold",
                    state === "done" && "bg-grad-gold text-ink-ongold",
                    state === "current" &&
                      "border-2 border-saffron-400 text-gold-300 before:absolute before:-inset-1.5 before:animate-ping before:rounded-full before:bg-saffron-400/20",
                    state === "upcoming" && "border border-line text-ink-3",
                  )}
                >
                  {state === "done" ? <Icon name="check" size={16} strokeWidth={2} animate="draw" /> : i + 1}
                </span>
                <span className={cn("text-sm", state === "current" ? "font-semibold text-ink-1" : state === "done" ? "text-ink-2" : "text-ink-3")}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span className="mx-2 mt-3.5 h-0.5 flex-1 overflow-hidden rounded-full bg-night-s3">
                  <span className={cn("block h-full bg-grad-gold transition-[width] duration-500", i < current ? "w-full" : "w-0")} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
