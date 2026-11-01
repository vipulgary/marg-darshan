import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fieldErrors,
  isNotFuture,
  isRealDate,
  joinDob,
  joinTob,
  kundaliRequestSchema,
  normalizeIndianPhone,
  splitDob,
  splitTob,
} from "./schema";

const valid = {
  name: "Rahul Sharma",
  gender: "male",
  dob: "1990-03-12",
  tob: "10:30",
  place: { placeName: "Jaipur, Rajasthan, India", latitude: 26.9124, longitude: 75.7873, tzName: "Asia/Kolkata" },
  email: "rahul@example.com",
  whatsapp: "98290 12345",
  chartStyle: "north",
  lang: "hi",
  consent: true,
};

describe("kundaliRequestSchema", () => {
  it("accepts a complete request", () => {
    const r = kundaliRequestSchema.safeParse(valid);
    assert.equal(r.success, true);
    assert.equal(kundaliRequestSchema.safeParse({ ...valid, whatsapp: "" }).success, true);
    assert.equal(kundaliRequestSchema.safeParse({ ...valid, whatsapp: undefined }).success, true);
    assert.equal(kundaliRequestSchema.safeParse({ ...valid, whatsapp: "+91 9829012345" }).success, true);
  });

  it("returns i18n error keys per field", () => {
    const r = kundaliRequestSchema.safeParse({
      ...valid,
      name: " ",
      gender: "",
      dob: "1990-02-30",
      tob: "",
      place: null,
      email: "nope",
      whatsapp: "12345",
      consent: false,
    });
    assert.equal(r.success, false);
    if (r.success) return;
    assert.deepEqual(fieldErrors(r.error), {
      name: "nameRequired",
      gender: "genderRequired",
      dob: "dobInvalid",
      tob: "tobRequired",
      place: "placeRequired",
      email: "emailInvalid",
      whatsapp: "phoneInvalid",
      consent: "consentRequired",
    });
  });

  it("rejects future and pre-1900 dates", () => {
    const future = kundaliRequestSchema.safeParse({ ...valid, dob: "2999-01-01" });
    assert.equal(future.success, false);
    if (!future.success) assert.equal(fieldErrors(future.error).dob, "dobFuture");
    const old = kundaliRequestSchema.safeParse({ ...valid, dob: "1899-12-31" });
    if (!old.success) assert.equal(fieldErrors(old.error).dob, "dobInvalid");
    else assert.fail("1899 should be rejected");
  });

  it("validates coordinates and timezone of a manual place", () => {
    const r = kundaliRequestSchema.safeParse({ ...valid, place: { ...valid.place, latitude: 91 } });
    assert.equal(r.success, false);
    if (!r.success) assert.equal(fieldErrors(r.error).place, "latInvalid");
    const tz = kundaliRequestSchema.safeParse({ ...valid, place: { ...valid.place, tzName: "Mars/Olympus" } });
    if (!tz.success) assert.equal(fieldErrors(tz.error).place, "tzInvalid");
    else assert.fail("bad tz should be rejected");
  });
});

describe("date helpers", () => {
  it("isRealDate rejects impossible dates", () => {
    assert.equal(isRealDate("2000-02-29"), true);
    assert.equal(isRealDate("1900-02-29"), false);
    assert.equal(isRealDate("2023-04-31"), false);
    assert.equal(isRealDate("2023-4-1"), false);
  });
  it("isNotFuture compares IST calendar days", () => {
    // 2024-05-01 20:00 UTC is already 2024-05-02 in India
    const now = new Date("2024-05-01T20:00:00Z");
    assert.equal(isNotFuture("2024-05-02", now), true);
    assert.equal(isNotFuture("2024-05-03", now), false);
  });
});

describe("form helpers", () => {
  it("joins and splits DOB", () => {
    assert.equal(joinDob({ day: "5", month: "3", year: "1990" }), "1990-03-05");
    assert.equal(joinDob({ day: "", month: "3", year: "1990" }), "");
    assert.deepEqual(splitDob("1990-03-05"), { day: "5", month: "3", year: "1990" });
    assert.equal(splitDob("1990-13-05"), null);
    assert.equal(splitDob(null), null);
  });

  it("converts 12-hour selects to 24h and back", () => {
    assert.equal(joinTob({ hour: "12", minute: "05", period: "AM" }), "00:05");
    assert.equal(joinTob({ hour: "12", minute: "30", period: "PM" }), "12:30");
    assert.equal(joinTob({ hour: "7", minute: "45", period: "PM" }), "19:45");
    assert.equal(joinTob({ hour: "7", minute: "45", period: "" }), "");
    assert.deepEqual(splitTob("00:05"), { hour: "12", minute: "05", period: "AM" });
    assert.deepEqual(splitTob("12:30"), { hour: "12", minute: "30", period: "PM" });
    assert.deepEqual(splitTob("19:45:00"), { hour: "7", minute: "45", period: "PM" });
    assert.equal(splitTob("25:00"), null);
    for (const t of ["00:00", "06:09", "11:59", "12:00", "13:01", "23:59"]) assert.equal(joinTob(splitTob(t)!), t);
  });

  it("normalises Indian mobile numbers", () => {
    assert.equal(normalizeIndianPhone("98290 12345"), "+919829012345");
    assert.equal(normalizeIndianPhone("+91-98290-12345"), "+919829012345");
    assert.equal(normalizeIndianPhone(""), undefined);
  });
});
