/** Cal.com API v2 adapter (AMX-078) — plain fetch, defensive parsing, no SDK. */
import { getService } from "@/content/catalog";
import {
  type BusyInterval,
  CalendarNotConfiguredError,
  type CalendarProvider,
  CalendarProviderError,
  type CreateBookingInput,
} from "./types";

const DEFAULT_URL = "https://api.cal.com/v2";
const DEFAULT_VERSION = "2024-08-13";
const INACTIVE = new Set(["cancelled", "canceled", "rejected"]);

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => !!v && typeof v === "object" && !Array.isArray(v);

function toDate(v: unknown): Date | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** GET /v2/bookings → busy intervals (cancelled / rejected bookings ignored). */
export function parseBusy(json: unknown): BusyInterval[] {
  const data = isObj(json) ? json.data : undefined;
  const list = Array.isArray(data) ? data : isObj(data) && Array.isArray(data.bookings) ? data.bookings : [];
  const out: BusyInterval[] = [];
  for (const b of list) {
    if (!isObj(b)) continue;
    if (typeof b.status === "string" && INACTIVE.has(b.status.toLowerCase())) continue;
    const start = toDate(b.start ?? b.startTime);
    const end = toDate(b.end ?? b.endTime);
    if (start && end && end > start) out.push({ start, end });
  }
  return out;
}

/** POST /v2/bookings → { uid, meetingUrl? } */
export function parseBookingResult(json: unknown): { uid: string; meetingUrl?: string } {
  const data = isObj(json) ? (Array.isArray(json.data) ? json.data[0] : json.data) : undefined;
  if (!isObj(data) || typeof data.uid !== "string" || !data.uid) throw new CalendarProviderError("cal.com: booking uid missing", 502, json);
  const candidates = [data.meetingUrl, data.videoCallUrl, data.location];
  const meetingUrl = candidates.find((c): c is string => typeof c === "string" && /^https:\/\//.test(c));
  return { uid: data.uid, meetingUrl };
}

export class CalComProvider implements CalendarProvider {
  readonly name = "calcom" as const;

  private config() {
    const apiKey = process.env.CALCOM_API_KEY;
    if (!apiKey) throw new CalendarNotConfiguredError("CALCOM_API_KEY");
    return {
      apiKey,
      baseUrl: (process.env.CALCOM_API_URL || DEFAULT_URL).replace(/\/+$/, ""),
      version: process.env.CALCOM_API_VERSION || DEFAULT_VERSION,
      username: process.env.CALCOM_USERNAME,
    };
  }

  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    const c = this.config();
    const res = await fetch(`${c.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${c.apiKey}`,
        "cal-api-version": c.version,
        "Content-Type": "application/json",
        ...init.headers,
      },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {}
    if (!res.ok) throw new CalendarProviderError(`cal.com ${init.method ?? "GET"} ${path} failed`, res.status, body);
    return body;
  }

  async getBusy(from: Date, to: Date): Promise<BusyInterval[]> {
    const q = new URLSearchParams({
      status: "upcoming,unconfirmed",
      afterStart: from.toISOString(),
      beforeEnd: to.toISOString(),
      take: "250",
    });
    return parseBusy(await this.request(`/bookings?${q}`));
  }

  async createBooking(input: CreateBookingInput) {
    const service = getService(input.serviceSlug);
    const eventTypeSlug = service?.calEventSlug[input.mode];
    if (!eventTypeSlug) throw new CalendarProviderError(`no cal.com event type for ${input.serviceSlug}/${input.mode}`);
    const { username } = this.config();
    if (!username) throw new CalendarNotConfiguredError("CALCOM_USERNAME");
    const body = {
      start: new Date(input.start).toISOString(),
      eventTypeSlug,
      username,
      ...(input.durationMin ? { lengthInMinutes: input.durationMin } : {}),
      attendee: {
        name: input.attendee.name,
        email: input.attendee.email,
        timeZone: input.attendee.timeZone ?? "Asia/Kolkata",
        language: input.attendee.locale === "en" ? "en" : "hi",
        ...(input.attendee.phone ? { phoneNumber: input.attendee.phone } : {}),
      },
      metadata: { appointmentId: input.appointmentId },
      ...(input.notes ? { bookingFieldsResponses: { notes: input.notes } } : {}),
    };
    return parseBookingResult(await this.request("/bookings", { method: "POST", body: JSON.stringify(body) }));
  }

  async cancelBooking(uid: string): Promise<void> {
    await this.request(`/bookings/${encodeURIComponent(uid)}/cancel`, {
      method: "POST",
      body: JSON.stringify({ cancellationReason: "Cancelled by Marg Darshan" }),
    });
  }
}
