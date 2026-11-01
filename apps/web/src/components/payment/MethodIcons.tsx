import { useTranslations } from "next-intl";
import { Icon } from "@/components/icons";

export function LockIcon({ className }: { className?: string }) {
  return <Icon name="lock" size={16} className={className} />;
}

/** Text badges rather than brand logos (no image assets yet); UPI apps first, as on mobile. */
export function MethodIcons() {
  const t = useTranslations("payment");
  const methods = [
    { key: "upi", label: t("methodUpi"), dot: "#097939" },
    { key: "gpay", label: t("methodGpay"), dot: "#4285F4" },
    { key: "phonepe", label: t("methodPhonepe"), dot: "#5F259F" },
    { key: "nb", label: t("methodNetbanking"), dot: "#B45309" },
    { key: "cards", label: t("methodCards"), dot: "#1A1F71" },
  ];
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">{t("methods")}</p>
      <ul className="flex flex-wrap gap-2">
        {methods.map((m) => (
          <li
            key={m.key}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-line bg-night-s1 px-2.5 text-[13px] font-semibold text-ink-2"
          >
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: m.dot }} />
            {m.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
