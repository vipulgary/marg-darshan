import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuroraBackground } from "@/components/effects";
import { redirect } from "@/i18n/navigation";
import { googleConfigured } from "@/lib/auth/oauth";
import { getCurrentClient } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/tokens";
import { AuthForm } from "./AuthForms";

type Mode = "login" | "signup" | "forgot" | "reset" | "verify";

export async function authMetadata(params: Promise<{ locale: string }>, key: Mode): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.meta" });
  return { title: t(key), description: t("description"), robots: { index: false, follow: false } };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Shared server shell for /login, /signup, /forgot-password, /reset-password, /verify-email. */
export async function AuthPage({
  mode,
  params,
  searchParams,
}: {
  mode: Mode;
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await connection();
  const q = await searchParams;
  const next = safeNext(one(q.next));
  if ((mode === "login" || mode === "signup") && (await getCurrentClient())) redirect({ href: next, locale });
  const t = await getTranslations("account");
  const err = one(q.error);
  const initialError = err && t.has(`errors.${err}`) ? t(`errors.${err}`) : undefined;

  return (
    <div className="relative isolate min-h-[calc(100vh-72px)] overflow-hidden px-4 py-12 sm:py-20">
      <AuroraBackground className="-z-10" intensity="soft" />
      <div className="mx-auto w-full max-w-[440px]">
        <AuthForm mode={mode} next={next} token={one(q.token).slice(0, 100)} google={googleConfigured()} initialError={initialError} />
      </div>
    </div>
  );
}
