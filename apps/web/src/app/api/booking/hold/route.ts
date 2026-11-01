import { Prisma } from "@/generated/prisma/client";
import { HOLD_STATUSES, blockingAppointmentWhere, holdExpiresAt } from "@/lib/booking/hold";
import { transition } from "@/lib/booking/machine";
import { QuoteError, quote } from "@/lib/booking/pricing";
import { type HoldPayload, holdPayloadSchema } from "@/lib/booking/schemas";
import { SLOT_LOCK_NS, hourKeys, isBookableSlot, occupiedRange, overlaps } from "@/lib/booking/slots";
import { getCalendarProvider } from "@/lib/calendar";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettings, serviceLookup } from "@/lib/settings";
import { getCurrentClient } from "@/lib/auth/session";


class HoldError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}

const json = (status: number, body: Record<string, unknown>) => Response.json(body, { status });

const timeOnly = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00Z`);
const dateOnly = (key: string) => new Date(`${key}T00:00:00Z`);

export async function POST(req: Request) {
  const rl = rateLimit(`booking-hold:${clientIp(req)}`, 10, 10 * 60_000);
  if (!rl.ok)
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }
  const parsed = holdPayloadSchema.safeParse(body);
  if (!parsed.success) return json(400, { error: "invalid_payload", issues: parsed.error.issues });
  const p = parsed.data;

  const now = new Date();
  const settings = await getSettings();
  const start = new Date(p.slotStart);
  if (!isBookableSlot(start, p.durationMin, { now, workingHours: settings.workingHours })) return json(400, { error: "slot_invalid" });
  const end = new Date(start.getTime() + p.durationMin * 60_000);
  const occ = occupiedRange(start, p.durationMin);
  let price;
  try {
    price = quote({ serviceSlug: p.serviceSlug, durationMin: p.durationMin, mode: p.mode, planType: p.planType }, serviceLookup(settings));
  } catch (e) {
    if (e instanceof QuoteError) return json(400, { error: e.code });
    throw e;
  }

  if (!process.env.DATABASE_URL) return json(503, { error: "not_configured", message: "DATABASE_URL is not set" });

  // External calendar (Cal.com) bookings made outside this site also block the slot.
  const provider = getCalendarProvider();
  if (provider.name !== "local") {
    try {
      const busy = await provider.getBusy(occ.start, occ.end);
      if (busy.some((b) => overlaps(occ.start, occ.end, b.start, b.end))) return json(409, { error: "slot_unavailable" });
    } catch (e) {
      console.error("hold: calendar check failed", e);
      return json(503, { error: "calendar_unavailable" });
    }
  }

  const { db } = await import("@/lib/db");
  const me = await getCurrentClient();
  try {
    const appointment = await db.$transaction(
      async (tx) => {
        for (const key of hourKeys(start, p.durationMin))
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SLOT_LOCK_NS}::int4, ${key}::int4)`;

        if (p.replacesAppointmentId) await releasePrevious(tx, p, now);

        const clash = await tx.appointment.findFirst({
          where: { AND: [blockingAppointmentWhere(now), { slotStart: { lt: occ.end } }, { slotEnd: { gt: occ.start } }] },
          select: { id: true },
        });
        if (clash) throw new HoldError(409, "slot_unavailable");

        const [problem, service] = await Promise.all([
          tx.problem.findUnique({ where: { slug: p.problemSlug }, select: { id: true } }),
          tx.service.findUnique({ where: { slug: p.serviceSlug }, select: { id: true } }),
        ]);
        if (!problem || !service) throw new HoldError(503, "catalog_not_seeded");

        const client = me ? await tx.client.update({ where: { id: me.id }, data: me.whatsappPhone ? {} : { whatsappPhone: p.contact.phone } }) : await upsertClient(tx, p);
        const birthProfileId = await resolveBirthProfile(tx, p, client.id, Boolean(me));

        return tx.appointment.create({
          data: {
            clientId: client.id,
            birthProfileId,
            problemId: problem.id,
            serviceId: service.id,
            problemDescription: p.question || null,
            visitMode: p.mode,
            durationMins: p.durationMin,
            planType: p.planType,
            slotStart: start,
            slotEnd: end,
            vastuProperty: p.vastu
              ? { address: p.vastu.address, place: p.vastu.place, propertyType: p.vastu.propertyType, facing: p.vastu.facing }
              : undefined,
            vastuMapUrl: p.vastu?.floorPlanUrl ?? null,
            status: transition("DRAFT", "HOLD"),
            holdExpiresAt: holdExpiresAt(now, settings.holdMinutes),
          },
          select: { id: true, holdExpiresAt: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 5_000, timeout: 15_000 },
    );
    return json(201, { appointmentId: appointment.id, holdExpiresAt: appointment.holdExpiresAt, quote: price });
  } catch (e) {
    if (e instanceof HoldError) return json(e.status, { error: e.code });
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return json(409, { error: "conflict_retry" });
    console.error("hold failed", e);
    return json(500, { error: "server_error" });
  }
}

type Tx = Prisma.TransactionClient;

/** The same person re-picking: cancel their earlier live hold so it doesn't block them. */
async function releasePrevious(tx: Tx, p: HoldPayload, now: Date) {
  const prev = await tx.appointment.findUnique({
    where: { id: p.replacesAppointmentId },
    select: { id: true, status: true, holdExpiresAt: true, client: { select: { email: true } } },
  });
  if (!prev || prev.client.email !== p.contact.email || !HOLD_STATUSES.includes(prev.status)) return;
  if (!prev.holdExpiresAt || prev.holdExpiresAt <= now) return;
  await tx.appointment.updateMany({
    where: { id: prev.id, status: prev.status },
    data: { status: transition(prev.status, "CANCEL"), holdExpiresAt: null },
  });
}

async function upsertClient(tx: Tx, p: HoldPayload) {
  const { name, email, phone } = p.contact;
  const existing =
    (await tx.client.findUnique({ where: { email } })) ??
    (await tx.client.findFirst({ where: { whatsappPhone: phone, email: null } }));
  const data = { fullName: name, email, whatsappPhone: phone, preferredLang: p.locale };
  return existing ? tx.client.update({ where: { id: existing.id }, data }) : tx.client.create({ data });
}

async function resolveBirthProfile(tx: Tx, p: HoldPayload, clientId: string, signedIn = false): Promise<string | null> {
  if (p.birthProfileId) {
    const profile = await tx.birthProfile.findUnique({ where: { id: p.birthProfileId }, select: { id: true, clientId: true } });
    if (!profile) throw new HoldError(400, "profile_not_found");
    // A signed-in customer may only attach their own (or an unowned) saved profile.
    if (signedIn && profile.clientId && profile.clientId !== clientId) throw new HoldError(400, "profile_not_found");
    if (!profile.clientId) await tx.birthProfile.update({ where: { id: profile.id }, data: { clientId } });
    return profile.id;
  }
  if (p.birth) {
    const { dob, tob, place } = p.birth;
    const created = await tx.birthProfile.create({
      data: {
        clientId,
        fullName: p.contact.name,
        gender: p.gender ?? null,
        dob: dateOnly(dob),
        tob: timeOnly(tob),
        placeName: place.placeName,
        latitude: place.latitude,
        longitude: place.longitude,
        tzName: place.tzName,
      },
      select: { id: true },
    });
    return created.id;
  }
  if (p.rectification) {
    const r = p.rectification;
    const created = await tx.birthProfile.create({
      data: {
        clientId,
        fullName: p.contact.name,
        gender: p.gender ?? null,
        dob: dateOnly(r.dob),
        isTimeUnknown: true,
        approxWindowStart: timeOnly(r.approxWindow.start),
        approxWindowEnd: timeOnly(r.approxWindow.end),
        lifeEvents: r.lifeEvents,
        placeName: r.place.placeName,
        latitude: r.place.latitude,
        longitude: r.place.longitude,
        tzName: r.place.tzName,
      },
      select: { id: true },
    });
    return created.id;
  }
  return null;
}

