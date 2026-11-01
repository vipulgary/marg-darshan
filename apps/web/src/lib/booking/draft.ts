/**
 * The funnel's client-side draft and the pure mapping from it to the hold API
 * payload. Kept free of React so the per-step validation is unit-testable.
 */
import type { z } from "zod";
import type { PlanType, VisitMode } from "@/content/catalog";
import { getProblem } from "@/content/catalog";
import type { PlaceValue } from "@/lib/contracts";
import {
  type Facing,
  type Gender,
  type HoldPayloadInput,
  type IntakeKind,
  type LifeEventType,
  type PropertyType,
  birthSchema,
  contactSchema,
  genderSchema,
  holdPayloadSchema,
  intakeKindFor,
  rectificationSchema,
  serviceForProblem,
  vastuSchema,
} from "./schemas";

export const STEP_KEYS = ["problem", "mode", "details", "slot", "pay"] as const;
export const LAST_STEP = STEP_KEYS.length - 1;

export interface LifeEventDraft {
  id: string;
  type: LifeEventType | "";
  date: string;
}

export interface FloorPlanDraft {
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface HoldRef {
  appointmentId: string;
  holdExpiresAt: string;
  slotStart: string;
  signature: string;
}

export interface BookingDraft {
  step: number;
  problemSlug: string;
  mode: VisitMode | "";
  durationMin: number | null;
  name: string;
  email: string;
  phone: string;
  gender: Gender | "";
  dob: string;
  tob: string;
  place: PlaceValue | null;
  timeUnknown: boolean;
  approxStart: string;
  approxEnd: string;
  lifeEvents: LifeEventDraft[];
  vastuAddress: string;
  vastuPlace: PlaceValue | null;
  propertyType: PropertyType | "";
  facing: Facing | "";
  floorPlan: FloorPlanDraft | null;
  question: string;
  birthProfileId: string | null;
  slotDate: string | null;
  slotStart: string | null;
  planType: PlanType;
  consent: boolean;
  hold: HoldRef | null;
}

export const emptyDraft: BookingDraft = {
  step: 0,
  problemSlug: "",
  mode: "",
  durationMin: null,
  name: "",
  email: "",
  phone: "",
  gender: "",
  dob: "",
  tob: "",
  place: null,
  timeUnknown: false,
  approxStart: "",
  approxEnd: "",
  lifeEvents: [],
  vastuAddress: "",
  vastuPlace: null,
  propertyType: "",
  facing: "",
  floorPlan: null,
  question: "",
  birthProfileId: null,
  slotDate: null,
  slotStart: null,
  planType: "FULL_UPFRONT",
  consent: false,
  hold: null,
};

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function intakeKind(d: Pick<BookingDraft, "problemSlug" | "timeUnknown">): IntakeKind | null {
  const service = serviceForProblem(d.problemSlug);
  return service ? intakeKindFor(service.type, d.timeUnknown) : null;
}

/** A Birth Time Finder profile replaces the birth / rectification fields (not the contact). */
export const usesAttachedProfile = (d: BookingDraft) => !!d.birthProfileId && intakeKind(d) !== "vastu";

const mapEvents = (events: LifeEventDraft[]) => events.map(({ type, date }) => ({ type, date }));

/** Builds the intake part only; consumers validate it with the zod schemas. */
function intakePayload(d: BookingDraft) {
  const kind = intakeKind(d);
  const profile = usesAttachedProfile(d);
  return {
    gender: kind !== "vastu" && !profile && d.gender ? d.gender : undefined,
    birth: kind === "birth" && !profile ? { dob: d.dob, tob: d.tob, place: d.place } : undefined,
    rectification:
      kind === "rectification" && !profile
        ? {
            dob: d.dob,
            place: d.place,
            approxWindow: { start: d.approxStart, end: d.approxEnd },
            lifeEvents: mapEvents(d.lifeEvents),
          }
        : undefined,
    vastu:
      kind === "vastu"
        ? {
            address: d.vastuAddress,
            place: d.vastuPlace,
            propertyType: d.propertyType || undefined,
            facing: d.facing || undefined,
            floorPlanUrl: d.floorPlan?.url,
          }
        : undefined,
    birthProfileId: profile ? (d.birthProfileId ?? undefined) : undefined,
  };
}

/** Draft → POST /api/booking/hold body (validated again on the server). */
export function buildHoldPayload(d: BookingDraft, locale: string): HoldPayloadInput {
  const service = serviceForProblem(d.problemSlug);
  return {
    problemSlug: d.problemSlug,
    serviceSlug: service?.slug ?? "",
    mode: d.mode as VisitMode,
    durationMin: d.durationMin ?? 0,
    slotStart: d.slotStart ?? "",
    planType: d.planType,
    contact: { name: d.name, email: d.email, phone: d.phone },
    question: d.question.trim() || undefined,
    ...(intakePayload(d) as Partial<HoldPayloadInput>),
    replacesAppointmentId: d.hold?.appointmentId,
    locale: locale === "en" ? "en" : "hi",
    consent: d.consent as true,
  };
}

/** Identity of what was held — a changed draft needs a fresh hold. */
export function holdSignature(d: BookingDraft): string {
  const payload: Partial<HoldPayloadInput> = buildHoldPayload(d, "hi");
  for (const k of ["replacesAppointmentId", "consent", "planType", "locale"] as const) delete payload[k];
  return JSON.stringify(payload);
}

export type FieldErrors = Record<string, string>;

/** zod issue path → UI field key used by the step components. */
const FIELD_ALIASES: Record<string, string> = {
  "contact.name": "name",
  "contact.email": "email",
  "contact.phone": "phone",
  "birth.dob": "dob",
  "birth.tob": "tob",
  "birth.place": "place",
  "rectification.dob": "dob",
  "rectification.place": "place",
  "rectification.approxWindow.start": "approxStart",
  "rectification.approxWindow.end": "approxEnd",
  "rectification.lifeEvents": "lifeEvents",
  "vastu.address": "vastuAddress",
  "vastu.place": "vastuPlace",
  "vastu.propertyType": "propertyType",
  "vastu.facing": "facing",
  "vastu.floorPlanUrl": "floorPlan",
};

export function fieldKey(path: PropertyKey[]): string {
  const raw = path.map(String).join(".");
  const ev = raw.match(/^rectification\.lifeEvents\.(\d+)\.(type|date)/);
  if (ev) return `lifeEvents.${ev[1]}.${ev[2]}`;
  for (const [prefix, key] of Object.entries(FIELD_ALIASES)) if (raw === prefix || raw.startsWith(`${prefix}.`)) return key;
  return raw;
}

function collect(errors: FieldErrors, result: z.ZodSafeParseResult<unknown>, prefix: (string | number)[] = []) {
  if (result.success) return;
  for (const issue of result.error.issues) {
    const key = fieldKey([...prefix, ...issue.path]);
    if (!(key in errors)) errors[key] = issue.message;
  }
}

export function validateStep(step: number, d: BookingDraft): FieldErrors {
  const errors: FieldErrors = {};
  const problem = getProblem(d.problemSlug);
  const service = serviceForProblem(d.problemSlug);
  switch (step) {
    case 0:
      if (!problem) errors.problemSlug = "required";
      break;
    case 1:
      if (!service) errors.problemSlug = "required";
      else {
        if (!d.mode || !service.modes.includes(d.mode)) errors.mode = "required";
        if (!d.durationMin || !service.durations.includes(d.durationMin)) errors.durationMin = "required";
      }
      break;
    case 2: {
      collect(errors, contactSchema.safeParse({ name: d.name, email: d.email, phone: d.phone }));
      const intake = intakePayload(d);
      const kind = intakeKind(d);
      if (kind === "vastu") collect(errors, vastuSchema.safeParse(intake.vastu), ["vastu"]);
      else if (!intake.birthProfileId) {
        collect(errors, genderSchema.safeParse(d.gender), ["gender"]);
        if (kind === "birth") collect(errors, birthSchema.safeParse(intake.birth), ["birth"]);
        if (kind === "rectification") collect(errors, rectificationSchema.safeParse(intake.rectification), ["rectification"]);
      }
      break;
    }
    case 3:
      if (!d.slotStart) errors.slotStart = "required";
      break;
    case 4:
      if (!d.consent) errors.consent = "consentRequired";
      collect(errors, holdPayloadSchema.safeParse(buildHoldPayload(d, "hi")));
      break;
  }
  return errors;
}

export const isStepValid = (step: number, d: BookingDraft) => Object.keys(validateStep(step, d)).length === 0;

/** Index of the first step that is not complete (≤ target), so deep links / stale drafts can't skip ahead. */
export function firstIncompleteStep(d: BookingDraft, target: number = LAST_STEP): number {
  for (let s = 0; s < target; s++) if (!isStepValid(s, d)) return s;
  return target;
}
