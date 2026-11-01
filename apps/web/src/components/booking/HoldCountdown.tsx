"use client";

import { useTranslations } from "next-intl";
import { formatCountdown, holdRemainingMs } from "@/lib/booking/hold";
import { cn } from "@/lib/cn";
import { useNow } from "./useNow";
import { Icon } from "@/components/icons";

/** design.md §8 hold timer chip: warning tone, pulses under 2 minutes. */
export function HoldCountdown({ expiresAt, className }: { expiresAt: string; className?: string }) {
  const t = useTranslations("booking.hold");
  const now = useNow();
  if (!now) return null;
  const ms = holdRemainingMs(expiresAt, now);
  const minutesLeft = Math.ceil(ms / 60_000);
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span
        role="timer"
        aria-live="off"
        className={cn(
          "inline-flex h-8 w-fit items-center gap-1.5 rounded-sm bg-warning/12 px-3 text-sm font-semibold text-warning tabular-nums",
          ms > 0 && ms < 120_000 && "motion-safe:animate-pulse",
        )}
      >
        <Icon name="hourglass" size={16} animate="none" />
        {ms > 0 ? t("countdown", { time: formatCountdown(ms) }) : t("expired")}
      </span>
      {/* announce once per minute rather than every tick */}
      <span className="sr-only" aria-live="polite">
        {ms > 0 ? t("minutesLeft", { count: minutesLeft }) : t("expired")}
      </span>
    </div>
  );
}
