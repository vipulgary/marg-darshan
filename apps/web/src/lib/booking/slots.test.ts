import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDaysKey,
  blocksFor,
  clampWindow,
  generateSlots,
  hourKeys,
  isBookableSlot,
  istDateKey,
  istInstant,
  slotWindow,
} from "./slots";

// Monday 2 Nov 2026, 09:00 IST
const MON_9AM = new Date("2026-11-02T03:30:00Z");

test("IST helpers convert across the UTC date line", () => {
  assert.equal(istInstant("2026-11-02", 10).toISOString(), "2026-11-02T04:30:00.000Z");
  assert.equal(istDateKey(new Date("2026-11-02T19:00:00Z")), "2026-11-03"); // 00:30 IST next day
  assert.equal(addDaysKey("2026-12-31", 1), "2027-01-01");
  assert.deepEqual(slotWindow("2026-11-02", 1), {
    start: new Date("2026-11-01T18:30:00Z"),
    end: new Date("2026-11-02T18:30:00Z"),
  });
});

test("hourly blocks round up", () => {
  assert.deepEqual([30, 60, 90, 120].map(blocksFor), [1, 1, 2, 2]);
  assert.equal(hourKeys(istInstant("2026-11-02", 10), 90).length, 2);
});

test("60-min slots respect working hours and the 2h lead time", () => {
  const [day] = generateSlots({ durationMin: 60, busy: [], now: MON_9AM, days: 1 });
  assert.equal(day.date, "2026-11-02");
  assert.equal(day.closed, false);
  // 09:00 + 2h lead → first slot 11:00, last start 18:00 (ends 19:00)
  assert.equal(day.slots.length, 8);
  assert.equal(day.slots[0].start, "2026-11-02T05:30:00.000Z");
  assert.equal(day.slots.at(-1)!.start, istInstant("2026-11-02", 18).toISOString());
  assert.equal(day.availableCount, 8);
});

test("120-min sessions must finish by closing; 30-min sessions end on the half hour", () => {
  const [long] = generateSlots({ durationMin: 120, busy: [], now: MON_9AM, days: 1 });
  assert.equal(long.slots.length, 7);
  assert.equal(long.slots.at(-1)!.start, istInstant("2026-11-02", 17).toISOString());
  assert.equal(long.slots[0].end, istInstant("2026-11-02", 13).toISOString());
  const [short] = generateSlots({ durationMin: 30, busy: [], now: MON_9AM, days: 1 });
  assert.equal(short.slots[0].end, "2026-11-02T06:00:00.000Z");
});

test("busy ranges block every slot whose hourly blocks overlap", () => {
  // 12:30–13:00 IST
  const busy = [{ start: new Date("2026-11-02T07:00:00Z"), end: new Date("2026-11-02T07:30:00Z") }];
  const unavailable = (duration: number) =>
    generateSlots({ durationMin: duration, busy, now: MON_9AM, days: 1 })[0]
      .slots.filter((s) => !s.available)
      .map((s) => s.start);
  const at = (h: number) => istInstant("2026-11-02", h).toISOString();
  assert.deepEqual(unavailable(30), [at(12)]);
  assert.deepEqual(unavailable(60), [at(12)]);
  assert.deepEqual(unavailable(120), [at(11), at(12)]);
  // a busy range ending exactly at a slot start does not block it
  const edge = [{ start: istInstant("2026-11-02", 11), end: istInstant("2026-11-02", 12) }];
  const slots = generateSlots({ durationMin: 60, busy: edge, now: MON_9AM, days: 1 })[0].slots;
  assert.equal(slots.find((s) => s.start === at(12))!.available, true);
  assert.equal(slots.find((s) => s.start === at(11))!.available, false);
});

test("Sunday is closed and the window is clamped to 14 days", () => {
  const saturday = new Date("2026-10-31T02:30:00Z"); // Sat 08:00 IST
  const days = generateSlots({ durationMin: 60, busy: [], now: saturday, days: 30 });
  assert.equal(days.length, 14);
  assert.equal(days[0].date, "2026-10-31");
  assert.equal(days[1].date, "2026-11-01");
  assert.equal(days[1].closed, true);
  assert.equal(days[1].slots.length, 0);
  assert.equal(days.at(-1)!.date, "2026-11-13");
});

test("clampWindow never starts in the past or beyond the horizon", () => {
  assert.deepEqual(clampWindow({ from: "2020-01-01", days: 3, now: MON_9AM }), { from: "2026-11-02", days: 3 });
  assert.deepEqual(clampWindow({ from: "2026-11-10", now: MON_9AM }), { from: "2026-11-10", days: 6 });
  assert.deepEqual(clampWindow({ from: "2027-05-01", now: MON_9AM }), { from: "2026-11-15", days: 1 });
  assert.deepEqual(clampWindow({ from: "garbage", days: 2, now: MON_9AM }), { from: "2026-11-02", days: 2 });
});

test("isBookableSlot mirrors the generator", () => {
  const opts = { now: MON_9AM };
  assert.equal(isBookableSlot(istInstant("2026-11-02", 11), 60, opts), true);
  assert.equal(isBookableSlot(istInstant("2026-11-02", 10), 60, opts), false); // inside lead time
  assert.equal(isBookableSlot(new Date("2026-11-03T05:00:00Z"), 60, opts), false); // 10:30 IST, not aligned
  assert.equal(isBookableSlot(istInstant("2026-11-08", 11), 60, opts), false); // Sunday
  assert.equal(isBookableSlot(istInstant("2026-11-03", 18), 120, opts), false); // would end at 20:00
  assert.equal(isBookableSlot(istInstant("2026-11-03", 9), 60, opts), false); // before opening
  assert.equal(isBookableSlot(istInstant("2026-11-28", 11), 60, opts), false); // beyond horizon
  assert.equal(isBookableSlot(new Date("invalid"), 60, opts), false);
});
