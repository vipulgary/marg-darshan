import assert from "node:assert/strict";
import { test } from "node:test";
import { isIsoDate, sortLifeEvents, todayIST, validateLifeEvents } from "./events";

const today = "2026-10-31";
const dob = "1990-05-14";

test("isIsoDate rejects impossible dates", () => {
  assert.equal(isIsoDate("2024-02-29"), true);
  assert.equal(isIsoDate("2023-02-29"), false);
  assert.equal(isIsoDate("2023-13-01"), false);
  assert.equal(isIsoDate("2023-1-01"), false);
  assert.equal(isIsoDate(""), false);
});

test("todayIST rolls over at 18:30 UTC", () => {
  assert.equal(todayIST(new Date("2026-10-31T18:29:00Z")), "2026-10-31");
  assert.equal(todayIST(new Date("2026-10-31T18:30:00Z")), "2026-11-01");
});

test("valid events are returned sorted by date", () => {
  const res = validateLifeEvents(
    [
      { type: "job_start", date: "2014-07-01" },
      { type: "marriage", date: "2018-02-11", note: "  arranged  " },
      { type: "education_milestone", date: "2012-05-30" },
    ],
    { dob, today },
  );
  assert.equal(res.ok, true);
  assert.deepEqual(
    res.events.map((e) => e.date),
    ["2012-05-30", "2014-07-01", "2018-02-11"],
  );
  assert.equal(res.events[2].note, "arranged");
});

test("blank rows are skipped but count towards nothing", () => {
  const res = validateLifeEvents(
    [
      { type: "marriage", date: "2018-02-11" },
      { type: "", date: "" },
      { type: "job_start", date: "2014-07-01" },
    ],
    { dob, today },
  );
  assert.equal(res.ok, false);
  assert.equal(res.countError, "tooFew");
  assert.deepEqual(res.rowErrors, [null, null, null]);
});

test("dates must be after DOB and not in the future", () => {
  const res = validateLifeEvents(
    [
      { type: "marriage", date: "1989-01-01" },
      { type: "accident", date: dob },
      { type: "job_change", date: "2027-01-01" },
      { type: "relocation_abroad", date: today },
    ],
    { dob, today },
  );
  assert.equal(res.ok, false);
  assert.equal(res.rowErrors[0]?.date, "beforeBirth");
  assert.equal(res.rowErrors[1]?.date, "beforeBirth");
  assert.equal(res.rowErrors[2]?.date, "inFuture");
  assert.equal(res.rowErrors[3], null);
  assert.equal(res.events.length, 1);
});

test("partially filled rows report the missing field", () => {
  const res = validateLifeEvents(
    [
      { type: "", date: "2010-01-01" },
      { type: "marriage", date: "" },
      { type: "bogus", date: "2010-13-01" },
    ],
    { dob, today, min: 0 },
  );
  assert.equal(res.rowErrors[0]?.type, "typeRequired");
  assert.equal(res.rowErrors[1]?.date, "dateRequired");
  assert.deepEqual(res.rowErrors[2], { type: "typeRequired", date: "dateInvalid" });
  assert.equal(res.countError, undefined);
});

test("count limits: min 3, max 6, min overridable", () => {
  const ev = (d: string) => ({ type: "job_change", date: d });
  const seven = ["2010", "2011", "2012", "2013", "2014", "2015", "2016"].map((y) => ev(`${y}-01-01`));
  assert.equal(validateLifeEvents(seven, { dob, today }).countError, "tooMany");
  assert.equal(validateLifeEvents(seven.slice(0, 6), { dob, today }).ok, true);
  assert.equal(validateLifeEvents([], { dob, today, min: 0 }).ok, true);
});

test("without a DOB only the future check applies", () => {
  const res = validateLifeEvents([{ type: "marriage", date: "1950-01-01" }], { dob: null, today, min: 1 });
  assert.equal(res.ok, true);
});

test("sortLifeEvents is stable for equal dates", () => {
  const s = sortLifeEvents([
    { date: "2020-01-01", id: "b" },
    { date: "2019-01-01", id: "a" },
    { date: "2020-01-01", id: "c" },
  ]);
  assert.deepEqual(
    s.map((e) => e.id),
    ["a", "b", "c"],
  );
});
