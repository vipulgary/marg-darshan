"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, Spinner } from "@/components/ui/Button";
import { getService, pick } from "@/content/catalog";
import { formatINR } from "@/lib/format";
import { buildWhatsAppUrl, whatsappMessage } from "@/lib/whatsapp";
import { buildIcs, icsDataUrl } from "@/lib/notifications/ics";
import type { PaymentStatusResponse } from "@/lib/payments/service";
import { Card, MerchantHeader } from "./PaymentCheckout";
import { OrderSummary } from "./OrderSummary";
import { Icon } from "@/components/icons";

const POLL_MS = 2000;
const MAX_POLL_MS = 60_000;
const SUCCESS = new Set(["CONFIRMED", "PARTIALLY_PAID", "COMPLETED"]);

type View = "checking" | "success" | "failed" | "pending" | "missing";

function deriveView(s: PaymentStatusResponse): View | null {
  if (SUCCESS.has(s.appointmentStatus)) return "success";
  const first = s.payments.find((p) => p.installmentNo === 1);
  if (first?.status === "FAILED") return "failed";
  if (["EXPIRED", "CANCELLED", "REFUNDED", "NO_SHOW"].includes(s.appointmentStatus)) return "failed";
  return null; // still waiting for the webhook
}

export function PaymentStatusView({ appointmentId }: { appointmentId: string | null }) {
  const t = useTranslations("payment.status");
  const [data, setData] = useState<PaymentStatusResponse | null>(null);
  const [view, setView] = useState<View>(appointmentId ? "checking" : "missing");
  const [round, setRound] = useState(0);
  const started = useRef(0);

  useEffect(() => {
    if (!appointmentId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    started.current = Date.now();

    const poll = async () => {
      try {
        const res = await fetch(`/api/payments/status?appointmentId=${encodeURIComponent(appointmentId)}`, { cache: "no-store" });
        if (cancelled) return;
        if (res.status === 404 || res.status === 400) {
          setView("missing");
          return;
        }
        if (res.ok) {
          const json = (await res.json()) as PaymentStatusResponse;
          if (cancelled) return;
          setData(json);
          const next = deriveView(json);
          if (next) {
            setView(next);
            return;
          }
        }
      } catch {
        // network blip: keep polling
      }
      if (cancelled) return;
      if (Date.now() - started.current >= MAX_POLL_MS) setView("pending");
      else timer = setTimeout(poll, POLL_MS);
    };
    // Start from a callback so state updates never happen synchronously inside the effect.
    timer = setTimeout(poll, 0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [appointmentId, round]);

  const recheck = () => {
    setView("checking");
    setRound((r) => r + 1);
  };

  return (
    <Card>
      <MerchantHeader />
      <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-5">
        {view === "checking" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Spinner className="h-10 w-10 text-saffron-600" />
            <h1 className="text-2xl">{t("checkingTitle")}</h1>
            <p className="text-ink-2">{t("checkingBody")}</p>
          </div>
        )}
        {view === "success" && data && <SuccessScreen appointmentId={appointmentId!} data={data} />}
        {view === "failed" && <FailedScreen appointmentId={appointmentId!} data={data} />}
        {view === "pending" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Icon name="hourglass" size={40} animate="draw" className="text-gold-300" />
            <h1 className="text-2xl">{t("pendingTitle")}</h1>
            <p className="text-ink-2">{t("pendingBody")}</p>
            <Button variant="secondary" onClick={recheck}>
              {t("checkAgain")}
            </Button>
          </div>
        )}
        {view === "missing" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <h1 className="text-2xl">{t("missingTitle")}</h1>
            <p className="text-ink-2">{t("missingBody")}</p>
            <WhatsAppButton />
          </div>
        )}
      </div>
    </Card>
  );
}

function WhatsAppButton() {
  const t = useTranslations("payment.status");
  const locale = useLocale();
  return (
    <a
      href={buildWhatsAppUrl({ message: whatsappMessage("booking", locale) })}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 font-semibold text-[#052e16] hover:bg-[#1EBE5A] focus-visible:ring-focus"
    >
      {t("whatsapp")}
    </a>
  );
}

function SuccessScreen({ appointmentId, data }: { appointmentId: string; data: PaymentStatusResponse }) {
  const t = useTranslations("payment.status");
  const locale = useLocale();
  const reduce = useReducedMotion();
  const partial = data.appointmentStatus === "PARTIALLY_PAID";
  const service = getService(data.appointment.serviceSlug);
  const serviceTitle = service ? pick(service.title, locale) : data.appointment.serviceSlug;

  const icsHref = useMemo(() => {
    try {
      return icsDataUrl(
        buildIcs({
          uid: `${appointmentId}@astromax`,
          start: new Date(data.appointment.slotStart),
          end: new Date(data.appointment.slotEnd),
          title: t("calendarTitle", { service: serviceTitle }),
          location: data.appointment.mode === "ONLINE_ZOOM" ? "Zoom" : undefined,
          alarmMinutesBefore: 60,
        }),
      );
    } catch {
      return null;
    }
  }, [appointmentId, data.appointment, serviceTitle, t]);

  return (
    <div className="relative flex flex-col gap-5">
      {!reduce && <ParticleBurst />}
      <div className="flex flex-col items-center gap-3 text-center">
        <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden>
          <circle cx="32" cy="32" r="30" fill="none" stroke="var(--success)" strokeOpacity=".2" strokeWidth="4" />
          <motion.path
            d="M19 33l9 9 17-19"
            fill="none"
            stroke="var(--success)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </svg>
        <h1 className="text-2xl">{partial ? t("partialTitle") : t("successTitle")}</h1>
        <p className="text-ink-2">
          {partial ? t("partialBody", { balance: formatINR(data.balanceInr, locale) }) : t("successBody")}
        </p>
      </div>

      <OrderSummary data={data.appointment} />

      <dl className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-md bg-success/12 p-3">
          <dt className="text-xs text-ink-3">{t("paid")}</dt>
          <dd className="text-lg font-semibold text-success">{formatINR(data.paidInr, locale)}</dd>
        </div>
        <div className="rounded-md bg-night-s2 p-3">
          <dt className="text-xs text-ink-3">{t("balance")}</dt>
          <dd className="text-lg font-semibold text-ink-1">{formatINR(data.balanceInr, locale)}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3 sm:flex-row">
        {icsHref && (
          <a
            href={icsHref}
            download="astromax-booking.ics"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-grad-gold px-6 font-semibold text-ink-ongold focus-visible:ring-focus"
          >
            <Icon name="calendar" size={18} /> {t("addToCalendar")}
          </a>
        )}
        <div className="flex flex-1 [&>a]:w-full">
          <WhatsAppButton />
        </div>
      </div>
      <Link href="/" className="text-center text-sm font-medium text-gold-300 underline underline-offset-2 focus-visible:ring-focus">
        {t("home")}
      </Link>
    </div>
  );
}

function FailedScreen({ appointmentId, data }: { appointmentId: string; data: PaymentStatusResponse | null }) {
  const t = useTranslations("payment.status");
  const retryable =
    data &&
    (data.appointmentStatus === "HELD" || data.appointmentStatus === "PENDING_PAYMENT") &&
    data.holdExpiresAt !== null;
  const href = retryable ? `/payment/${appointmentId}` : `/book-appointment${data ? `?problem=${data.appointment.problemSlug}` : ""}`;
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <span aria-hidden className="grid h-14 w-14 place-items-center rounded-full bg-error/12 text-error">
        <Icon name="x" size={26} animate="draw" />
      </span>
      <h1 className="text-2xl">{t("failedTitle")}</h1>
      <p className="text-ink-2">{t("failedBody")}</p>
      <Link
        href={href}
        className="inline-flex h-12 items-center justify-center rounded-full bg-grad-gold px-6 font-semibold text-ink-ongold focus-visible:ring-focus"
      >
        {t("retry")}
      </Link>
      <WhatsAppButton />
    </div>
  );
}

/** One-off gold particle burst (design.md §8 success screen), 1.2s, decorative. */
function ParticleBurst() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const dist = 70 + (i % 3) * 28;
        return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: 5 + (i % 4) * 2, delay: (i % 5) * 0.03 };
      }),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-8 h-0 w-0">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-grad-gold"
          style={{ width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2 }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: p.delay, ease: [0.2, 0.8, 0.2, 1] }}
        />
      ))}
    </div>
  );
}
