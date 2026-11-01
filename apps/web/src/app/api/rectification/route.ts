import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { todayIST } from "@/lib/rectification/events";
import { buildBirthProfileData, rectificationSchema } from "@/lib/rectification/schema";
import { normalizeIndianMobile } from "@/lib/shop/phone";

const HOUR_MS = 60 * 60 * 1000;

const fail = (status: number, error: string, message: string, extra?: Record<string, unknown>) =>
  NextResponse.json({ error, message, ...extra }, { status });

/**
 * AMX-130/131 (web side) — store the rectification questionnaire as a BirthProfile and hand
 * back its id; the client continues to /book-appointment?problem=birth-time-unknown&profile=<id>.
 */
export async function POST(req: Request) {
  const rl = rateLimit(`rectification:${clientIp(req)}`, 5, HOUR_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many submissions, try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "invalid_json", "Request body must be JSON.");
  }
  // Prashna time is the server's clock at submission, not whatever the browser claims.
  const now = new Date();
  const today = todayIST(now);
  const parsed = rectificationSchema(today).safeParse(body);
  if (!parsed.success) {
    return fail(400, "invalid", "Invalid questionnaire.", {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  if (!process.env.DATABASE_URL) return fail(503, "db_unavailable", "Database is not configured.");

  const { contact, locale } = parsed.data;
  const email = contact.email.trim().toLowerCase();
  const phone = normalizeIndianMobile(contact.phone)!;
  const profileData = buildBirthProfileData(parsed.data, now, today);

  try {
    const profileId = await db.$transaction(async (tx) => {
      const existing =
        (await tx.client.findUnique({ where: { email } })) ??
        (await tx.client.findFirst({ where: { whatsappPhone: phone }, orderBy: { createdAt: "asc" } }));
      const client = existing
        ? await tx.client.update({
            where: { id: existing.id },
            // Fill gaps only; never overwrite details a returning client already gave us.
            data: { email: existing.email ?? email, whatsappPhone: existing.whatsappPhone ?? phone, preferredLang: locale },
            select: { id: true },
          })
        : await tx.client.create({
            data: { fullName: contact.name, email, whatsappPhone: phone, preferredLang: locale },
            select: { id: true },
          });

      const profile = await tx.birthProfile.create({
        data: { clientId: client.id, ...profileData, lifeEvents: profileData.lifeEvents as unknown as Prisma.InputJsonArray },
        select: { id: true },
      });
      if (!profileData.isDateUnknown) {
        // TODO(AMX-131): enqueue the engine's rectify_scan_task (Celery) for this QUEUED scan; the
        // worker fills candidates_json and sends the dossier PDF to the Jyotish — never to the client.
        await tx.rectificationScan.create({ data: { birthProfileId: profile.id, status: "QUEUED" } });
      }
      return profile.id;
    });
    return NextResponse.json({ profileId }, { status: 201 });
  } catch (err) {
    console.error("[api/rectification] failed", err);
    return fail(500, "server_error", "Could not save the questionnaire.");
  }
}
