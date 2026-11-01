import type { AuthTokenPurpose } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/notifications/email";
import { localePrefix, siteUrl } from "./http";
import { RESET_TTL_MS, VERIFY_TTL_MS, expiresIn, hashToken, newToken } from "./tokens";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Issues a fresh single-use link token; older unused ones of the same purpose are invalidated. */
async function issue(clientId: string, purpose: AuthTokenPurpose): Promise<string> {
  const token = newToken();
  await db.$transaction([
    db.authToken.updateMany({ where: { clientId, purpose, usedAt: null }, data: { usedAt: new Date() } }),
    db.authToken.create({
      data: { clientId, purpose, tokenHash: hashToken(token), expiresAt: expiresIn(purpose === "VERIFY_EMAIL" ? VERIFY_TTL_MS : RESET_TTL_MS) },
    }),
  ]);
  return token;
}

const COPY = {
  verify: {
    hi: { subject: "अपना ईमेल सत्यापित करें — Marg Darshan", lead: "अपना Marg Darshan खाता शुरू करने के लिए नीचे दिए लिंक पर क्लिक करें (24 घंटे तक मान्य)।", cta: "ईमेल सत्यापित करें" },
    en: { subject: "Verify your email — Marg Darshan", lead: "Click the link below to activate your Marg Darshan account (valid for 24 hours).", cta: "Verify email" },
  },
  reset: {
    hi: { subject: "पासवर्ड रीसेट — Marg Darshan", lead: "पासवर्ड बदलने के लिए नीचे दिए लिंक का उपयोग करें (1 घंटे तक मान्य)। अगर आपने यह अनुरोध नहीं किया, तो इस ईमेल को अनदेखा करें।", cta: "नया पासवर्ड सेट करें" },
    en: { subject: "Reset your password — Marg Darshan", lead: "Use the link below to choose a new password (valid for 1 hour). If you didn't ask for this, ignore this email.", cta: "Set a new password" },
  },
  exists: {
    hi: { subject: "आपका Marg Darshan खाता पहले से है", lead: "इस ईमेल से किसी ने नया खाता बनाने की कोशिश की, पर आपका खाता पहले से मौजूद है। पासवर्ड भूल गए हों तो यहाँ रीसेट करें:", cta: "पासवर्ड रीसेट करें" },
    en: { subject: "You already have an Marg Darshan account", lead: "Someone tried to sign up with this email, but you already have an account. If you forgot your password, reset it here:", cta: "Reset password" },
  },
} as const;

function render(kind: keyof typeof COPY, lang: "hi" | "en", url: string) {
  const c = COPY[kind][lang];
  const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:24px;color:#1b1530">
<h2 style="margin:0 0 12px">Marg Darshan</h2><p>${esc(c.lead)}</p>
<p><a href="${esc(url)}" style="display:inline-block;background:#f0a830;color:#1b1530;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">${esc(c.cta)}</a></p>
<p style="font-size:12px;color:#666;word-break:break-all">${esc(url)}</p></div>`;
  return { subject: c.subject, html, text: `${c.lead}\n\n${c.cta}: ${url}\n` };
}

export async function sendVerifyEmail(client: { id: string; email: string }, lang: "hi" | "en") {
  const token = await issue(client.id, "VERIFY_EMAIL");
  const url = `${siteUrl()}${localePrefix(lang)}/verify-email?token=${token}`;
  await sendEmail({ to: client.email, ...render("verify", lang, url), template: "account_verify", entityId: client.id });
}

export async function sendResetEmail(client: { id: string; email: string }, lang: "hi" | "en", kind: "reset" | "exists" = "reset") {
  const token = await issue(client.id, "RESET_PASSWORD");
  const url = `${siteUrl()}${localePrefix(lang)}/reset-password?token=${token}`;
  await sendEmail({ to: client.email, ...render(kind, lang, url), template: kind === "reset" ? "account_reset" : "account_exists", entityId: client.id });
}

/** Marks the link used and returns its client, or null when unknown/expired/used. Atomic per token. */
export async function consumeToken(token: string, purpose: AuthTokenPurpose): Promise<string | null> {
  if (!token || token.length > 100) return null;
  const now = new Date();
  const tokenHash = hashToken(token);
  const { count } = await db.authToken.updateMany({ where: { tokenHash, purpose, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } });
  if (!count) return null;
  const row = await db.authToken.findUnique({ where: { tokenHash }, select: { clientId: true } });
  return row?.clientId ?? null;
}
