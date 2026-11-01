"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
import { Button } from "@/components/ui/Button";
import { Checkbox, Radio, SelectableCard, Switch } from "@/components/ui/Choice";
import { Badge, Card, Skeleton, Stepper } from "@/components/ui/Display";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal, Tabs, useToast } from "@/components/ui/Interactive";
import { useDraftField } from "@/stores/formDraft";
import { Icon, type IconName } from "@/components/icons";

const PROBLEMS = ["career", "marriage", "health", "finance", "vastu", "gems", "santaan", "birthTime"] as const;
const ICONS: Record<(typeof PROBLEMS)[number], IconName> = {
  career: "briefcase", marriage: "rings", health: "heart-pulse", finance: "coins", vastu: "compass", gems: "gem", santaan: "baby", birthTime: "hourglass",
};

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-6">
      <h2 className="text-2xl">{title}</h2>
      {children}
    </Card>
  );
}

/** Living style guide for AMX-012. Fields use the form-draft store so the language switch keeps them. */
export function ComponentShowcase() {
  const t = useTranslations();
  const toast = useToast();
  const [name, setName] = useDraftField("showcase", "name", "");
  const [email, setEmail] = useDraftField("showcase", "email", "");
  const [question, setQuestion] = useDraftField("showcase", "question", "");
  const [problem, setProblem] = useDraftField("showcase", "problem", "career");
  const [duration, setDuration] = useDraftField("showcase", "duration", "");
  const [timeUnknown, setTimeUnknown] = useDraftField("showcase", "timeUnknown", false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(2);
  // sessionStorage is client-only: render drafts after mount to avoid a hydration mismatch.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const emailError = mounted && email && !/^\S+@\S+\.\S+$/.test(email) ? t("form.invalidEmail") : undefined;
  const steps = ["problem", "mode", "details", "slot", "pay"].map((s) => t(`steps.${s}`));

  return (
    <section className="container-page grid gap-6 pb-24 lg:grid-cols-2">
      <Block title={t("showcase.buttons")}>
        <div className="flex flex-wrap items-center gap-3">
          <Button iconRight={<Icon name="arrow-right" size={18} />}>{t("cta.book")}</Button>
          <Button variant="secondary">{t("cta.kundali")}</Button>
          <Button variant="ghost">{t("cta.back")}</Button>
          <Button variant="gradient">{t("ui.popular")}</Button>
          <Button variant="whatsapp">{t("cta.whatsapp")}</Button>
          <Button loading loadingLabel={t("cta.loading")}>
            {t("cta.next")}
          </Button>
          <Button disabled>{t("cta.next")}</Button>
          <Button variant="link">{t("cta.birthTime")}</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">{t("cta.book")}</Button>
          <Button size="md">{t("cta.book")}</Button>
          <Button size="sm">{t("cta.book")}</Button>
        </div>
      </Block>

      <Block title={t("showcase.inputs")}>
        <p className="text-sm text-ink-3">{t("showcase.formDraftNote")}</p>
        <Field label={t("form.name")} required>
          {(id, d) => (
            <Input id={id} aria-describedby={d} placeholder={t("form.namePlaceholder")} value={mounted ? name : ""} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          )}
        </Field>
        <Field label={t("form.email")} error={emailError} hint="name@example.com">
          {(id, d) => (
            <Input id={id} type="email" aria-describedby={d} aria-invalid={!!emailError} value={mounted ? email : ""} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          )}
        </Field>
        <Field label={t("form.duration")}>
          {(id) => (
            <Select id={id} value={mounted ? duration : ""} onChange={(e) => setDuration(e.target.value)}>
              <option value="" disabled>
                {t("form.selectPlaceholder")}
              </option>
              <option value="30">30 min</option>
              <option value="60">60 min</option>
              <option value="120">120 min</option>
            </Select>
          )}
        </Field>
        <Field label={t("form.question")}>
          {(id) => <Textarea id={id} placeholder={t("form.questionPlaceholder")} value={mounted ? question : ""} onChange={(e) => setQuestion(e.target.value)} />}
        </Field>
        <Checkbox featured label={t("form.timeUnknown")} hint={t("form.timeUnknownHint")} checked={mounted && timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} />
        <div className="flex flex-wrap gap-6">
          <Radio name="gender" label={t("form.male")} defaultChecked />
          <Radio name="gender" label={t("form.female")} />
          <Radio name="gender" label={t("form.other")} />
        </div>
        <Checkbox label={t("form.consent")} />
        <Switch label={t("form.splitPlan")} />
      </Block>

      <Block title={t("problems.title")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {PROBLEMS.map((p) => (
            <SelectableCard
              key={p}
              name="problem"
              value={p}
              title={t(`problems.${p}`)}
              icon={<Icon name={ICONS[p]} size={32} />}
              checked={mounted && problem === p}
              onChange={setProblem}
            />
          ))}
        </div>
      </Block>

      <Block title={t("showcase.navigation")}>
        <Stepper steps={steps} current={step} progressLabel={t("steps.progress", { current: step + 1, total: steps.length })} />
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))}>
            {t("cta.back")}
          </Button>
          <Button size="sm" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
            {t("cta.next")}
          </Button>
        </div>
        <Tabs
          tabs={[
            { id: "chart", label: t("ui.tabChart"), content: <Skeleton className="h-40 w-full" /> },
            { id: "planets", label: t("ui.tabPlanets"), content: <p>{t("glossary.graha")} · {t("glossary.rashi")} · {t("glossary.nakshatra")}</p> },
            { id: "dasha", label: t("ui.tabDasha"), content: <p>{t("glossary.mahadasha")} · {t("glossary.antardasha")}</p> },
          ]}
        />
      </Block>

      <Block title={t("showcase.feedback")}>
        <div className="flex flex-wrap gap-2">
          <Badge>{t("glossary.lagna")}</Badge>
          <Badge tone="violet">{t("glossary.nakshatra")}</Badge>
          <Badge tone="success"><Icon name="check" size={14} animate="none" /> {t("ui.saved")}</Badge>
          <Badge tone="warning"><Icon name="hourglass" size={14} animate="none" /> 09:42</Badge>
          <Badge tone="error">{t("glossary.dosha")}</Badge>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={() => toast(t("ui.toastSaved"))}>
            Toast
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            {t("ui.openModal")}
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Block>

      <Modal open={open} onClose={() => setOpen(false)} title={t("ui.modalTitle")} closeLabel={t("ui.close")}>
        <p className="mb-6">{t("ui.modalBody")}</p>
        <Button variant="whatsapp" onClick={() => setOpen(false)}>
          {t("cta.whatsapp")}
        </Button>
      </Modal>
    </section>
  );
}
