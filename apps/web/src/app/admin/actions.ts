"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { endSession, requireAdmin, roleForPassword, startSession, adminConfigured } from "@/lib/admin/auth";
import { type AppointmentEvent, canTransition, transition } from "@/lib/booking/machine";
import { db } from "@/lib/db";
import { issueInvoiceForPayment } from "@/lib/invoice/issue";
import { rateLimit } from "@/lib/admin/throttle";
import { SETTINGS_TAG, SettingsUnavailableError, saveSettings } from "@/lib/settings";
import { type SettingsFormState, flattenSettings, formValuesFrom, parseSettingsForm } from "@/lib/settings/schema";

export async function login(formData: FormData) {
  if (!adminConfigured()) redirect("/admin/login?error=config");
  // Slow down password guessing: 5 attempts / 15 min per server instance.
  if (!rateLimit("admin-login", 5, 15 * 60_000)) redirect("/admin/login?error=throttled");
  const role = roleForPassword(String(formData.get("password") ?? ""));
  if (!role) redirect("/admin/login?error=invalid");
  await startSession(role);
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

const STAFF_EVENTS: AppointmentEvent[] = ["COMPLETE", "NO_SHOW", "CANCEL"];

export async function changeStatus(formData: FormData) {
  await requireAdmin("jyotish");
  const id = String(formData.get("id"));
  const event = String(formData.get("event")) as AppointmentEvent;
  if (!STAFF_EVENTS.includes(event)) throw new Error("event not allowed from admin");
  await db.$transaction(async (tx) => {
    const appt = await tx.appointment.findUniqueOrThrow({ where: { id }, select: { status: true } });
    if (!canTransition(appt.status, event)) throw new Error(`cannot ${event} from ${appt.status}`);
    await tx.appointment.update({ where: { id }, data: { status: transition(appt.status, event) } });
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/appointments/${id}`);
}

export async function saveNotes(formData: FormData) {
  await requireAdmin("jyotish");
  const id = String(formData.get("id"));
  const notes = String(formData.get("notes") ?? "").slice(0, 10_000);
  await db.appointment.update({ where: { id }, data: { sessionNotes: notes || null } });
  revalidatePath(`/admin/appointments/${id}`);
}

export async function issueInvoice(formData: FormData) {
  await requireAdmin("admin");
  const paymentId = String(formData.get("paymentId"));
  const state = String(formData.get("stateCode") ?? "").trim() || undefined;
  await issueInvoiceForPayment(paymentId, state);
  revalidatePath("/admin/payments");
}

/** AMX-143: validate + persist business settings, then expire the cached rows everywhere. */
export async function saveBusinessSettings(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const { role } = await requireAdmin("admin");
  const parsed = parseSettingsForm(formData);
  const submittedAt = Date.now();
  if (!parsed.ok) {
    return {
      status: "error",
      message: "Some fields need attention. Nothing was saved.",
      fieldErrors: parsed.fieldErrors,
      values: formValuesFrom(formData),
      submittedAt,
    };
  }
  try {
    await saveSettings(parsed.value, role);
  } catch (e) {
    const message =
      e instanceof SettingsUnavailableError ? e.message : "Couldn't save settings — the database is unavailable. Try again shortly.";
    if (!(e instanceof SettingsUnavailableError)) console.error("[admin] saving settings failed", e);
    return { status: "error", message, values: formValuesFrom(formData), submittedAt };
  }
  updateTag(SETTINGS_TAG);
  // Prerendered public pages (contact, payment, policies) read settings too.
  revalidatePath("/", "layout");
  return { status: "success", message: "Settings saved. The site now uses the new values.", values: flattenSettings(parsed.value), submittedAt };
}
