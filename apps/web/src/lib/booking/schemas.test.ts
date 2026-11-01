import assert from "node:assert/strict";
import { test } from "node:test";
import { type HoldPayloadInput, holdPayloadSchema, normalizeIndianPhone, rectificationSchema } from "./schemas";

const delhi = { placeName: "New Delhi, India", latitude: 28.6139, longitude: 77.209, tzName: "Asia/Kolkata" };
const base: HoldPayloadInput = {
  problemSlug: "career",
  serviceSlug: "astrology",
  mode: "ONLINE_ZOOM",
  durationMin: 60,
  slotStart: "2026-11-03T05:30:00.000Z",
  contact: { name: "Rahul Sharma", email: " Rahul@Example.com ", phone: "98765 43210" },
  gender: "male",
  birth: { dob: "1990-05-14", tob: "06:45", place: delhi },
  consent: true,
};
const events = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ type: "job_change" as const, date: `201${i}-06-01` }));
const issueMessages = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? [] : r.error!.issues.map((i) => i.message);

test("Indian phone normalisation", () => {
  assert.equal(normalizeIndianPhone("9876543210"), "+919876543210");
  assert.equal(normalizeIndianPhone("+91 98765-43210"), "+919876543210");
  assert.equal(normalizeIndianPhone("09876543210"), "+919876543210");
  assert.equal(normalizeIndianPhone("919876543210"), "+919876543210");
  assert.equal(normalizeIndianPhone("5876543210"), null); // must start 6–9
  assert.equal(normalizeIndianPhone("98765"), null);
  assert.equal(normalizeIndianPhone("+1 415 555 0100"), null);
});

test("valid astrology payload parses and normalises contact", () => {
  const r = holdPayloadSchema.safeParse(base);
  assert.equal(r.success, true);
  assert.equal(r.data!.contact.email, "rahul@example.com");
  assert.equal(r.data!.contact.phone, "+919876543210");
  assert.equal(r.data!.planType, "FULL_UPFRONT");
  assert.equal(r.data!.locale, "hi");
});

test("problem must map to the chosen service, mode and duration must be allowed", () => {
  assert.ok(issueMessages(holdPayloadSchema.safeParse({ ...base, serviceSlug: "vastu" })).includes("serviceMismatch"));
  assert.ok(issueMessages(holdPayloadSchema.safeParse({ ...base, durationMin: 120 })).includes("invalidDuration"));
});

test("intake branch is required by service type", () => {
  const noBirth: HoldPayloadInput = { ...base, birth: undefined, gender: undefined };
  assert.deepEqual(issueMessages(holdPayloadSchema.safeParse(noBirth)), ["required", "required"]);
  // a Birth Time Finder profile replaces the birth details
  assert.equal(holdPayloadSchema.safeParse({ ...noBirth, birthProfileId: "3f1c2a9e-8d4b-4c7a-9f2e-1b6d5e4c3a21" }).success, true);

  const vastu = { ...noBirth, problemSlug: "vastu-residential", serviceSlug: "vastu", durationMin: 120 };
  assert.deepEqual(issueMessages(holdPayloadSchema.safeParse(vastu)), ["required"]);
  const withProperty = {
    ...vastu,
    vastu: { address: "12 MG Road, Indore", place: delhi, propertyType: "home" as const, facing: "NE" as const },
  };
  assert.equal(holdPayloadSchema.safeParse(withProperty).success, true);
  assert.equal(
    holdPayloadSchema.safeParse({ ...withProperty, vastu: { ...withProperty.vastu, floorPlanUrl: "javascript:alert(1)" } }).success,
    false,
  );
});

test("consent is mandatory", () => {
  assert.ok(issueMessages(holdPayloadSchema.safeParse({ ...base, consent: false as unknown as true })).includes("consentRequired"));
});

test("rectification needs 4–6 life events after the birth date and a non-empty window", () => {
  const ok = { dob: "1985-01-20", place: delhi, approxWindow: { start: "22:00", end: "02:00" }, lifeEvents: events(4) };
  assert.equal(rectificationSchema.safeParse(ok).success, true);
  assert.ok(issueMessages(rectificationSchema.safeParse({ ...ok, lifeEvents: events(3) })).includes("lifeEventsMin"));
  assert.ok(issueMessages(rectificationSchema.safeParse({ ...ok, lifeEvents: events(7) })).includes("lifeEventsMax"));
  assert.ok(
    issueMessages(rectificationSchema.safeParse({ ...ok, approxWindow: { start: "05:00", end: "05:00" } })).includes("windowEmpty"),
  );
  const early = [...events(3), { type: "marriage" as const, date: "1980-01-01" }];
  assert.ok(issueMessages(rectificationSchema.safeParse({ ...ok, lifeEvents: early })).includes("eventBeforeBirth"));
  const future = [...events(3), { type: "marriage" as const, date: "2999-01-01" }];
  assert.ok(issueMessages(rectificationSchema.safeParse({ ...ok, lifeEvents: future })).includes("dateInFuture"));
});
