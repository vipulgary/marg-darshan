import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { DeleteKundali } from "./DeleteKundali";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui/Display";
import { Link } from "@/i18n/navigation";
import type { BookingRow, KundaliRow } from "@/lib/account/queries";
import { formatDateIST, formatSlotRange } from "@/lib/format";
import { manageUrl } from "@/lib/manage/links";
import { goldLink, pillLink } from "./ui-parts";

export function PageHead({ eyebrow, title, lead, action }: { eyebrow?: string; title: string; lead?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        {eyebrow && (
          <p className="flex items-center gap-2 text-[13px] font-semibold text-gold-300">
            <Icon name="sparkle" size={14} animate="draw" />
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[clamp(28px,3.6vw,40px)] leading-tight text-ink-1">{title}</h1>
        {lead && <p className="max-w-[60ch] text-ink-2">{lead}</p>}
      </div>
      {action}
    </header>
  );
}

export { Empty, goldLink, pillLink } from "./ui-parts";

const statusTone = { DONE: "success", FAILED: "error", QUEUED: "neutral", RUNNING: "violet" } as const;

export async function KundaliCard({ k, locale }: { k: KundaliRow; locale: string }) {
  const t = await getTranslations("account.kundalis");
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-line bg-night-s1 p-5 shadow-e1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-ink-1">{k.name || "—"}</p>
          <p className="truncate text-sm text-ink-3">
            {k.dob && formatDateIST(`${k.dob}T12:00:00Z`, locale, { day: "numeric", month: "short", year: "numeric" })} · {k.placeName}
          </p>
        </div>
        <Badge tone={statusTone[k.status]}>{t(`status.${k.status}`)}</Badge>
      </div>
      <p className="text-xs text-ink-3">{t("created", { date: formatDateIST(k.createdAt, locale, { day: "numeric", month: "short", year: "numeric" }) })}</p>
      <div className="flex flex-wrap gap-2">
        <Link href={`/kundali/${k.id}`} className={pillLink}>
          <Icon name="kundali" size={16} animate="none" /> {t("open")}
        </Link>
        {k.status === "DONE" && (
          <Link href={`/kundali/${k.id}/print`} className={pillLink}>
            <Icon name="printer" size={16} animate="none" /> {t("print")}
          </Link>
        )}
        <DeleteKundali id={k.id} />
      </div>
    </li>
  );
}

const bookingTone: Record<string, "success" | "warning" | "neutral" | "error" | "gold"> = {
  CONFIRMED: "success",
  PARTIALLY_PAID: "gold",
  HELD: "warning",
  PENDING_PAYMENT: "warning",
  COMPLETED: "neutral",
  CANCELLED: "error",
  REFUNDED: "neutral",
  NO_SHOW: "error",
};

export async function BookingCard({ b, locale, upcoming }: { b: BookingRow; locale: string; upcoming: boolean }) {
  const t = await getTranslations("account.bookings");
  const manage = upcoming && ["CONFIRMED", "PARTIALLY_PAID"].includes(b.status) ? manageUrl(b.id, locale, b.slotStart) : null;
  const payable = upcoming && ["HELD", "PENDING_PAYMENT", "PARTIALLY_PAID"].includes(b.status);
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-line bg-night-s1 p-5 shadow-e1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-ink-1">{b.serviceTitle}</p>
          <p className="text-sm text-ink-2">{b.problemTitle}</p>
        </div>
        <Badge tone={bookingTone[b.status] ?? "neutral"}>{t(`status.${b.status}`)}</Badge>
      </div>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="calendar" size={16} animate="none" />
          {formatDateIST(b.slotStart, locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="clock" size={16} animate="none" />
          {formatSlotRange(b.slotStart, b.slotEnd, locale)} · {t("minutes", { count: b.durationMin })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name={b.mode === "ONLINE_ZOOM" ? "video" : "map-pin"} size={16} animate="none" />
          {b.mode === "ONLINE_ZOOM" ? t("online") : t("visit")}
        </span>
      </p>
      {(manage || payable || (upcoming && b.zoomUrl)) && (
        <div className="flex flex-wrap gap-2">
          {upcoming && b.zoomUrl && b.status === "CONFIRMED" && (
            <a href={b.zoomUrl} target="_blank" rel="noopener noreferrer" className={goldLink}>
              <Icon name="video" size={16} animate="none" /> {t("join")}
            </a>
          )}
          {payable && (
            <Link href={`/payment/${b.id}`} className={goldLink}>
              {t("pay")}
            </Link>
          )}
          {manage && (
            <a href={manage} className={pillLink}>
              <Icon name="calendar" size={16} animate="none" /> {t("manage")}
            </a>
          )}
        </div>
      )}
    </li>
  );
}
