"use client";

import { type ReactNode, createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";

/* ---------- Tabs (design.md §6.4) ---------- */
export function Tabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const group = useId();
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setActive(tabs[next].id);
    document.getElementById(`${group}-tab-${tabs[next].id}`)?.focus();
  };
  return (
    <div>
      <div role="tablist" className="flex gap-6 border-b border-line-subtle">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            id={`${group}-tab-${t.id}`}
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`${group}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "relative pb-3 text-[15px] font-medium transition-colors focus-visible:ring-focus rounded-sm",
              active === t.id ? "text-gold-300" : "text-ink-2 hover:text-ink-1",
            )}
          >
            {t.label}
            {active === t.id && (
              <motion.span layoutId={`${group}-bar`} className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-grad-gold" />
            )}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} id={`${group}-panel-${t.id}`} role="tabpanel" hidden={active !== t.id} className="pt-5">
          {t.content}
        </div>
      ))}
    </div>
  );
}

/* ---------- Modal / bottom sheet (design.md §8) ---------- */
export function Modal({
  open,
  onClose,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="modal-title"
      className={cn(
        "m-0 mt-auto w-full max-w-none rounded-t-xl border border-line bg-night-s1 p-0 text-ink-2 shadow-e3",
        "md:m-auto md:max-w-[560px] md:rounded-xl",
        "backdrop:bg-night-0/70 backdrop:backdrop-blur-[6px]",
        "open:animate-[modal-in_.2s_var(--ease-out)]",
      )}
    >
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-night-s3 md:hidden" aria-hidden />
      <div className="flex items-start justify-between gap-4 p-6 pb-2">
        <h2 id="modal-title" className="text-xl">
          {title}
        </h2>
        <button
          onClick={onClose}
          aria-label={closeLabel}
          className="grid h-11 w-11 place-items-center rounded-full text-ink-3 hover:bg-white/6 hover:text-ink-1 focus-visible:ring-focus"
        >
          <Icon name="x" size={18} />
        </button>
      </div>
      <div className="p-6 pt-2">{children}</div>
      <style>{`@keyframes modal-in{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}`}</style>
    </dialog>
  );
}

/* ---------- Toast (design.md §8) ---------- */
type ToastTone = "success" | "warning" | "error" | "info";
type ToastItem = { id: number; message: string; tone: ToastTone };
const ToastCtx = createContext<(message: string, tone?: ToastTone) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

const bar: Record<ToastTone, string> = { success: "bg-success", warning: "bg-warning", error: "bg-error", info: "bg-info" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, tone: ToastTone = "success") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, message, tone }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 md:inset-x-auto md:right-6 md:top-24 md:bottom-auto md:items-end"
      >
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto flex min-w-[260px] max-w-sm overflow-hidden rounded-md border border-line bg-night-s1/90 shadow-e2 backdrop-blur-xl"
          >
            <span className={cn("w-1 shrink-0", bar[t.tone])} />
            <p className="px-4 py-3 text-sm text-ink-1">{t.message}</p>
          </motion.div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
