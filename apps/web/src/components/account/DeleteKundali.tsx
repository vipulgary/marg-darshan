"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useRouter } from "@/i18n/navigation";
import { api } from "./api";

/** Delete button for a kundali card (asks first). */
export function DeleteKundali({ id }: { id: string }) {
  const t = useTranslations("account.kundalis");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm(t("deleteConfirm"))) return;
        setBusy(true);
        await api(`/api/account/kundalis/${id}`, "DELETE");
        router.refresh();
      }}
      className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-3 transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50 focus-visible:ring-focus"
    >
      <Icon name="x" size={16} animate="none" /> {t("delete")}
    </button>
  );
}
