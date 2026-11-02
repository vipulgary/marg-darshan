"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { Icon } from "@/components/icons";
import { BirthplaceCombobox } from "@/components/kundali/BirthplaceCombobox";
import { Button } from "@/components/ui/Button";
import { Radio } from "@/components/ui/Choice";
import { Card } from "@/components/ui/Display";
import { Field, Input } from "@/components/ui/Field";
import { Link, useRouter } from "@/i18n/navigation";
import type { PlaceValue } from "@/lib/contracts";
import { BiodataDrop } from "@/components/milan/BiodataDrop";
import { api } from "./api";
import { Empty } from "./parts";

export interface SavedProfile {
  id: string;
  label: string;
  name: string;
  gender: "male" | "female" | "other";
  dob: string;
  tob: string;
  place: PlaceValue;
}

type Draft = Omit<SavedProfile, "id" | "place"> & { place: PlaceValue | null };
const EMPTY: Draft = { label: "", name: "", gender: "male", dob: "", tob: "", place: null };

function ProfileForm({ initial, onDone, onCancel }: { initial: Draft & { id?: string }; onDone: (msg: string) => void; onCancel: () => void }) {
  const t = useTranslations("account");
  const [d, setD] = useState<Draft>(initial);
  const [bad, setBad] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const has = (k: string) => bad.some((b) => b === k || b.startsWith(`${k}.`));
  const req = t("errors.required");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = initial.id ? await api(`/api/account/profiles/${initial.id}`, "PATCH", d) : await api("/api/account/profiles", "POST", d);
    setBusy(false);
    if (r.ok) return onDone(t("profiles.saved"));
    setBad(r.data.issues ?? []);
    setError(r.data.issues ? "" : t(`errors.${r.data.error === "too_many" ? "invalid" : r.data.error ?? "server_error"}` as never));
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {/* Drop a biodata to fill everything below; the label (Brother, Friend…) stays yours to choose. */}
      <BiodataDrop
        onFill={(f) =>
          setD((cur) => ({
            ...cur,
            name: f.name ?? cur.name,
            gender: f.gender ?? cur.gender,
            dob: f.dob ?? cur.dob,
            tob: f.tob ?? "",
            place: f.place ?? cur.place,
          }))
        }
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("profiles.label")} hint={t("profiles.labelHint")} required error={has("label") ? req : undefined}>
          {(id, ds) => <Input id={id} aria-describedby={ds} aria-invalid={has("label")} value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} />}
        </Field>
        <Field label={t("profiles.subjectName")} required error={has("name") ? req : undefined}>
          {(id, ds) => <Input id={id} aria-describedby={ds} aria-invalid={has("name")} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />}
        </Field>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-ink-2">{t("profiles.gender")}</legend>
        <div className="flex flex-wrap gap-6">
          {(["male", "female", "other"] as const).map((g) => (
            <Radio key={g} name="gender" label={t(`profiles.${g}`)} checked={d.gender === g} onChange={() => setD({ ...d, gender: g })} />
          ))}
        </div>
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("profiles.dob")} required error={has("dob") ? t("errors.invalid") : undefined}>
          {(id, ds) => <Input id={id} type="date" aria-describedby={ds} aria-invalid={has("dob")} value={d.dob} onChange={(e) => setD({ ...d, dob: e.target.value })} />}
        </Field>
        <Field label={t("profiles.tob")} hint={t("profiles.tobHint")} error={has("tob") ? t("errors.invalid") : undefined}>
          {(id, ds) => <Input id={id} type="time" aria-describedby={ds} aria-invalid={has("tob")} value={d.tob} onChange={(e) => setD({ ...d, tob: e.target.value })} />}
        </Field>
      </div>
      <BirthplaceCombobox label={t("profiles.place")} required value={d.place} onChange={(place) => setD({ ...d, place })} error={has("place") ? req : undefined} />
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={busy}>
          {t("profiles.save")}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("profiles.cancel")}
        </Button>
      </div>
    </form>
  );
}

export function ProfilesManager({ initial }: { initial: SavedProfile[] }) {
  const t = useTranslations("account");
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [notice, setNotice] = useState("");

  const done = (msg: string) => {
    setEditing(null);
    setNotice(msg);
    router.refresh();
  };

  const remove = async (p: SavedProfile) => {
    if (!window.confirm(t("profiles.confirmDelete"))) return;
    const r = await api(`/api/account/profiles/${p.id}`, "DELETE");
    if (r.ok) done(t("profiles.removed"));
  };

  return (
    <div className="flex flex-col gap-5">
      <p role="status" aria-live="polite" className="text-sm text-success">
        {notice}
      </p>
      {editing === "new" ? (
        <Card>
          <ProfileForm initial={EMPTY} onDone={done} onCancel={() => setEditing(null)} />
        </Card>
      ) : (
        <Button className="self-start" iconLeft={<Icon name="user" size={18} />} onClick={() => setEditing("new")}>
          {t("profiles.add")}
        </Button>
      )}
      {initial.length === 0 && editing !== "new" && <Empty icon="user">{t("profiles.empty")}</Empty>}
      <ul className="grid gap-4 md:grid-cols-2">
        {initial.map((p) => (
          <li key={p.id}>
            <Card className="flex h-full flex-col gap-3">
              {editing === p.id ? (
                <ProfileForm initial={p} onDone={done} onCancel={() => setEditing(null)} />
              ) : (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gold-300">{p.label}</p>
                    <h2 className="text-lg">{p.name}</h2>
                    <p className="text-sm text-ink-3">
                      {p.dob} · {p.tob || t("profiles.timeUnknown")} · {p.place.placeName}
                    </p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link
                      href={{ pathname: "/free-kundali", query: { name: p.name, dob: p.dob, ...(p.tob ? { tob: p.tob } : {}), place: p.place.placeName } }}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line-gold px-4 text-sm font-semibold text-gold-300 hover:bg-gold-300/8 focus-visible:ring-focus"
                    >
                      <Icon name="kundali" size={16} /> {t("profiles.makeKundali")}
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(p.id)}>
                      {t("profiles.edit")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(p)}>
                      {t("profiles.delete")}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
