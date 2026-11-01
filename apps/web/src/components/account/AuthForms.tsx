"use client";

import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, type ReactNode, useState } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Link } from "@/i18n/navigation";
import { api, go } from "./api";

type Mode = "login" | "signup" | "forgot" | "reset" | "verify";

function Shell({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  const t = useTranslations("account.auth");
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-line bg-night-s1 p-6 shadow-e2 sm:p-8">
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-gold-300">
          <Icon name="sparkle" size={14} animate="draw" />
          {t("eyebrow")}
        </p>
        <h1 className="font-display text-[clamp(28px,4vw,36px)] leading-tight text-ink-1">{title}</h1>
        <p className="text-ink-2">{lead}</p>
      </div>
      {children}
    </div>
  );
}

function Alert({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "flex items-start gap-2 rounded-md border border-error/40 bg-error/10 p-3 text-sm text-ink-1"
          : "flex items-start gap-2 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-ink-1"
      }
    >
      <Icon name={tone === "error" ? "alert-triangle" : "check"} size={16} animate="none" className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function GoogleButton({ next }: { next: string }) {
  const t = useTranslations("account.auth");
  const locale = useLocale();
  return (
    <>
      <a
        href={`/api/auth/google/start?locale=${locale}&next=${encodeURIComponent(next)}`}
        className="flex min-h-12 items-center justify-center gap-3 rounded-full border border-line bg-night-s2 px-5 font-semibold text-ink-1 transition-colors hover:border-line-hover focus-visible:ring-focus"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {t("google")}
      </a>
      <div className="flex items-center gap-3 text-xs text-ink-3" aria-hidden>
        <span className="h-px flex-1 bg-line-subtle" />
        {t("or")}
        <span className="h-px flex-1 bg-line-subtle" />
      </div>
    </>
  );
}

export function AuthForm({
  mode,
  next = "/account",
  token = "",
  google = false,
  initialError,
}: {
  mode: Mode;
  next?: string;
  token?: string;
  google?: boolean;
  initialError?: string;
}) {
  const t = useTranslations("account");
  const locale = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const msg = (code: string) => (t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.server_error"));
  const fieldErr = (k: string) => (fields[k] ? msg(fields[k]) : undefined);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    const path = { login: "/api/auth/login", signup: "/api/auth/signup", forgot: "/api/auth/forgot", reset: "/api/auth/reset", verify: "/api/auth/verify" }[mode];
    const res = await api(path, "POST", { name, email, password, token, locale });
    setBusy(false);
    if (res.ok) {
      if (mode === "signup" || mode === "forgot") return setDone(true);
      return go(locale, mode === "login" ? next : "/account");
    }
    if (res.data.fields) setFields(res.data.fields);
    else setError(msg(res.data.error ?? "server_error"));
  }

  const passwordField = (label: string, autoComplete: string, hint?: string) => (
    <Field label={label} required error={fieldErr("password")} hint={hint}>
      {(id, d) => (
        <div className="relative">
          <Input
            id={id}
            type={show ? "text" : "password"}
            aria-describedby={d}
            aria-invalid={!!fieldErr("password")}
            autoComplete={autoComplete}
            required
            minLength={mode === "login" ? undefined : 8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 pr-12"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-pressed={show}
            aria-label={t("fields.show")}
            className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-ink-3 hover:text-ink-1 focus-visible:ring-focus"
          >
            <Icon name={show ? "x" : "lock"} size={18} animate="none" />
          </button>
        </div>
      )}
    </Field>
  );

  const emailField = (
    <Field label={t("fields.email")} required error={fieldErr("email")}>
      {(id, d) => (
        <Input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          aria-describedby={d}
          aria-invalid={!!fieldErr("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12"
        />
      )}
    </Field>
  );

  if (done) {
    const body = mode === "signup" ? t("auth.signup.sentBody") : t("auth.forgot.sent");
    return (
      <Shell title={mode === "signup" ? t("auth.signup.sentTitle") : t("auth.forgot.title")} lead="">
        <Alert tone="success">{body}</Alert>
        <Link href="/login" className="text-sm font-semibold text-gold-300 underline-offset-4 hover:underline focus-visible:ring-focus">
          {t("auth.forgot.back")}
        </Link>
      </Shell>
    );
  }

  if ((mode === "reset" || mode === "verify") && !token) {
    return (
      <Shell title={t(`auth.${mode}.title`)} lead={t(`auth.${mode}.missing`)}>
        <Link href={mode === "reset" ? "/forgot-password" : "/login"} className="text-sm font-semibold text-gold-300 underline-offset-4 hover:underline focus-visible:ring-focus">
          {mode === "reset" ? t("auth.reset.requestNew") : t("auth.forgot.back")}
        </Link>
      </Shell>
    );
  }

  return (
    <Shell title={t(`auth.${mode}.title`)} lead={t(`auth.${mode}.lead`)}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5" aria-busy={busy}>
        {error && <Alert tone="error">{error}</Alert>}
        {google && (mode === "login" || mode === "signup") && <GoogleButton next={next} />}
        {mode === "signup" && (
          <Field label={t("fields.name")} required error={fieldErr("name")}>
            {(id, d) => (
              <Input id={id} autoComplete="name" required aria-describedby={d} aria-invalid={!!fieldErr("name")} value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
            )}
          </Field>
        )}
        {(mode === "login" || mode === "signup" || mode === "forgot") && emailField}
        {mode === "login" && passwordField(t("fields.password"), "current-password")}
        {mode === "signup" && passwordField(t("fields.password"), "new-password", t("fields.passwordHint"))}
        {mode === "reset" && passwordField(t("fields.newPassword"), "new-password", t("fields.passwordHint"))}
        {mode === "login" && (
          <Link href="/forgot-password" className="-mt-2 w-fit text-sm text-gold-300 underline-offset-4 hover:underline focus-visible:ring-focus">
            {t("auth.login.forgot")}
          </Link>
        )}
        <Button type="submit" size="lg" loading={busy} loadingLabel={t(`auth.${mode}.busy`)} className="w-full">
          {t(`auth.${mode}.submit`)}
        </Button>
      </form>
      {mode === "login" && (
        <p className="text-sm text-ink-2">
          {t("auth.login.noAccount")}{" "}
          <Link href={next === "/account" ? "/signup" : `/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-gold-300 underline-offset-4 hover:underline focus-visible:ring-focus">
            {t("auth.login.signupLink")}
          </Link>
        </p>
      )}
      {mode === "signup" && (
        <p className="text-sm text-ink-2">
          {t("auth.signup.haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-gold-300 underline-offset-4 hover:underline focus-visible:ring-focus">
            {t("auth.signup.loginLink")}
          </Link>
        </p>
      )}
      {mode === "forgot" && (
        <Link href="/login" className="text-sm font-semibold text-gold-300 underline-offset-4 hover:underline focus-visible:ring-focus">
          {t("auth.forgot.back")}
        </Link>
      )}
    </Shell>
  );
}
