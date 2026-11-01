"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge, Card, Skeleton } from "@/components/ui/Display";
import { Modal } from "@/components/ui/Interactive";
import { Link } from "@/i18n/navigation";
import type { SlotDay } from "@/lib/booking/slots";
import { cn } from "@/lib/cn";
import { formatDateIST, formatINR, formatSlotRange } from "@/lib/format";
import type { ManageOptions } from "@/lib/manage/policy";

export interface ManageBookingProps {
  token: string;
  serviceSlug: string;
  serviceTitle: string;
  problemTitle: string;
  mode: "ONLINE_ZOOM" | "PERSONAL_VISIT";
  durationMin: number;
  slotStart: string;
  slotEnd: string;
  options: ManageOptions;
  whatsappUrl: string;
}

type Result =
  | { kind: "rescheduled"; slotStart: string; slotEnd: string }
  | { kind: "cancelled"; refund: "none" | "initiated" | "failed"; refundInr: number };

const noonOf = (date: string) => new Date(`${date}T12:00:00+05:30`);

const ERROR_KEYS = ["slot_unavailable", "slot_invalid", "not_allowed", "invalid_token", "rate_limited", "conflict_retry"] as const;
const errorKey = (code: string) => ((ERROR_KEYS as readonly string[]).includes(code) ? code : "generic");

export function ManageBooking(props: ManageBookingProps) {
  const t = useTranslations("manage");
  const locale = useLocale();
  const { options } = props;
  const [view, setView] = useState<"summary" | "reschedule">("summary");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(body: { action: "cancel" } | { action: "reschedule"; slotStart: string }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: props.token, ...body }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setError(errorKey(String(data.error ?? "")));
        return;
      }
      setConfirmCancel(false);
      setResult(
        body.action === "cancel"
          ? { kind: "cancelled", refund: (data.refund as "none" | "initiated" | "failed") ?? "none", refundInr: Number(data.refundInr ?? 0) }
          : { kind: "rescheduled", slotStart: String(data.slotStart), slotEnd: String(data.slotEnd) },
      );
    } catch {
      setError("generic");
    } finally {
      setBusy(false);
    }
  }

  const when = (start: string, end: string) =>
    `${formatDateIST(start, locale, { weekday: "long", day: "numeric", month: "long" })} · ${formatSlotRange(start, end, locale)} IST`;

  if (result)
    return (
      <Card className="flex flex-col gap-4" >
        <div role="status" aria-live="polite" className="flex flex-col gap-3">
          <Badge tone={result.kind === "rescheduled" ? "success" : "neutral"} className="self-start">
            {t(`result.${result.kind}.badge`)}
          </Badge>
          <h1 className="text-2xl text-ink-1">{t(`result.${result.kind}.title`)}</h1>
          {result.kind === "rescheduled" ? (
            <p>{t("result.rescheduled.body", { when: when(result.slotStart, result.slotEnd) })}</p>
          ) : (
            <p>
              {t("result.cancelled.body")}{" "}
              {result.refund === "initiated" && t("result.cancelled.refund", { amount: formatINR(result.refundInr, locale) })}
              {result.refund === "failed" && t("result.cancelled.refundPending")}
            </p>
          )}
        </div>
        <Link href="/book-appointment" className="text-gold-300 underline underline-offset-4 focus-visible:ring-focus">
          {t("result.bookAgain")}
        </Link>
      </Card>
    );

  return (
    <Card className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-ink-3">{t("eyebrow")}</p>
        <h1 className="text-2xl text-ink-1">{t("title")}</h1>
      </header>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
        <dt className="text-ink-3">{t("summary.service")}</dt>
        <dd className="font-semibold text-ink-1">{props.serviceTitle}</dd>
        <dt className="text-ink-3">{t("summary.topic")}</dt>
        <dd className="text-ink-1">{props.problemTitle}</dd>
        <dt className="text-ink-3">{t("summary.when")}</dt>
        <dd className="text-ink-1">{when(props.slotStart, props.slotEnd)}</dd>
        <dt className="text-ink-3">{t("summary.mode")}</dt>
        <dd className="text-ink-1">{t(props.mode === "ONLINE_ZOOM" ? "summary.online" : "summary.visit")}</dd>
        <dt className="text-ink-3">{t("summary.duration")}</dt>
        <dd className="text-ink-1">{t("summary.minutes", { count: props.durationMin })}</dd>
      </dl>

      {options.reason === "ok" ? (
        view === "summary" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">{t("policy.ok")}</p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="primary" onClick={() => setView("reschedule")}>
                {t("actions.reschedule")}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmCancel(true)}>
                {t("actions.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <ReschedulePicker {...props} busy={busy} onBack={() => setView("summary")} onConfirm={(slotStart) => submit({ action: "reschedule", slotStart })} />
        )
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-night-s1 p-4">
          <p className="text-ink-1">{t(`policy.${options.reason}`)}</p>
          {(options.reason === "too_late" || options.reason === "past") && (
            <a
              href={props.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center self-start rounded-full bg-[#25D366] px-5 font-semibold text-[#052e16] focus-visible:ring-focus"
            >
              {t("whatsappCta")}
            </a>
          )}
        </div>
      )}

      {error && !confirmCancel && (
        <p role="alert" className="rounded-md border border-error/40 bg-error/8 p-3 text-sm text-ink-1">
          {t(`errors.${error}`)}
        </p>
      )}

      <p className="text-sm text-ink-3">
        <Link href="/refund-policy" className="underline underline-offset-4 focus-visible:ring-focus">
          {t("refundPolicy")}
        </Link>
      </p>

      <Modal open={confirmCancel} onClose={() => !busy && setConfirmCancel(false)} title={t("cancelModal.title")} closeLabel={t("cancelModal.close")}>
        <div className="flex flex-col gap-4">
          <p>{t("cancelModal.body", { when: when(props.slotStart, props.slotEnd) })}</p>
          <p className="text-sm text-ink-3">{options.refundEligible ? t("cancelModal.refund") : t("cancelModal.noRefund")}</p>
          {error && (
            <p role="alert" className="text-sm text-error">
              {t(`errors.${error}`)}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setConfirmCancel(false)}>
              {t("cancelModal.keep")}
            </Button>
            <Button type="button" variant="danger" loading={busy} loadingLabel={t("cancelModal.working")} onClick={() => submit({ action: "cancel" })}>
              {t("cancelModal.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

type Load = { status: "loading" } | { status: "ready"; days: SlotDay[] } | { status: "error" };

function ReschedulePicker({
  serviceSlug,
  mode,
  durationMin,
  slotStart: current,
  busy,
  onBack,
  onConfirm,
}: ManageBookingProps & { busy: boolean; onBack: () => void; onConfirm: (slotStart: string) => void }) {
  const t = useTranslations("manage.reschedule");
  const locale = useLocale();
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [retry, setRetry] = useState(0);
  const [date, setDate] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const q = new URLSearchParams({ service: serviceSlug, mode, duration: String(durationMin), days: "14" });
    fetch(`/api/booking/slots?${q}`, { signal: ctrl.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { days: SlotDay[] };
        setLoad({ status: "ready", days: body.days });
        setDate((d) => d ?? body.days.find((x) => x.availableCount > 0)?.date ?? body.days[0]?.date ?? null);
      })
      .catch((e: unknown) => {
        if ((e as Error).name !== "AbortError") setLoad({ status: "error" });
      });
    return () => ctrl.abort();
  }, [serviceSlug, mode, durationMin, retry]);

  if (load.status === "loading")
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <span className="sr-only" aria-live="polite">
          {t("loading")}
        </span>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[76px] w-16 shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-11 rounded-full" />
          ))}
        </div>
      </div>
    );

  if (load.status === "error")
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-error/40 bg-error/8 p-4">
        <p className="text-ink-1">{t("error")}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setLoad({ status: "loading" });
            setRetry((r) => r + 1);
          }}
        >
          {t("retry")}
        </Button>
      </div>
    );

  const day = load.days.find((d) => d.date === date) ?? load.days[0];

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-ink-1">{t("title")}</h2>
      <div role="group" aria-label={t("daysLabel")} className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
        {load.days.map((d) => {
          const full = d.closed || d.availableCount === 0;
          const selected = d.date === day?.date;
          const noon = noonOf(d.date);
          return (
            <button
              key={d.date}
              type="button"
              aria-pressed={selected}
              disabled={full}
              onClick={() => setDate(d.date)}
              aria-label={formatDateIST(noon, locale, { weekday: "long", day: "numeric", month: "long" })}
              className={cn(
                "flex h-[76px] w-16 shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-md border text-center transition-colors focus-visible:ring-focus",
                selected ? "border-transparent bg-grad-gold text-ink-ongold" : "border-line text-ink-2 hover:border-gold-300 hover:text-ink-1",
                full && "opacity-40 line-through",
              )}
            >
              <span className="text-xs">{formatDateIST(noon, locale, { weekday: "short" })}</span>
              <span className="text-xl font-semibold leading-none">{formatDateIST(noon, locale, { day: "numeric" })}</span>
              <span className="text-[11px]">{formatDateIST(noon, locale, { month: "short" })}</span>
            </button>
          );
        })}
      </div>

      {day && (
        <fieldset>
          <legend className="mb-3 text-base font-semibold text-ink-1">
            {formatDateIST(noonOf(day.date), locale, { weekday: "long", day: "numeric", month: "long" })}
          </legend>
          {day.slots.length === 0 ? (
            <p className="text-ink-3">{t("none")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {day.slots.map((slot) => {
                const isCurrent = slot.start === current;
                const available = slot.available && !isCurrent;
                const selected = picked?.start === slot.start;
                const label = formatSlotRange(slot.start, slot.end, locale);
                return (
                  <button
                    key={slot.start}
                    type="button"
                    disabled={!available}
                    aria-pressed={selected}
                    aria-label={isCurrent ? `${label} — ${t("current")}` : available ? label : `${label} — ${t("unavailable")}`}
                    onClick={() => setPicked({ start: slot.start, end: slot.end })}
                    className={cn(
                      "h-11 rounded-full border text-[15px] tabular-nums transition-[border-color,color,box-shadow] focus-visible:ring-focus",
                      selected
                        ? "border-transparent bg-grad-gold font-semibold text-ink-ongold shadow-glow-gold"
                        : available
                          ? "border-line text-ink-2 hover:border-gold-300 hover:text-ink-1"
                          : "border-line-subtle text-ink-3 line-through opacity-35",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>
      )}

      <p className="text-sm text-ink-3">{t("istNote")}</p>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="primary" disabled={!picked} loading={busy} loadingLabel={t("working")} onClick={() => picked && onConfirm(picked.start)}>
          {picked ? t("confirmWith", { time: formatSlotRange(picked.start, picked.end, locale) }) : t("confirm")}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={onBack}>
          {t("back")}
        </Button>
      </div>
    </div>
  );
}
