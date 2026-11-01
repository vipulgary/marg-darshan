import assert from "node:assert/strict";
import { test } from "node:test";
import { buildBirthProfileData, rectificationSchema } from "./schema";

const today = "2026-10-31";
const contact = { name: "Sunita Verma", email: "sunita@example.com", phone: "+91 98765 43210" };
const place = { placeName: "Jaipur, Rajasthan, India", latitude: 26.9124, longitude: 75.7873, tzName: "Asia/Kolkata" };
const events = [
  { type: "education_milestone", date: "2008-05-30" },
  { type: "marriage", date: "2015-02-11" },
  { type: "first_child", date: "2017-09-03" },
];

const known = {
  mode: "date_known" as const,
  dob: "1988-03-21",
  window: { preset: "night" as const },
  place,
  lifeEvents: events,
  contact,
  locale: "hi" as const,
  consent: true as const,
};

const paths = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  (r.error?.issues ?? []).map((i) => `${i.path.join(".")}:${i.message}`);

test("a complete date-known submission parses", () => {
  const r = rectificationSchema(today).safeParse(known);
  assert.equal(r.success, true, paths(r).join(", "));
});

test("date-known requires dob, window, place and ≥3 events", () => {
  const r = rectificationSchema(today).safeParse({
    ...known,
    dob: "2030-01-01",
    window: { preset: "custom", start: "05:00", end: "05:00" },
    place: null,
    lifeEvents: events.slice(0, 2),
  });
  const p = paths(r);
  assert.ok(p.includes("dob:dobRange"));
  assert.ok(p.includes("window:windowInvalid"));
  assert.ok(p.includes("place:placeRequired"));
  assert.ok(p.includes("lifeEvents:tooFew"));
});

test("event before DOB is reported on the row", () => {
  const r = rectificationSchema(today).safeParse({
    ...known,
    lifeEvents: [...events, { type: "accident", date: "1980-01-01" }],
  });
  assert.ok(paths(r).includes("lifeEvents.3.date:beforeBirth"));
});

test("invalid contact and missing consent fail", () => {
  const r = rectificationSchema(today).safeParse({
    ...known,
    contact: { name: "S", email: "nope", phone: "12345" },
    consent: false,
  });
  const p = paths(r).map((s) => s.split(":")[0]);
  for (const f of ["contact.name", "contact.email", "contact.phone", "consent"]) assert.ok(p.includes(f), f);
});

test("date-unknown needs no dob/place/events", () => {
  const r = rectificationSchema(today).safeParse({
    mode: "date_unknown",
    lifeEvents: [],
    prashna: { lat: 28.61, lng: 77.2, tzName: "Asia/Kolkata" },
    contact,
    consent: true,
  });
  assert.equal(r.success, true, paths(r).join(", "));
});

test("buildBirthProfileData — date known", () => {
  const parsed = rectificationSchema(today).parse(known);
  const d = buildBirthProfileData(parsed, new Date("2026-10-31T06:00:00Z"), today);
  assert.equal(d.dob?.toISOString(), "1988-03-21T00:00:00.000Z");
  assert.equal(d.isTimeUnknown, true);
  assert.equal(d.isDateUnknown, false);
  assert.equal(d.approxWindowStart?.toISOString(), "1970-01-01T22:00:00.000Z");
  assert.equal(d.approxWindowEnd?.toISOString(), "1970-01-01T04:00:00.000Z");
  assert.equal(d.placeName, place.placeName);
  assert.equal(d.prashnaTs, null);
  assert.deepEqual(
    d.lifeEvents.map((e) => e.type),
    ["education_milestone", "marriage", "first_child"],
  );
});

test("buildBirthProfileData — date unknown uses Prashna time and location", () => {
  const now = new Date("2026-10-31T06:00:00Z");
  const parsed = rectificationSchema(today).parse({
    mode: "date_unknown",
    prashna: { lat: 19.076, lng: 72.8777, tzName: "Asia/Kolkata" },
    contact,
    consent: true,
  });
  const d = buildBirthProfileData(parsed, now, today);
  assert.equal(d.dob, null);
  assert.equal(d.isDateUnknown, true);
  assert.equal(d.prashnaTs, now);
  assert.equal(d.prashnaLat, 19.076);
  assert.equal(d.latitude, 19.076);
  assert.equal(d.approxWindowStart, null);
});

test("buildBirthProfileData — date unknown without location falls back to a flagged placeholder", () => {
  const parsed = rectificationSchema(today).parse({ mode: "date_unknown", contact, consent: true });
  const d = buildBirthProfileData(parsed, new Date(), today);
  assert.equal(d.placeName, "Unknown");
  assert.equal(d.latitude, 0);
  assert.equal(d.tzName, "Asia/Kolkata");
  assert.equal(d.prashnaLat, null);
});
