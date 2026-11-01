"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { ChartData } from "@/lib/contracts";
import { KundaliLoader } from "./KundaliLoader";
import { type KundaliHeaderData, KundaliHeader, KundaliResult } from "./KundaliResult";
import { Icon } from "@/components/icons";

type Status = "QUEUED" | "RUNNING" | "DONE" | "FAILED";

const INTERVAL_MS = 2_000;
const SLOW_AFTER_MS = 60_000;
const GIVE_UP_AFTER_MS = 5 * 60_000;

export function KundaliFailed() {
  const t = useTranslations("kundali.result");
  return (
    <div className="container-page py-14">
      <div role="alert" className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-xl border border-error/40 bg-night-s1 p-8 text-center">
        <Icon name="alert-triangle" size={40} animate="draw" className="text-error" />
        <h2 className="text-2xl">{t("failedTitle")}</h2>
        <p className="text-ink-2">{t("failedBody")}</p>
        <Link
          href="/free-kundali"
          className="inline-flex h-12 items-center rounded-full bg-grad-gold px-[22px] font-semibold text-ink-ongold focus-visible:ring-focus"
        >
          {t("retry")}
        </Link>
      </div>
    </div>
  );
}

/** AMX-062 — polls GET /api/kundali/[id] every 2s while the chart is queued/running. */
export function KundaliPoller({ id, subject, chartStyle, initialStatus }: { id: string; subject: KundaliHeaderData; chartStyle: "north" | "south"; initialStatus: Status }) {
  const t = useTranslations("kundali.result");
  const [status, setStatus] = useState<Status>(initialStatus);
  const [chart, setChart] = useState<ChartData | null>(null);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (initialStatus === "DONE" || initialStatus === "FAILED") return;
    const started = Date.now();
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const res = await fetch(`/api/kundali/${id}`, { cache: "no-store" });
        if (res.ok) {
          const body = (await res.json()) as { status: Status; chart?: ChartData };
          if (stopped) return;
          if (body.status === "DONE" && body.chart) {
            setChart(body.chart);
            setStatus("DONE");
            return;
          }
          if (body.status === "FAILED") {
            setStatus("FAILED");
            return;
          }
        }
      } catch {
        // transient network error: keep polling
      }
      const elapsed = Date.now() - started;
      if (elapsed > SLOW_AFTER_MS) setSlow(true);
      if (!stopped && elapsed < GIVE_UP_AFTER_MS) timer = setTimeout(tick, INTERVAL_MS);
    };
    timer = setTimeout(tick, INTERVAL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [id, initialStatus]);

  return (
    <>
      <KundaliHeader subject={subject} chart={chart} />
      {status === "DONE" && chart ? (
        <KundaliResult id={id} chart={chart} chartStyle={chartStyle} name={subject.name} dob={subject.dob} />
      ) : status === "FAILED" ? (
        <KundaliFailed />
      ) : (
        <div className="container-page py-10">
          <KundaliLoader extra={slow ? t("slow") : undefined} />
        </div>
      )}
    </>
  );
}
