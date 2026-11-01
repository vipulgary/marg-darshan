"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { api, go } from "@/components/account/api";
import { useViewer } from "@/components/account/useViewer";
import { Icon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "•";

/** Header account entry: "Log in" when signed out, an avatar menu (My account / Sign out) when signed in. */
export function AccountButton({ className, block = false }: { className?: string; block?: boolean }) {
  const t = useTranslations("account.menu");
  const locale = useLocale();
  const viewer = useViewer();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  // Reserve the slot while the session check runs so the header doesn't jump.
  if (viewer === undefined) return <span aria-hidden className={cn("inline-block h-9 w-9", block && "h-12 w-full", className)} />;

  if (!viewer) {
    return (
      <Link
        href="/login"
        className={cn(
          "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-3 text-sm font-semibold text-ink-1 transition-colors hover:border-line-gold hover:text-gold-300 focus-visible:ring-focus",
          block && "h-12 w-full justify-center text-base",
          className,
        )}
      >
        <Icon name="user" size={16} /> {t("login")}
      </Link>
    );
  }

  if (block) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <Link href="/account" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line-gold text-base font-semibold text-gold-300 focus-visible:ring-focus">
          <Icon name="user" size={18} /> {t("myAccount")}
        </Link>
        <button
          type="button"
          onClick={async () => {
            await api("/api/auth/logout", "POST");
            go(locale, "/");
          }}
          className="h-11 rounded-full text-sm text-ink-3 hover:text-ink-1 focus-visible:ring-focus"
        >
          {t("signOut")}
        </button>
      </div>
    );
  }

  const name = viewer.client.name;
  return (
    <div ref={wrap} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={`${t("open")}: ${name}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-grad-gold text-sm font-bold text-ink-ongold before:absolute before:-inset-1 before:content-[''] focus-visible:ring-focus"
      >
        {viewer.client.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote Google avatar, tiny, no optimisation needed
          <img src={viewer.client.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initials(name)
        )}
      </button>
      {open && (
        <div id={menuId} className="md-panel absolute right-0 top-[calc(100%+10px)] z-50 w-56 rounded-md border border-line bg-night-s1 p-1.5 shadow-e2">
          <p className="truncate px-3 py-2 text-sm font-semibold text-ink-1">{name}</p>
          <Link href="/account" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-2 rounded-sm px-3 text-sm text-ink-2 hover:bg-night-s3 hover:text-ink-1 focus-visible:ring-focus">
            <Icon name="user" size={16} /> {t("myAccount")}
          </Link>
          <button
            type="button"
            onClick={async () => {
              await api("/api/auth/logout", "POST");
              go(locale, "/");
            }}
            className="flex min-h-11 w-full items-center gap-2 rounded-sm px-3 text-left text-sm text-ink-2 hover:bg-night-s3 hover:text-ink-1 focus-visible:ring-focus"
          >
            <Icon name="arrow-right" size={16} /> {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
