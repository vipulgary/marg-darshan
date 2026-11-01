/**
 * Zod schemas for the booking funnel and the hold API. Error messages are i18n
 * keys (messages/<locale>/booking.json → errors.*), never user-facing text.
 */
import { z } from "zod";
import { PROBLEMS, SERVICES, type ServiceType, getProblem, getService } from "@/content/catalog";
import { istDateKey, isValidDateKey } from "./slots";

export const GENDERS = ["male", "female", "other"] as const;
export const PROPERTY_TYPES = ["home", "office", "shop", "factory", "plot"] as const;
export const FACINGS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
export const LIFE_EVENT_TYPES = [
  "marriage",
  "child_birth",
  "job_start",
  "job_change",
  "business_start",
  "illness_surgery",
  "accident",
  "relocation_abroad",
  "father_passing",
  "mother_passing",
  "education",
] as const;
export const MIN_LIFE_EVENTS = 4;
export const MAX_LIFE_EVENTS = 6;

export type Gender = (typeof GENDERS)[number];
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type Facing = (typeof FACINGS)[number];
export type LifeEventType = (typeof LIFE_EVENT_TYPES)[number];
export type IntakeKind = "birth" | "rectification" | "vastu";

const PROBLEM_SLUGS = PROBLEMS.map((p) => p.slug) as [string, ...string[]];
const SERVICE_SLUGS = SERVICES.map((s) => s.slug) as [string, ...string[]];

/** Indian mobile: 10 digits starting 6–9, optionally prefixed with +91 / 91 / 0. */
const PHONE_RE = /^(?:\+91|91|0)?([6-9]\d{9})$/;

export function normalizeIndianPhone(raw: string): string | null {
  const m = raw.replace(/[\s().-]/g, "").match(PHONE_RE);
  return m ? `+91${m[1]}` : null;
}

// IST "today" so a birth date entered late at night in India is not rejected as future.
const todayKey = () => istDateKey(new Date());

const requiredText = (min = 1, max = 200) =>
  z.string("required").trim().min(1, "required").min(min, "tooShort").max(max, "tooLong");

export const phoneSchema = z
  .string("required")
  .trim()
  .min(1, "required")
  .refine((v) => normalizeIndianPhone(v) !== null, "invalidPhone")
  .transform((v) => normalizeIndianPhone(v) as string);

export const emailSchema = z.string("required").trim().toLowerCase().min(1, "required").pipe(z.email("invalidEmail"));

export const dateKeySchema = z
  .string("required")
  .min(1, "required")
  .refine(isValidDateKey, "invalidDate");

/** Past dates only (birth dates, life events). */
export const pastDateSchema = dateKeySchema
  .refine((v) => v >= "1900-01-01", "invalidDate")
  .refine((v) => v <= todayKey(), "dateInFuture");

export const timeSchema = z
  .string("required")
  .min(1, "required")
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "invalidTime");

export const placeSchema = z.object(
  {
    placeName: z.string().trim().min(1, "required"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    tzName: z.string().min(1),
  },
  "required",
);

export const contactSchema = z.object({
  name: requiredText(2, 100),
  email: emailSchema,
  phone: phoneSchema,
});

export const genderSchema = z.enum(GENDERS, "required");

export const birthSchema = z.object({
  dob: pastDateSchema,
  tob: timeSchema,
  place: placeSchema,
});

export const lifeEventSchema = z.object({
  type: z.enum(LIFE_EVENT_TYPES, "required"),
  date: pastDateSchema,
});

export const rectificationSchema = z
  .object({
    dob: pastDateSchema,
    place: placeSchema,
    approxWindow: z.object({ start: timeSchema, end: timeSchema }),
    lifeEvents: z.array(lifeEventSchema).min(MIN_LIFE_EVENTS, "lifeEventsMin").max(MAX_LIFE_EVENTS, "lifeEventsMax"),
  })
  .superRefine((v, ctx) => {
    if (v.approxWindow.start === v.approxWindow.end)
      ctx.addIssue({ code: "custom", message: "windowEmpty", path: ["approxWindow", "end"] });
    v.lifeEvents.forEach((e, i) => {
      if (isValidDateKey(e.date) && isValidDateKey(v.dob) && e.date < v.dob)
        ctx.addIssue({ code: "custom", message: "eventBeforeBirth", path: ["lifeEvents", i, "date"] });
    });
  });

export const vastuSchema = z.object({
  address: requiredText(5, 500),
  place: placeSchema,
  propertyType: z.enum(PROPERTY_TYPES, "required"),
  facing: z.enum(FACINGS, "required"),
  floorPlanUrl: z
    .string()
    .max(500)
    .regex(/^(https:\/\/|\/api\/uploads\/)/, "invalidUpload")
    .optional(),
});

export const problemStepSchema = z.object({ problemSlug: z.enum(PROBLEM_SLUGS, "required") });

export const visitModeSchema = z.enum(["ONLINE_ZOOM", "PERSONAL_VISIT"], "required");
export const planTypeSchema = z.enum(["FULL_UPFRONT", "SPLIT_PLAN"]);

export function serviceForProblem(problemSlug: string | null | undefined) {
  const p = problemSlug ? getProblem(problemSlug) : undefined;
  return p ? getService(p.serviceSlug) : undefined;
}

export function intakeKindFor(type: ServiceType, timeUnknown: boolean): IntakeKind {
  if (type === "VASTU") return "vastu";
  if (type === "RECTIFICATION") return "rectification";
  return timeUnknown ? "rectification" : "birth";
}

export const holdPayloadSchema = z
  .object({
    problemSlug: z.enum(PROBLEM_SLUGS, "required"),
    serviceSlug: z.enum(SERVICE_SLUGS, "required"),
    mode: visitModeSchema,
    durationMin: z.number("required").int().positive(),
    slotStart: z.iso.datetime({ offset: true, error: "required" }),
    planType: planTypeSchema.default("FULL_UPFRONT"),
    contact: contactSchema,
    gender: genderSchema.optional(),
    question: z.string().trim().max(2000, "tooLong").optional(),
    birth: birthSchema.optional(),
    rectification: rectificationSchema.optional(),
    vastu: vastuSchema.optional(),
    /** a profile already captured by the Birth Time Finder (deep link ?profile=) */
    birthProfileId: z.uuid().optional(),
    /** the caller's previous, still-active hold — released so the same person can re-pick */
    replacesAppointmentId: z.uuid().optional(),
    locale: z.enum(["hi", "en"]).default("hi"),
    consent: z.literal(true, "consentRequired"),
  })
  .superRefine((v, ctx) => {
    const problem = getProblem(v.problemSlug);
    const service = getService(v.serviceSlug);
    if (!problem || !service) return;
    if (problem.serviceSlug !== service.slug)
      ctx.addIssue({ code: "custom", message: "serviceMismatch", path: ["serviceSlug"] });
    if (!service.modes.includes(v.mode)) ctx.addIssue({ code: "custom", message: "invalidMode", path: ["mode"] });
    if (!service.durations.includes(v.durationMin))
      ctx.addIssue({ code: "custom", message: "invalidDuration", path: ["durationMin"] });

    const hasProfile = !!v.birthProfileId;
    if (service.type === "VASTU") {
      if (!v.vastu) ctx.addIssue({ code: "custom", message: "required", path: ["vastu"] });
    } else if (service.type === "RECTIFICATION") {
      if (!v.rectification && !hasProfile) ctx.addIssue({ code: "custom", message: "required", path: ["rectification"] });
    } else {
      if (!v.birth && !v.rectification && !hasProfile)
        ctx.addIssue({ code: "custom", message: "required", path: ["birth"] });
      if (!v.gender && !hasProfile) ctx.addIssue({ code: "custom", message: "required", path: ["gender"] });
    }
  });

export type HoldPayloadInput = z.input<typeof holdPayloadSchema>;
export type HoldPayload = z.output<typeof holdPayloadSchema>;

export const slotsQuerySchema = z.object({
  service: z.enum(SERVICE_SLUGS),
  mode: visitModeSchema,
  duration: z.coerce.number().int().positive(),
  from: z.string().refine(isValidDateKey).optional(),
  days: z.coerce.number().int().min(1).max(31).optional(),
});
