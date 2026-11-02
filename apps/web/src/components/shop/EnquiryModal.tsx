"use client";

import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PROBLEMS, pick } from "@/content/catalog";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Interactive";
import { enquiryFieldErrors } from "@/lib/shop/enquiry";
import { useDraftField } from "@/stores/formDraft";

export interface EnquiryProduct {
  /** Prefilled note, e.g. the chosen gem weight (AMX-204). */
  presetNote?: string;
  slug: string;
  sku: string;
  title: string;
}

type Variant = "primary" | "secondary" | "ghost" | "gradient";

/** Trigger + modal. The dialog only mounts while open, so several cards never share dialog ids. */
export function EnquiryButton({
  product,
  label,
  variant = "secondary",
  size = "md",
  className,
  iconRight,
}: {
  product: EnquiryProduct;
  label: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  className?: string;
  iconRight?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const t = useTranslations("shop.enquiry");
  const tc = useTranslations();
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  return (
    <>
      <Button
        ref={trigger}
        type="button"
        variant={variant}
        size={size}
        className={className}
        iconRight={iconRight}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      {open && (
        <Modal open onClose={close} title={t("title")} closeLabel={tc("ui.close")}>
          <EnquiryForm product={product} />
        </Modal>
      )}
    </>
  );
}

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "done"; url: string } | { kind: "error"; message: string };

function EnquiryForm({ product }: { product: EnquiryProduct }) {
  const t = useTranslations("shop.enquiry");
  const locale = useLocale();
  // Rendered only after a click, i.e. after hydration — safe to read session drafts directly.
  const [name, setName] = useDraftField("shop-enquiry", "name", "");
  const [phone, setPhone] = useDraftField("shop-enquiry", "phone", "");
  const [problemSlug, setProblem] = useDraftField("shop-enquiry", "problem", "");
  const [note, setNote] = useDraftField("shop-enquiry", `note:${product.slug}:${product.presetNote ?? ""}`, product.presetNote ?? "");
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const payload = { productSlug: product.slug, name, phone, note: note || undefined, problemSlug: problemSlug || undefined, locale: locale === "en" ? ("en" as const) : ("hi" as const) };
  const errors = attempted ? enquiryFieldErrors(payload) : {};

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setAttempted(true);
    if (Object.keys(enquiryFieldErrors(payload)).length) {
      requestAnimationFrame(() => form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { whatsappUrl?: string; error?: string };
      if (res.ok && data.whatsappUrl) {
        setStatus({ kind: "done", url: data.whatsappUrl });
        setNote("");
        window.location.assign(data.whatsappUrl);
        return;
      }
      const key = res.status === 429 ? "rateLimit" : data.error === "product_not_seeded" || data.error === "unknown_product" ? "unavailable" : "server";
      setStatus({ kind: "error", message: t(`errors.${key}`) });
    } catch {
      setStatus({ kind: "error", message: t("errors.network") });
    }
  }

  if (status.kind === "done") {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-start gap-3">
        <p className="text-lg font-semibold text-ink-1">{t("successTitle")}</p>
        <p className="text-ink-2">{t("successBody")}</p>
        <a
          href={status.url}
          rel="noopener"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 font-semibold text-[#052e16] hover:bg-[#1EBE5A] focus-visible:ring-focus"
        >
          {t("openWhatsapp")}
        </a>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <p className="text-[15px] text-ink-2">{t("lead")}</p>
      <div className="rounded-md border border-line-subtle bg-night-s2 px-4 py-3">
        <p className="text-xs text-ink-3">{t("product")}</p>
        <p className="font-semibold text-ink-1">
          {product.title} <span className="text-xs font-normal text-ink-3">· SKU {product.sku}</span>
        </p>
      </div>
      <Field label={t("name")} required error={errors.name ? t("errors.name") : undefined}>
        {(id, d) => (
          <Input id={id} aria-describedby={d} aria-invalid={!!errors.name} autoComplete="name" placeholder={t("namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
        )}
      </Field>
      <Field label={t("phone")} required hint={t("phoneHint")} error={errors.phone ? t("errors.phone") : undefined}>
        {(id, d) => (
          <Input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-describedby={d}
            aria-invalid={!!errors.phone}
            placeholder={t("phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        )}
      </Field>
      <Field label={t("problem")}>
        {(id) => (
          <Select id={id} value={problemSlug} onChange={(e) => setProblem(e.target.value)}>
            <option value="">{t("problemNone")}</option>
            {PROBLEMS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {pick(p.title, locale)}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label={t("note")} error={errors.note ? t("errors.note") : undefined}>
        {(id, d) => (
          <Textarea id={id} aria-describedby={d} aria-invalid={!!errors.note} maxLength={1000} placeholder={t("notePlaceholder")} value={note} onChange={(e) => setNote(e.target.value)} />
        )}
      </Field>
      <div aria-live="polite">
        {status.kind === "error" && (
          <p role="alert" className="rounded-md bg-error/12 px-4 py-3 text-sm text-error">
            {status.message}
          </p>
        )}
      </div>
      <Button type="submit" variant="whatsapp" size="lg" className="w-full justify-center" loading={status.kind === "sending"} loadingLabel={t("sending")}>
        {t("submit")}
      </Button>
      <p className="text-center text-xs text-ink-3">{t("privacy")}</p>
    </form>
  );
}
