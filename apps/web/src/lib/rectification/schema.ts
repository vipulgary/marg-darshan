import { z } from "zod";
import { isIndianMobile } from "../shop/phone";
import { LIFE_EVENT_TYPES, MAX_LIFE_EVENTS, isIsoDate, todayIST, validateLifeEvents } from "./events";
import { WINDOW_PRESET_KEYS, resolveWindow, toDbTime } from "./windows";

export const RECTIFICATION_MODES = ["date_known", "date_unknown"] as const;
export type RectificationMode = (typeof RECTIFICATION_MODES)[number];

const placeSchema = z.object({
  placeName: z.string().trim().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  tzName: z.string().trim().min(1).max(64),
});

const eventRow = z.object({
  type: z.string().max(40),
  date: z.string().max(10),
  note: z.string().max(300).optional(),
});

/** POST /api/rectification body. `today` is injectable so validation is testable. */
export function rectificationSchema(today: string = todayIST()) {
  return z
    .object({
      mode: z.enum(RECTIFICATION_MODES),
      dob: z.string().max(10).optional(),
      window: z
        .object({
          preset: z.enum(WINDOW_PRESET_KEYS),
          start: z.string().max(5).optional(),
          end: z.string().max(5).optional(),
        })
        .optional(),
      place: placeSchema.nullable().optional(),
      lifeEvents: z.array(eventRow).max(MAX_LIFE_EVENTS * 2).default([]),
      prashna: z
        .object({
          lat: z.number().min(-90).max(90).optional(),
          lng: z.number().min(-180).max(180).optional(),
          tzName: z.string().max(64).optional(),
        })
        .optional(),
      contact: z.object({
        name: z.string().trim().min(2).max(80),
        email: z.email().max(160),
        phone: z.string().trim().refine(isIndianMobile),
      }),
      locale: z.enum(["hi", "en"]).default("hi"),
      consent: z.literal(true),
    })
    .superRefine((d, ctx) => {
      const known = d.mode === "date_known";
      if (known) {
        if (!d.dob || !isIsoDate(d.dob)) ctx.addIssue({ code: "custom", path: ["dob"], message: "dobInvalid" });
        else if (d.dob > today || d.dob < "1900-01-01")
          ctx.addIssue({ code: "custom", path: ["dob"], message: "dobRange" });
        if (!d.window || !resolveWindow(d.window.preset, d.window))
          ctx.addIssue({ code: "custom", path: ["window"], message: "windowInvalid" });
        if (!d.place) ctx.addIssue({ code: "custom", path: ["place"], message: "placeRequired" });
      }
      const res = validateLifeEvents(d.lifeEvents, { dob: known ? d.dob : null, today, min: known ? undefined : 0 });
      if (res.countError) ctx.addIssue({ code: "custom", path: ["lifeEvents"], message: res.countError });
      res.rowErrors.forEach((err, i) => {
        if (err?.type) ctx.addIssue({ code: "custom", path: ["lifeEvents", i, "type"], message: err.type });
        if (err?.date) ctx.addIssue({ code: "custom", path: ["lifeEvents", i, "date"], message: err.date });
      });
    });
}

export type RectificationPayload = z.output<ReturnType<typeof rectificationSchema>>;
export type RectificationInput = z.input<ReturnType<typeof rectificationSchema>>;

// Allowed life-event types re-exported for the API/UI layer.
export { LIFE_EVENT_TYPES };

/**
 * Maps a validated payload to BirthProfile columns. A date-unknown case has no birth chart:
 * the Prashna (question-time) chart is cast from the submission moment and location instead,
 * so lat/lng fall back to the browser location, then to 0/0 with isDateUnknown flagged.
 */
export function buildBirthProfileData(p: RectificationPayload, now: Date, today: string = todayIST(now)) {
  const known = p.mode === "date_known";
  const window = known && p.window ? resolveWindow(p.window.preset, p.window) : null;
  const events = validateLifeEvents(p.lifeEvents, { dob: known ? p.dob : null, today, min: 0 }).events;
  const hasPrashnaGeo = p.prashna?.lat !== undefined && p.prashna?.lng !== undefined;
  const tzFallback = p.prashna?.tzName || "Asia/Kolkata";

  const place =
    p.place ??
    (hasPrashnaGeo
      ? { placeName: "Prashna location (browser)", latitude: p.prashna!.lat!, longitude: p.prashna!.lng!, tzName: tzFallback }
      : { placeName: "Unknown", latitude: 0, longitude: 0, tzName: tzFallback });

  return {
    dob: known && p.dob ? new Date(`${p.dob}T00:00:00.000Z`) : null,
    tob: null,
    isTimeUnknown: true,
    isDateUnknown: !known,
    approxWindowStart: window ? toDbTime(window.startMin) : null,
    approxWindowEnd: window ? toDbTime(window.endMin) : null,
    placeName: place.placeName,
    latitude: place.latitude,
    longitude: place.longitude,
    tzName: place.tzName,
    lifeEvents: events,
    prashnaTs: known ? null : now,
    prashnaLat: !known && hasPrashnaGeo ? p.prashna!.lat! : null,
    prashnaLng: !known && hasPrashnaGeo ? p.prashna!.lng! : null,
  };
}
