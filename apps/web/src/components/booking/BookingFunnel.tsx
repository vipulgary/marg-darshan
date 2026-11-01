"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton, Stepper } from "@/components/ui/Display";
import { useToast } from "@/components/ui/Interactive";
import { useRouter } from "@/i18n/navigation";
import { LAST_STEP, STEP_KEYS, buildHoldPayload, holdSignature, validateStep } from "@/lib/booking/draft";
import { useBookingStore } from "@/stores/booking";
import { BookingSummary, MobileSummaryBar, useActiveHold } from "./BookingSummary";
import { DetailsStep } from "./DetailsStep";
import { ModeStep } from "./ModeStep";
import { ProblemStep } from "./ProblemStep";
import { ReviewStep } from "./ReviewStep";
import { SlotStep } from "./SlotStep";
import { Icon } from "@/components/icons";

const persistApi = useBookingStore.persist;
const subscribeHydration = (cb: () => void) => persistApi.onFinishHydration(cb);

export function BookingFunnel({ initialProblem, initialProfile }: { initialProblem?: string; initialProfile?: string }) {
  // sessionStorage is client-only: render the funnel after the store has hydrated (no SSR mismatch).
  const hydrated = useSyncExternalStore(subscribeHydration, () => persistApi.hasHydrated(), () => false);
  const applied = useRef(false);
  useEffect(() => {
    if (!hydrated || applied.current) return;
    applied.current = true;
    useBookingStore.getState().applyDeepLink({ problem: initialProblem, profile: initialProfile });
  }, [hydrated, initialProblem, initialProfile]);

  if (!hydrated)
    return (
      <div className="container-page grid gap-8 pb-24 lg:grid-cols-12" aria-busy="true">
        <Skeleton className="h-10 lg:col-span-12" />
        <Skeleton className="h-[420px] lg:col-span-8" />
        <Skeleton className="hidden h-72 lg:col-span-4 lg:block" />
      </div>
    );
  return <Funnel />;
}

type ApiError = { error?: string };

function Funnel() {
  const t = useTranslations("booking");
  const tc = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const toast = useToast();
  const reduced = useReducedMotion();
  const draft = useBookingStore();
  const { step, direction, goTo, update } = draft;
  const activeHold = useActiveHold();

  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [showAll, setShowAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [slotRefresh, setSlotRefresh] = useState(0);

  const errors = validateStep(step, draft);
  const valid = Object.keys(errors).length === 0;
  const touch = useCallback((k: string) => setTouched((s) => (s.has(k) ? s : new Set(s).add(k))), []);
  const err = (k: string) => {
    const code = errors[k];
    if (!code || (!showAll && !touched.has(k))) return undefined;
    return t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.required");
  };

  const headingRef = useRef<HTMLHeadingElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const top = topRef.current;
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    headingRef.current?.focus({ preventScroll: true });
  }, [step, reduced]);

  const move = (to: number) => {
    setShowAll(false);
    setTouched(new Set());
    setApiError(null);
    goTo(to);
  };

  const signature = holdSignature(draft);
  const canContinueHold = !!activeHold && activeHold.signature === signature;

  async function submitHold() {
    if (canContinueHold) return router.push(`/payment/${activeHold!.appointmentId}?plan=${draft.planType}`);
    setSubmitting(true);
    setApiError(null);
    try {
      const res = await fetch("/api/booking/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildHoldPayload(useBookingStore.getState(), locale)),
      });
      const body = (await res.json().catch(() => ({}))) as ApiError & { appointmentId?: string; holdExpiresAt?: string };
      if (res.ok && body.appointmentId && body.holdExpiresAt) {
        update({
          hold: { appointmentId: body.appointmentId, holdExpiresAt: body.holdExpiresAt, slotStart: draft.slotStart!, signature },
        });
        router.push(`/payment/${body.appointmentId}?plan=${draft.planType}`);
        return;
      }
      if (res.status === 409 || body.error === "slot_invalid") {
        toast(t("errors.slotTaken"), "warning");
        update({ slotStart: null });
        setSlotRefresh((n) => n + 1);
        move(3);
        setApiError(t("errors.slotTaken"));
        return;
      }
      setApiError(
        res.status === 429 ? t("errors.rateLimited") : res.status === 503 ? t("errors.unavailable") : t("errors.server"),
      );
    } catch {
      setApiError(t("errors.network"));
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setShowAll(true);
      return;
    }
    if (step === LAST_STEP) void submitHold();
    else move(step + 1);
  }

  const stepLabels = STEP_KEYS.map((k) => tc(`steps.${k}`));
  const key = STEP_KEYS[step];
  const offset = reduced ? 0 : 24;

  return (
    <div ref={topRef} className="container-page scroll-mt-24 pb-32 lg:pb-24">
      <Stepper steps={stepLabels} current={step} progressLabel={tc("steps.progress", { current: step + 1, total: stepLabels.length })} />
      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <form noValidate onSubmit={onSubmit} className="lg:col-span-8">
          <div className="overflow-hidden rounded-lg border border-line bg-night-s1 p-5 shadow-e1 sm:p-7">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={key}
                initial={{ opacity: 0, x: direction * offset }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * offset }}
                transition={{ duration: reduced ? 0.15 : 0.24, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl text-ink-1 outline-none sm:text-[28px]">
                  {t(`${key}.title`)}
                </h2>
                <p className="mb-6 mt-1 text-ink-2">{t(`${key}.lead`)}</p>
                {step === 0 && <ProblemStep />}
                {step === 1 && <ModeStep />}
                {step === 2 && <DetailsStep err={err} touch={touch} />}
                {step === 3 && <SlotStep refreshKey={slotRefresh} />}
                {step === 4 && <ReviewStep err={err} />}
              </motion.div>
            </AnimatePresence>

            <div aria-live="assertive">
              {apiError && (
                <p role="alert" className="mt-6 rounded-md border border-error/40 bg-error/8 px-4 py-3 text-sm text-ink-1">
                  <Icon name="alert-triangle" size={14} animate="none" className="mr-1 inline-block align-[-2px]" />{apiError}
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
              {step > 0 ? (
                <Button type="button" variant="ghost" onClick={() => move(step - 1)} iconLeft={<Icon name="arrow-left" size={18} />}>
                  {tc("cta.back")}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                {/* aria-disabled instead of disabled: the button stays focusable and its hint is read out;
                    pressing it on an incomplete step reveals every field error (onSubmit → showAll). */}
                <Button
                  type="submit"
                  size="lg"
                  aria-disabled={!valid || undefined}
                  aria-describedby={valid ? undefined : "booking-next-hint"}
                  loading={submitting}
                  loadingLabel={t("nav.holding")}
                  iconRight={step === LAST_STEP ? undefined : <Icon name="arrow-right" size={18} />}
                  className="justify-center aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:shadow-none aria-disabled:hover:translate-y-0"
                >
                  {step === LAST_STEP ? (canContinueHold ? t("nav.continuePayment") : t("nav.holdAndPay")) : tc("cta.next")}
                </Button>
                {!valid && (
                  <p id="booking-next-hint" className="text-xs text-ink-3">
                    {t("nav.completeStep")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
        <div className="hidden lg:col-span-4 lg:block">
          <div className="sticky top-24">
            <BookingSummary />
          </div>
        </div>
      </div>
      <MobileSummaryBar />
    </div>
  );
}
