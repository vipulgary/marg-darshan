"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";

const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
};
const getSecond = () => Math.floor(Date.now() / 1000);
const getServerSecond = () => null;

/** Seconds since epoch, ticking once a second; null during SSR/hydration so markup matches. */
export function useClockSeconds(): number | null {
  return useSyncExternalStore(subscribe, getSecond, getServerSecond);
}

/** design.md §8 hold timer: warning chip, pulses under 2 minutes, screen readers get minute-level updates. */
export function HoldCountdown({ expiresAt, onExpire }: { expiresAt: string; onExpire?: () => void }) {
  const t = useTranslations("payment.hold");
  const nowSec = useClockSeconds();
  const left = nowSec === null ? null : Math.max(0, Math.floor(new Date(expiresAt).getTime() / 1000) - nowSec);

  useEffect(() => {
    if (left === 0) onExpire?.();
  }, [left, onExpire]);

  const mmss = left === null ? "--:--" : `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  const minutes = left === null ? null : Math.ceil(left / 60);
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-sm bg-warning/12 px-3 text-sm font-semibold text-warning tabular-nums",
          left !== null && left < 120 && "motion-safe:animate-pulse",
        )}
      >
        <Icon name="hourglass" size={16} animate="none" />
        {t("chip", { time: mmss })}
      </span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {minutes === null ? "" : minutes <= 1 ? t("srLast") : t("srMinutes", { minutes })}
      </span>
    </>
  );
}
