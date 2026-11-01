"use client";

import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { UPLOAD_ACCEPT, precheckUpload } from "@/lib/booking/upload";
import { cn } from "@/lib/cn";
import { useBookingStore } from "@/stores/booking";
import { Icon } from "@/components/icons";

type Status = { kind: "idle" } | { kind: "uploading"; progress: number } | { kind: "error"; code: string };

/** design.md §5.8 drop zone with progress; XHR because fetch has no upload progress. */
export function FloorPlanUpload() {
  const t = useTranslations("booking.upload");
  const id = useId();
  const floorPlan = useBookingStore((s) => s.floorPlan);
  const update = useBookingStore((s) => s.update);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function upload(file: File) {
    const pre = precheckUpload(file);
    if (pre) return setStatus({ kind: "error", code: pre });
    const form = new FormData();
    form.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads/floor-plan");
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => e.lengthComputable && setStatus({ kind: "uploading", progress: Math.round((e.loaded / e.total) * 100) });
    xhr.onerror = () => setStatus({ kind: "error", code: "network" });
    xhr.onload = () => {
      const body = xhr.response as { url?: string; error?: string } | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.url) {
        update({ floorPlan: { url: body.url, name: file.name, size: file.size, type: file.type } });
        setPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
        setStatus({ kind: "idle" });
      } else {
        const code = body?.error === "too_large" ? "tooLarge" : body?.error === "bad_type" ? "badType" : body?.error === "rate_limited" ? "rateLimited" : "failed";
        setStatus({ kind: "error", code });
      }
    };
    setStatus({ kind: "uploading", progress: 0 });
    xhr.send(form);
  }

  function remove() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    update({ floorPlan: null });
    if (inputRef.current) inputRef.current.value = "";
  }

  if (floorPlan)
    return (
      <div className="flex items-center gap-3 rounded-lg border border-line-gold bg-saffron-500/8 p-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
          <img src={preview} alt="" className="h-12 w-12 rounded-sm object-cover" />
        ) : (
          <span aria-hidden className="grid h-12 w-12 place-items-center rounded-sm bg-night-s3 text-xs font-bold text-gold-300">
            {floorPlan.name.split(".").pop()?.toUpperCase()}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink-1">{floorPlan.name}</span>
          <span className="text-xs text-ink-3">{t("done", { size: (floorPlan.size / 1024 / 1024).toFixed(1) })}</span>
        </span>
        <button
          type="button"
          onClick={remove}
          aria-label={t("remove", { name: floorPlan.name })}
          className="grid h-11 w-11 place-items-center rounded-full text-ink-3 hover:bg-white/6 hover:text-ink-1 focus-visible:ring-focus"
        >
          <Icon name="x" size={18} />
        </button>
      </div>
    );

  const uploading = status.kind === "uploading";
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) upload(f);
        }}
        className={cn(
          "flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-line px-4 text-center transition-colors",
          "hover:border-line-hover has-focus-visible:ring-focus",
          dragging && "border-saffron-400 bg-saffron-500/8",
          uploading && "pointer-events-none",
        )}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-8 w-8 text-gold-300" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[15px] font-medium text-ink-1">{t("cta")}</span>
        <span className="text-xs text-ink-3">{t("hint")}</span>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={UPLOAD_ACCEPT}
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
      </label>
      <div aria-live="polite">
        {uploading && (
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-night-s3" role="progressbar" aria-valuenow={status.progress} aria-valuemin={0} aria-valuemax={100} aria-label={t("uploading")}>
              <div className="h-full bg-grad-gold transition-[width]" style={{ width: `${status.progress}%` }} />
            </div>
            <span className="text-xs tabular-nums text-ink-2">{status.progress}%</span>
          </div>
        )}
        {status.kind === "error" && (
          <p role="alert" className="flex items-center gap-1.5 text-[13px] text-error">
            <Icon name="alert-triangle" size={14} animate="none" />
            {t(`errors.${status.code}`)}
          </p>
        )}
      </div>
    </div>
  );
}
