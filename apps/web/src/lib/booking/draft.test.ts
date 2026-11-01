import assert from "node:assert/strict";
import { test } from "node:test";
import {
  type BookingDraft,
  buildHoldPayload,
  emptyDraft,
  fieldKey,
  firstIncompleteStep,
  holdSignature,
  validateStep,
} from "./draft";

const place = { placeName: "Indore, India", latitude: 22.7196, longitude: 75.8577, tzName: "Asia/Kolkata" };
const astrology: BookingDraft = {
  ...emptyDraft,
  problemSlug: "career",
  mode: "ONLINE_ZOOM",
  durationMin: 60,
  name: "Priya Verma",
  email: "priya@example.com",
  phone: "9876543210",
  gender: "female",
  dob: "1992-08-21",
  tob: "14:05",
  place,
  slotStart: "2026-11-03T05:30:00.000Z",
  consent: true,
};

test("empty draft fails step 1 and blocks later steps", () => {
  assert.deepEqual(validateStep(0, emptyDraft), { problemSlug: "required" });
  assert.equal(firstIncompleteStep(emptyDraft), 0);
});

test("a complete astrology draft passes every step", () => {
  for (let s = 0; s <= 4; s++) assert.deepEqual(validateStep(s, astrology), {}, `step ${s}`);
  assert.equal(firstIncompleteStep(astrology), 4);
});

test("step 2 rejects durations the service does not offer", () => {
  assert.deepEqual(validateStep(1, { ...astrology, durationMin: 120 }), { durationMin: "required" });
});

test("details errors map to UI field keys", () => {
  const errors = validateStep(2, { ...astrology, email: "bad", phone: "123", tob: "", place: null });
  assert.equal(errors.email, "invalidEmail");
  assert.equal(errors.phone, "invalidPhone");
  assert.equal(errors.tob, "required");
  assert.equal(errors.place, "required");
  assert.equal(fieldKey(["rectification", "lifeEvents", 2, "date"]), "lifeEvents.2.date");
  assert.equal(fieldKey(["vastu", "place", "placeName"]), "vastuPlace");
});

test("don't-know-birth-time switches to the rectification branch", () => {
  const d: BookingDraft = { ...astrology, timeUnknown: true, tob: "" };
  const errors = validateStep(2, d);
  assert.equal(errors.approxStart, "required");
  assert.equal(errors.lifeEvents, "lifeEventsMin");
  assert.equal(errors.tob, undefined);
  const payload = buildHoldPayload(
    {
      ...d,
      approxStart: "04:00",
      approxEnd: "08:00",
      lifeEvents: [1, 2, 3, 4].map((i) => ({ id: String(i), type: "job_start" as const, date: `201${i}-01-01` })),
    },
    "en",
  );
  assert.equal(payload.birth, undefined);
  assert.equal(payload.rectification?.lifeEvents.length, 4);
  assert.equal(payload.locale, "en");
});

test("an attached Birth Time Finder profile replaces birth fields", () => {
  const d: BookingDraft = {
    ...emptyDraft,
    problemSlug: "birth-time-unknown",
    mode: "ONLINE_ZOOM",
    durationMin: 90,
    name: "Amit",
    email: "amit@example.com",
    phone: "+91 91234 56789",
    birthProfileId: "3f1c2a9e-8d4b-4c7a-9f2e-1b6d5e4c3a21",
  };
  assert.deepEqual(validateStep(2, d), {});
  const p = buildHoldPayload(d, "hi");
  assert.equal(p.rectification, undefined);
  assert.equal(p.birthProfileId, d.birthProfileId);
});

test("vastu payload carries the property and floor plan", () => {
  const d: BookingDraft = {
    ...astrology,
    problemSlug: "vastu-commercial",
    durationMin: 120,
    vastuAddress: "Shop 4, Rajwada, Indore",
    vastuPlace: place,
    propertyType: "shop",
    facing: "E",
    floorPlan: { url: "/api/uploads/floor-plan/x.pdf", name: "plan.pdf", size: 1000, type: "application/pdf" },
  };
  assert.deepEqual(validateStep(2, d), {});
  const p = buildHoldPayload(d, "hi");
  assert.equal(p.serviceSlug, "vastu");
  assert.equal(p.birth, undefined);
  assert.equal(p.gender, undefined);
  assert.equal(p.vastu?.floorPlanUrl, "/api/uploads/floor-plan/x.pdf");
});

test("hold signature changes with the slot but not with the plan", () => {
  const sig = holdSignature(astrology);
  assert.equal(holdSignature({ ...astrology, planType: "SPLIT_PLAN" }), sig);
  assert.notEqual(holdSignature({ ...astrology, slotStart: "2026-11-03T06:30:00.000Z" }), sig);
});
