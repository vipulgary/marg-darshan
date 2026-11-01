"use client";

import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Display";
import { Field, Input, Select } from "@/components/ui/Field";
import { api, go } from "./api";

type Status = { tone: "success" | "error"; text: string } | null;

function Banner({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p role="status" className={status.tone === "success" ? "text-sm text-success" : "text-sm text-error"}>
      {status.text}
    </p>
  );
}

export function SettingsForms({
  initial,
  hasPassword,
  hasGoogle,
}: {
  initial: { name: string; email: string; phone: string; lang: "hi" | "en" };
  hasPassword: boolean;
  hasGoogle: boolean;
}) {
  const t = useTranslations("account");
  const locale = useLocale();
  const [profile, setProfile] = useState(initial);
  const [profileErr, setProfileErr] = useState<Record<string, string>>({});
  const [profileStatus, setProfileStatus] = useState<Status>(null);
  const [pw, setPw] = useState({ current: "", password: "" });
  const [pwErr, setPwErr] = useState<Record<string, string>>({});
  const [pwStatus, setPwStatus] = useState<Status>(null);
  const [busy, setBusy] = useState<"" | "profile" | "password" | "sessions">("");

  const err = (key?: string) => (key ? t(`errors.${key}` as never) : undefined);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("profile");
    const r = await api("/api/account/settings", "PATCH", { name: profile.name, phone: profile.phone, lang: profile.lang });
    setBusy("");
    setProfileErr(r.data.fields ?? {});
    setProfileStatus(r.ok ? { tone: "success", text: t("settings.saved") } : { tone: "error", text: err(r.data.error === "validation" ? "invalid" : r.data.error ?? "server_error") ?? "" });
    // Switching the preferred language reloads into that locale.
    if (r.ok && profile.lang !== locale) go(profile.lang, "/account/settings");
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("password");
    const r = await api("/api/account/password", "POST", pw);
    setBusy("");
    setPwErr(r.data.fields ?? {});
    if (r.ok) {
      setPw({ current: "", password: "" });
      setPwStatus({ tone: "success", text: t("settings.passwordSaved") });
    } else setPwStatus(r.data.fields ? null : { tone: "error", text: err(r.data.error ?? "server_error") ?? "" });
  };

  const signOutAll = async () => {
    setBusy("sessions");
    await api("/api/account/sessions", "DELETE");
    go(locale, "/login");
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form onSubmit={saveProfile} className="flex flex-col gap-5" noValidate>
          <h2 className="text-xl">{t("settings.profile")}</h2>
          <Field label={t("fields.name")} required error={err(profileErr.name)}>
            {(id, d) => (
              <Input id={id} aria-describedby={d} aria-invalid={!!profileErr.name} autoComplete="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            )}
          </Field>
          <Field label={t("fields.email")} hint={t("settings.emailNote")}>
            {(id, d) => <Input id={id} aria-describedby={d} value={profile.email} readOnly />}
          </Field>
          <Field label={t("fields.phone")} error={err(profileErr.phone)}>
            {(id, d) => (
              <Input id={id} type="tel" inputMode="tel" aria-describedby={d} aria-invalid={!!profileErr.phone} autoComplete="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            )}
          </Field>
          <Field label={t("fields.language")}>
            {(id) => (
              <Select id={id} value={profile.lang} onChange={(e) => setProfile({ ...profile, lang: e.target.value as "hi" | "en" })}>
                <option value="hi">{t("fields.langHi")}</option>
                <option value="en">{t("fields.langEn")}</option>
              </Select>
            )}
          </Field>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" loading={busy === "profile"}>
              {t("settings.save")}
            </Button>
            <Banner status={profileStatus} />
          </div>
        </form>
      </Card>

      <Card>
        <form onSubmit={savePassword} className="flex flex-col gap-5" noValidate>
          <h2 className="text-xl">{hasPassword ? t("settings.changePassword") : t("settings.setPassword")}</h2>
          {hasGoogle && <p className="text-sm text-ink-3">{hasPassword ? t("settings.linkedGoogle") : t("settings.googleOnly")}</p>}
          {hasPassword && (
            <Field label={t("fields.currentPassword")} required error={err(pwErr.current)}>
              {(id, d) => (
                <Input id={id} type="password" autoComplete="current-password" aria-describedby={d} aria-invalid={!!pwErr.current} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
              )}
            </Field>
          )}
          <Field label={t("fields.newPassword")} required hint={t("fields.passwordHint")} error={err(pwErr.password)}>
            {(id, d) => (
              <Input id={id} type="password" autoComplete="new-password" aria-describedby={d} aria-invalid={!!pwErr.password} value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} />
            )}
          </Field>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" variant="secondary" loading={busy === "password"}>
              {hasPassword ? t("settings.changePassword") : t("settings.setPassword")}
            </Button>
            <Banner status={pwStatus} />
          </div>
        </form>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl">{t("settings.sessions")}</h2>
        <p className="text-sm text-ink-3">{t("settings.sessionsLead")}</p>
        <Button variant="danger" className="self-start" loading={busy === "sessions"} onClick={signOutAll}>
          {t("settings.signOutAll")}
        </Button>
      </Card>
    </div>
  );
}
