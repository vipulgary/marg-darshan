import { NextResponse } from "next/server";
import { newsletterSchema } from "@/components/newsletter/schema";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { normalizeIndianMobile } from "@/lib/shop/phone";
import { listmonkConfig, listmonkSubscribe } from "./listmonk";

const HOUR_MS = 60 * 60 * 1000;

const fail = (status: number, error: string, message: string) => NextResponse.json({ error, message }, { status });

/** AMX-120 — subscribe with double opt-in. ACTIVE subscribers stay ACTIVE. */
export async function POST(req: Request) {
  const rl = rateLimit(`newsletter:${clientIp(req)}`, 6, HOUR_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many attempts." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "invalid_json", "Request body must be JSON.");
  }
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) return fail(400, "invalid", "Invalid email or WhatsApp number.");
  const { locale, website } = parsed.data;
  // Bots fill the hidden field: pretend success, store nothing.
  if (website) return NextResponse.json({ ok: true, status: "pending" });
  if (!process.env.DATABASE_URL) return fail(503, "db_unavailable", "Database is not configured.");

  const email = parsed.data.email.trim().toLowerCase();
  const whatsappPhone = parsed.data.whatsapp ? normalizeIndianMobile(parsed.data.whatsapp) : null;

  try {
    const existing = await db.newsletterSub.findUnique({ where: { email } });
    if (existing?.status === "ACTIVE") {
      if (whatsappPhone && whatsappPhone !== existing.whatsappPhone) {
        await db.newsletterSub.update({ where: { id: existing.id }, data: { whatsappPhone } });
      }
      return NextResponse.json({ ok: true, status: "active" });
    }
    const sub = existing
      ? await db.newsletterSub.update({
          where: { id: existing.id },
          data: { status: "PENDING", language: locale, whatsappPhone: whatsappPhone ?? existing.whatsappPhone },
        })
      : await db.newsletterSub.create({ data: { email, whatsappPhone, language: locale, status: "PENDING" } });

    const cfg = listmonkConfig();
    if (cfg) {
      await listmonkSubscribe(cfg, { email, language: locale, whatsapp: whatsappPhone });
    } else {
      const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? new URL(req.url).origin;
      console.info(`[newsletter] Listmonk not configured — confirm link for ${email}: ${origin}/api/newsletter/confirm?token=${sub.token}`);
    }
    return NextResponse.json({ ok: true, status: "pending" });
  } catch (err) {
    console.error("[api/newsletter] failed", err);
    return fail(502, "optin_failed", "Could not start the subscription.");
  }
}
