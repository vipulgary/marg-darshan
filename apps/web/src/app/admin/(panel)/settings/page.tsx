import { connection } from "next/server";
import { Badge } from "@/components/ui/Display";
import { requireAdmin } from "@/lib/admin/auth";
import { type SettingsSource, flattenSettings, loadSettingsForAdmin } from "@/lib/settings";
import { fmtDateTime } from "../../_lib/fmt";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings" };

const INTEGRATIONS: [string, string[]][] = [
  ["Database", ["DATABASE_URL"]],
  ["Astro engine", ["ENGINE_URL", "ENGINE_KEY"]],
  ["Razorpay", ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"]],
  ["Zoom", ["ZOOM_ACCOUNT_ID", "ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET"]],
  ["Cal.com", ["CALCOM_API_URL", "CALCOM_API_KEY"]],
  ["Email (Resend)", ["RESEND_API_KEY"]],
  ["Newsletter (Listmonk)", ["LISTMONK_URL", "LISTMONK_USER", "LISTMONK_PASSWORD"]],
  ["Storage (R2)", ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"]],
  ["GST invoices", ["GST_REGISTERED", "BUSINESS_GSTIN", "BUSINESS_STATE_CODE"]],
];

const SOURCE: Record<SettingsSource, { tone: "success" | "neutral" | "warning" | "error"; label: string; note: string }> = {
  db: { tone: "success", label: "Saved values", note: "The site uses the values below." },
  defaults: { tone: "neutral", label: "Defaults", note: "Nothing saved yet — the site uses the built-in defaults below." },
  not_configured: { tone: "warning", label: "No database", note: "DATABASE_URL is not set, so settings can't be saved. The site uses the built-in defaults." },
  error: { tone: "error", label: "Database unavailable", note: "Saved settings couldn't be loaded; the site is falling back to the built-in defaults." },
};

export default async function SettingsPage() {
  await requireAdmin("admin");
  await connection();
  const view = await loadSettingsForAdmin();
  const source = SOURCE[view.source];

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl">Settings</h1>
          <Badge tone={source.tone}>{source.label}</Badge>
        </div>
        <p className="text-sm text-ink-3">
          {source.note}
          {view.lastUpdated && ` Last saved ${fmtDateTime(new Date(view.lastUpdated.at))} IST${view.lastUpdated.by ? ` by ${view.lastUpdated.by}` : ""}.`}
        </p>
        {view.invalid.length > 0 && (
          <p role="alert" className="text-sm text-warning">
            Some saved values were invalid and are being ignored: {view.invalid.join(", ")}. Saving the form fixes them.
          </p>
        )}
      </div>

      <SettingsForm initial={flattenSettings(view.settings)} canSave={view.source !== "not_configured"} />

      <section aria-labelledby="integrations">
        <h2 id="integrations" className="mb-3 text-base">
          Integrations
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {INTEGRATIONS.map(([name, keys]) => {
            const ok = keys.every((k) => Boolean(process.env[k]));
            return (
              <li key={name} className="flex items-center justify-between rounded-md border border-line bg-night-s1 px-4 py-3 text-sm">
                {name}
                <Badge tone={ok ? "success" : "warning"}>{ok ? "Configured" : "Missing env"}</Badge>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
