"use client";

import { type FormEvent, useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useHydrated } from "@/components/shop/useHydrated";
import { cn } from "@/lib/cn";
import { isIndianMobile, looksLikeEmail } from "@/lib/shop/phone";
import { useDraftField, useFormDraft } from "@/stores/formDraft";
import type { NewsletterStatus } from "./schema";
import { Icon } from "@/components/icons";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "done"; status: NewsletterStatus } | { kind: "error"; message: string };

/** AMX-120 — footer (compact) and page (large) newsletter sign-up with double opt-in. */
export function NewsletterSignup({ variant = "footer" }: { variant?: "footer" | "page" }) {
  const t = useTranslations("newsletter.signup");
  const locale = useLocale();
  const hydrated = useHydrated();
  const formId = `newsletter-${variant}`;
  const [emailDraft, setEmail] = useDraftField(formId, "email", "");
  const [waDraft, setWhatsapp] = useDraftField(formId, "whatsapp", "");
  const clearDraft = useFormDraft((s) => s.clear);
  const email = hydrated ? emailDraft : "";
  const whatsapp = hydrated ? waDraft : "";
  const [honeypot, setHoneypot] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });
  const ids = useId();

  const emailError = attempted && !looksLikeEmail(email) ? t("errors.email") : undefined;
  const waError = attempted && whatsapp.trim() && !isIndianMobile(whatsapp) ? t("errors.whatsapp") : undefined;
  const page = variant === "page";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setAttempted(true);
    if (!looksLikeEmail(email) || (whatsapp.trim() && !isIndianMobile(whatsapp))) {
      requestAnimationFrame(() => form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), whatsapp: whatsapp.trim() || undefined, locale, website: honeypot || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { status?: NewsletterStatus };
      if (res.ok) {
        setState({ kind: "done", status: data.status === "active" ? "active" : "pending" });
        clearDraft(formId);
        return;
      }
      setState({ kind: "error", message: t(res.status === 429 ? "errors.rateLimit" : "errors.server") });
    } catch {
      setState({ kind: "error", message: t("errors.network") });
    }
  }

  const done = state.kind === "done";

  return (
    <div className={cn("relative", page && "rounded-xl border border-line bg-night-s1/80 p-6 shadow-e2 backdrop-blur md:p-8")}>
      {!page && (
        <div className="mb-3">
          <p className="font-semibold text-ink-1">{t("footerTitle")}</p>
          <p className="text-sm text-ink-3">{t("footerLead")}</p>
        </div>
      )}

      <div aria-live="polite">
        {done && (
          <div role="status" className="flex items-start gap-3 rounded-lg border border-success/40 bg-success/12 p-4">
            <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-success text-night-0">
              <Icon name="check" size={18} strokeWidth={2} animate="draw" />
            </span>
            <div>
              <p className="font-semibold text-ink-1">{state.status === "active" ? t("alreadyTitle") : t("successTitle")}</p>
              <p className="text-sm text-ink-2">{state.status === "active" ? t("already") : t("success")}</p>
              {state.status === "pending" && <p className="mt-1 text-xs text-ink-3">{t("successHint")}</p>}
            </div>
          </div>
        )}
      </div>

      {!done && (
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
          {/* Honeypot: off-screen, unfocusable, ignored by assistive tech */}
          <div aria-hidden className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
            <label htmlFor={`${ids}-website`}>{t("honeypot")}</label>
            <input id={`${ids}-website`} name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>

          {page ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("email")} required error={emailError}>
                {(id, d) => (
                  <Input id={id} type="email" autoComplete="email" inputMode="email" aria-describedby={d} aria-invalid={!!emailError} placeholder={t("emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} />
                )}
              </Field>
              <Field label={t("whatsapp")} hint={t("whatsappHint")} error={waError}>
                {(id, d) => (
                  <Input id={id} type="tel" autoComplete="tel" inputMode="tel" aria-describedby={d} aria-invalid={!!waError} placeholder={t("whatsappPlaceholder")} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                )}
              </Field>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <label htmlFor={`${ids}-email`} className="sr-only">
                  {t("email")}
                </label>
                <input
                  id={`${ids}-email`}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? `${ids}-err` : undefined}
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 min-w-0 flex-1 rounded-full border border-line bg-night-s2 px-4 text-[15px] text-ink-1 placeholder:text-ink-3 hover:border-line-hover focus:border-saffron-400 focus:outline-none focus:shadow-[0_0_0_4px_rgba(245,158,11,.25)] aria-invalid:border-error"
                />
                <Button type="submit" size="sm" className="h-11 shrink-0" loading={state.kind === "sending"} aria-label={state.kind === "sending" ? t("sending") : undefined}>
                  {t("submit")}
                </Button>
              </div>
              <label htmlFor={`${ids}-wa`} className="sr-only">
                {t("whatsapp")}
              </label>
              <input
                id={`${ids}-wa`}
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={!!waError}
                aria-describedby={waError ? `${ids}-err` : undefined}
                placeholder={t("whatsapp")}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="h-11 rounded-full border border-line bg-night-s2 px-4 text-[15px] text-ink-1 placeholder:text-ink-3 hover:border-line-hover focus:border-saffron-400 focus:outline-none focus:shadow-[0_0_0_4px_rgba(245,158,11,.25)] aria-invalid:border-error"
              />
              {(emailError || waError) && (
                <p id={`${ids}-err`} role="alert" className="text-[13px] text-error">
                  <Icon name="alert-triangle" size={14} animate="none" className="mr-1 inline-block align-[-2px]" />{emailError ?? waError}
                </p>
              )}
            </>
          )}

          {state.kind === "error" && (
            <p role="alert" className="rounded-md bg-error/12 px-4 py-2.5 text-sm text-error">
              {state.message}
            </p>
          )}

          {page && (
            <Button type="submit" size="lg" className="justify-center md:self-start" loading={state.kind === "sending"} loadingLabel={t("sending")} iconRight={<Icon name="arrow-right" size={18} />}>
              {t("submitPage")}
            </Button>
          )}
          <p className="text-xs text-ink-3">{t("consent")}</p>
        </form>
      )}
    </div>
  );
}
