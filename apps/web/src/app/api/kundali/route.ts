import { NextResponse, after } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import type { BirthInput } from "@/lib/contracts";
import { db } from "@/lib/db";
import { computeHoroscope, isEngineConfigured } from "@/lib/engine/client";
import { normalizedInputHash } from "@/lib/kundali/hash";
import { fieldErrors, kundaliRequestSchema, normalizeIndianPhone } from "@/lib/kundali/schema";
import { type KundaliSubject, type StoredChart, isDbConfigured } from "@/lib/kundali/store";
import { verifyTurnstile } from "@/lib/kundali/turnstile";
import { getCurrentClient } from "@/lib/auth/session";
import { absoluteUrl } from "@/lib/notifications/confirm";
import { sendEmail } from "@/lib/notifications/email";
import { kundaliReadyEmail } from "@/lib/notifications/templates";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Transit-dependent parts (Sade Sati, running dasha) go stale, so cached charts expire.
const CACHE_MAX_AGE_MS = 30 * 86_400_000;

const sameName = (a: string | undefined, b: string) => (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();

function json(body: unknown, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export async function POST(req: Request) {
  const ip = clientIp(req);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const parsed = kundaliRequestSchema.safeParse(raw);
  if (!parsed.success) return json({ error: "validation", fields: fieldErrors(parsed.error) }, 400);
  const data = parsed.data;

  const limit = rateLimit(`kundali:${ip}`, 5, 3_600_000);
  if (!limit.ok) {
    return json({ error: "rate_limited", retryAfterSec: limit.retryAfterSec }, 429, { "Retry-After": String(limit.retryAfterSec) });
  }

  if (!isDbConfigured()) return json({ error: "unavailable", message: "DATABASE_URL is not configured" }, 503);
  if (!(await verifyTurnstile(data.turnstileToken, ip))) return json({ error: "captcha_failed" }, 403);

  const input: BirthInput = { name: data.name, gender: data.gender, dob: data.dob, tob: data.tob, place: data.place, lang: data.lang };
  const inputHash = normalizedInputHash(input);
  const email = data.email.trim().toLowerCase();
  const whatsappPhone = normalizeIndianPhone(data.whatsapp);
  const subject: KundaliSubject = {
    name: data.name,
    gender: data.gender,
    dob: data.dob,
    tob: data.tob,
    placeName: data.place.placeName,
    latitude: data.place.latitude,
    longitude: data.place.longitude,
    tzName: data.place.tzName,
  };

  try {
    // Signed in: the chart always lands in that account, whatever email was typed.
    const me = await getCurrentClient();
    const client = me
      ? { id: me.id }
      : await db.client.upsert({
          where: { email },
          create: { fullName: data.name, email, whatsappPhone, preferredLang: data.lang },
          // Don't overwrite the account holder's name: people often make charts for family members.
          update: whatsappPhone ? { whatsappPhone } : {},
        });

    const newProfile = () =>
      db.birthProfile.create({
        data: {
          clientId: client.id,
          fullName: data.name,
          gender: data.gender,
          dob: new Date(`${data.dob}T00:00:00Z`),
          tob: new Date(`1970-01-01T${data.tob}:00Z`),
          placeName: data.place.placeName,
          latitude: data.place.latitude,
          longitude: data.place.longitude,
          tzName: data.place.tzName,
        },
      });

    // Signed in and already have this person's kundali (same birth date/time/place)? Reuse it —
    // clicking "make kundali" again must not create duplicates. Outdated charts are refreshed in place.
    if (me) {
      const mine = await db.horoscope.findFirst({
        where: { inputHash, status: "DONE", birthProfile: { clientId: me.id } },
        orderBy: { createdAt: "desc" },
        select: { id: true, chartJson: true, chartStyle: true },
      });
      const chart = mine?.chartJson as StoredChart | null | undefined;
      if (mine && chart?.ascendant) {
        if ((chart.calc_version ?? 0) < 3 && isEngineConfigured()) {
          const { vargas, ...fresh } = await computeHoroscope(input);
          await db.horoscope.update({
            where: { id: mine.id },
            data: {
              chartJson: { ...fresh, subject } as unknown as Prisma.InputJsonValue,
              vargasJson: vargas ? (vargas as unknown as Prisma.InputJsonValue) : undefined,
              yogasDoshas: fresh.yogas_doshas ? (fresh.yogas_doshas as unknown as Prisma.InputJsonValue) : undefined,
            },
          });
        }
        if (mine.chartStyle !== data.chartStyle) await db.horoscope.update({ where: { id: mine.id }, data: { chartStyle: data.chartStyle } });
        return json({ id: mine.id, cached: true });
      }
    }

    const cached = await db.horoscope.findFirst({
      where: { inputHash, status: "DONE", createdAt: { gte: new Date(Date.now() - CACHE_MAX_AGE_MS) } },
      orderBy: { createdAt: "desc" },
      include: { birthProfile: { select: { clientId: true } } },
    });
    const cachedChart = cached?.chartJson as StoredChart | null | undefined;
    if (cached && cachedChart?.ascendant) {
      if (cached.birthProfile.clientId === client.id && sameName(cachedChart.subject?.name, data.name)) {
        if (cached.chartStyle !== data.chartStyle) {
          await db.horoscope.update({ where: { id: cached.id }, data: { chartStyle: data.chartStyle } });
        }
        return json({ id: cached.id, cached: true });
      }
      // Same birth moment for someone else: reuse the computation, never another person's row.
      const profile = await newProfile();
      const copy = await db.horoscope.create({
        data: {
          birthProfileId: profile.id,
          inputHash,
          lang: data.lang,
          chartStyle: data.chartStyle,
          status: "DONE",
          chartJson: { ...cachedChart, subject } as unknown as Prisma.InputJsonValue,
          vargasJson: cached.vargasJson ?? undefined,
          yogasDoshas: cached.yogasDoshas ?? undefined,
        },
      });
      return json({ id: copy.id, cached: true });
    }

    if (!isEngineConfigured()) return json({ error: "unavailable", message: "ENGINE_URL is not configured" }, 503);

    const profile = await newProfile();
    const horoscope = await db.horoscope.create({
      data: { birthProfileId: profile.id, inputHash, lang: data.lang, chartStyle: data.chartStyle, status: "RUNNING" },
    });

    // TODO(AMX-047): enqueue the Celery compute task instead of computing inline; the
    // result page already polls GET /api/kundali/[id] while status is QUEUED/RUNNING.
    try {
      const { vargas, ...chart } = await computeHoroscope(input);
      await db.horoscope.update({
        where: { id: horoscope.id },
        data: {
          status: "DONE",
          chartJson: { ...chart, subject } as unknown as Prisma.InputJsonValue,
          vargasJson: vargas ? (vargas as unknown as Prisma.InputJsonValue) : undefined,
          yogasDoshas: chart.yogas_doshas ? (chart.yogas_doshas as unknown as Prisma.InputJsonValue) : undefined,
          error: null,
        },
      });
      // AMX-064: email the report links after the response (PDF = the light print view; the
      // engine-rendered PDF attachment comes with AMX-046).
      const id = horoscope.id;
      after(async () => {
        try {
          const mail = kundaliReadyEmail({
            locale: data.lang,
            name: data.name,
            kundaliUrl: absoluteUrl(data.lang, `/kundali/${id}`),
            pdfUrl: absoluteUrl(data.lang, `/kundali/${id}/print`),
            bookUrl: absoluteUrl(data.lang, "/book-appointment"),
          });
          await sendEmail({ to: data.email, ...mail, template: "kundali_ready", entityId: id });
          await db.horoscope.update({ where: { id }, data: { emailedAt: new Date() } });
        } catch (e) {
          console.error("[kundali] email failed", id, e);
        }
      });
    } catch (err) {
      console.error("[kundali] compute failed", horoscope.id, err);
      await db.horoscope.update({
        where: { id: horoscope.id },
        data: { status: "FAILED", error: String((err as Error)?.message ?? err).slice(0, 1000) },
      });
    }
    return json({ id: horoscope.id });
  } catch (err) {
    console.error("[kundali] request failed", err);
    return json({ error: "server_error" }, 500);
  }
}
