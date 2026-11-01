"use client";

import { useCallback, useState } from "react";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import { HoldCountdown } from "./HoldCountdown";
import { LockIcon, MethodIcons } from "./MethodIcons";
import { OrderSummary, type BookingSummaryData } from "./OrderSummary";
import { Icon } from "@/components/icons";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

type PlanType = "FULL_UPFRONT" | "SPLIT_PLAN";

export interface PaymentCheckoutProps {
  appointmentId: string;
  holdExpiresAt: string;
  summary: BookingSummaryData;
  totalInr: number;
  splitAllowed: boolean;
  advancePct: number;
  advanceInr: number;
  balanceInr: number;
  initialPlan: PlanType;
}

interface OrderResponse {
  orderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  description: string;
  prefill: { name: string; email?: string; contact?: string };
}

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", cb: (resp: { error?: { description?: string; reason?: string } }) => void): void;
}

type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

/** next/script loads the SDK lazily; if the user is faster than idle time, load it on demand. */
function ensureRazorpay(): Promise<RazorpayCtor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = CHECKOUT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener("load", () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("sdk"))));
    script.addEventListener("error", () => reject(new Error("sdk")));
    setTimeout(() => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("sdk"))), 15_000);
  });
}

type Phase = "idle" | "creating" | "checkout" | "verifying";

export function PaymentCheckout(props: PaymentCheckoutProps) {
  const { appointmentId, holdExpiresAt, summary, totalInr, splitAllowed, advancePct, advanceInr, balanceInr } = props;
  const t = useTranslations("payment");
  const locale = useLocale();
  const router = useRouter();
  const [plan, setPlan] = useState<PlanType>(splitAllowed ? props.initialPlan : "FULL_UPFRONT");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  // The server already renders the expired state; this flips when the countdown hits zero.
  const [expired, setExpired] = useState(false);
  const onExpire = useCallback(() => setExpired(true), []);

  const dueNow = plan === "SPLIT_PLAN" ? advanceInr : totalInr;
  const amount = formatINR(dueNow, locale);

  async function pay() {
    setError(null);
    setPhase("creating");
    let order: OrderResponse;
    try {
      const res = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, planType: plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhase("idle");
        if (data.error === "hold_expired") setExpired(true);
        else if (data.error === "already_paid" || data.error === "not_payable") router.push(`/payment/success?appointment=${appointmentId}`);
        else setError(data.error === "payments_not_configured" ? t("errors.notConfigured") : t("errors.generic"));
        return;
      }
      order = data as OrderResponse;
    } catch {
      setPhase("idle");
      setError(t("errors.generic"));
      return;
    }

    let Razorpay: RazorpayCtor;
    try {
      Razorpay = await ensureRazorpay();
    } catch {
      setPhase("idle");
      setError(t("errors.sdk"));
      return;
    }

    const rzp = new Razorpay({
      key: order.keyId,
      amount: order.amountPaise,
      currency: order.currency,
      order_id: order.orderId,
      name: t("merchant"),
      description: order.description,
      prefill: order.prefill,
      notes: { appointmentId },
      theme: { color: "#F59E0B" },
      retry: { enabled: true },
      // UPI first: intent apps (GPay/PhonePe) on mobile, QR on desktop.
      config: {
        display: {
          blocks: { upi: { name: "UPI / GPay / PhonePe", instruments: [{ method: "upi" }] } },
          sequence: ["block.upi"],
          preferences: { show_default_blocks: true },
        },
      },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          setPhase((p) => (p === "checkout" ? "idle" : p));
          setError((e) => e ?? t("errors.dismissed"));
        },
      },
      handler: async (resp: RazorpayHandlerResponse) => {
        setPhase("verifying");
        setError(null);
        try {
          const res = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          });
          if (res.status === 400) {
            setPhase("idle");
            setError(t("errors.signature"));
            return;
          }
        } catch {
          // The webhook is the source of truth; the status page polls it.
        }
        router.push(`/payment/success?appointment=${appointmentId}`);
      },
    });
    rzp.on("payment.failed", (resp) => {
      const reason = resp.error?.description;
      setError(reason ? t("errors.failed", { reason }) : t("errors.failedGeneric"));
    });
    setPhase("checkout");
    rzp.open();
  }

  if (expired && phase !== "verifying") {
    return (
      <Card>
        <h1 className="text-2xl">{t("expired.title")}</h1>
        <p className="text-ink-2">{t("expired.body")}</p>
        <Link
          href={`/book-appointment?problem=${summary.problemSlug}`}
          className="inline-flex h-12 items-center justify-center rounded-full bg-grad-gold px-6 font-semibold text-ink-ongold focus-visible:ring-focus"
        >
          {t("expired.cta")}
        </Link>
      </Card>
    );
  }

  const busy = phase !== "idle";
  return (
    <Card>
      <Script src={CHECKOUT_SRC} strategy="lazyOnload" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MerchantHeader />
        <HoldCountdown expiresAt={holdExpiresAt} onExpire={onExpire} />
      </div>

      <OrderSummary data={summary} />

      {splitAllowed && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-2">{t("planLabel")}</legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {(
              [
                ["FULL_UPFRONT", t("planFull"), t("planFullHint")],
                [
                  "SPLIT_PLAN",
                  t("planSplit", { pct: advancePct }),
                  t("planSplitHint", { advance: formatINR(advanceInr, locale), balance: formatINR(balanceInr, locale) }),
                ],
              ] as const
            ).map(([value, title, hint]) => (
              <label
                key={value}
                className={cn(
                  "flex min-h-[64px] cursor-pointer flex-col justify-center rounded-md border px-3 py-2 transition-colors has-focus-visible:ring-focus",
                  plan === value ? "border-saffron-600 bg-saffron-500/8" : "border-line bg-night-s1 hover:border-line-hover",
                  busy && "pointer-events-none opacity-60",
                )}
              >
                <input
                  type="radio"
                  name="plan"
                  value={value}
                  checked={plan === value}
                  onChange={() => setPlan(value)}
                  disabled={busy}
                  className="sr-only"
                />
                <span className="font-semibold text-ink-1">{title}</span>
                <span className="text-[13px] text-ink-3">{hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex items-end justify-between gap-4 border-t border-line pt-4">
        <div>
          <p className="text-sm text-ink-3">{plan === "SPLIT_PLAN" ? t("payNow") : t("total")}</p>
          <p className="font-display text-4xl font-semibold text-ink-1 tabular-nums">{amount}</p>
        </div>
        {plan === "SPLIT_PLAN" && (
          <p className="max-w-[45%] text-right text-[13px] text-ink-3">
            {t("balanceLater")}: <span className="font-semibold text-ink-2">{formatINR(balanceInr, locale)}</span>
          </p>
        )}
      </div>

      <MethodIcons />

      <div aria-live="assertive" className="min-h-0">
        {error && <p className="rounded-md bg-error/12 px-4 py-3 text-sm font-medium text-error">{error}</p>}
      </div>

      <Button
        size="lg"
        className="w-full justify-center"
        onClick={pay}
        loading={busy}
        loadingLabel={phase === "verifying" ? t("verifying") : t("creating")}
        iconLeft={<LockIcon />}
      >
        {t("payCta", { amount })}
      </Button>

      <div className="flex flex-col items-center gap-1 text-center text-[13px] text-ink-3">
        <p className="inline-flex items-center gap-1.5 font-semibold text-ink-2">
          <LockIcon className="h-3.5 w-3.5" /> {t("secured")}
        </p>
        <p>{t("securedNote")}</p>
        <Link href="/refund-policy" className="font-medium text-gold-300 underline underline-offset-2 focus-visible:ring-focus">
          {t("refundPolicy")}
        </Link>
      </div>
      <p className="sr-only" aria-live="polite">
        {phase === "verifying" ? t("verifying") : ""}
      </p>
    </Card>
  );
}

export function MerchantHeader() {
  const t = useTranslations("payment");
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="grid h-11 w-11 place-items-center rounded-full bg-grad-gold text-ink-ongold">
        <Icon name="sparkle" size={22} animate="draw" />
      </span>
      <div>
        <p className="font-display text-lg font-semibold leading-tight text-ink-1">{t("merchant")}</p>
        <p className="text-xs text-ink-3">{t("merchantTagline")}</p>
      </div>
    </div>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col gap-5 rounded-xl border border-line bg-night-s1 p-5 shadow-[0_20px_50px_-24px_rgba(26,19,37,.25)] sm:p-7">
      {children}
    </div>
  );
}
