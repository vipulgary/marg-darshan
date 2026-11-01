import assert from "node:assert/strict";
import { test } from "node:test";
import { currentSlot, dayMuhurat, nextGoodWindow } from "./choghadiya";

// A sample Sunday in New Delhi (IST): sunrise 06:00, sunset 18:00, next sunrise 06:00 → 90-minute parts.
const at = (h: number, m = 0, day = 1) => new Date(Date.UTC(2026, 10, day, h - 5, m - 30));
const sun = dayMuhurat(0, at(6), at(18), at(6, 0, 2));

test("Sunday day and night choghadiya sequences match the classical tables", () => {
  assert.deepEqual(sun.slots.filter((s) => !s.night).map((s) => s.name), ["udveg", "char", "labh", "amrit", "kaal", "shubh", "rog", "udveg"]);
  assert.deepEqual(sun.slots.filter((s) => s.night).map((s) => s.name), ["shubh", "amrit", "char", "rog", "kaal", "labh", "udveg", "shubh"]);
});

test("first day choghadiya per weekday (Mon … Sat)", () => {
  const first = [1, 2, 3, 4, 5, 6].map((w) => dayMuhurat(w, at(6), at(18), at(6, 0, 2)).slots[0].name);
  assert.deepEqual(first, ["amrit", "rog", "labh", "shubh", "char", "kaal"]);
  const monNight = dayMuhurat(1, at(6), at(18), at(6, 0, 2)).slots.filter((s) => s.night).map((s) => s.name);
  assert.deepEqual(monNight, ["char", "rog", "kaal", "labh", "udveg", "shubh", "amrit", "char"]);
});

test("Rahu Kaal, Yamaganda, Gulika and Abhijit", () => {
  assert.deepEqual([sun.rahuKaal.start, sun.rahuKaal.end], [at(16, 30), at(18)]); // Sunday: 8th part
  assert.deepEqual([sun.yamaganda.start, sun.yamaganda.end], [at(12), at(13, 30)]); // 5th part
  assert.deepEqual([sun.gulika.start, sun.gulika.end], [at(15), at(16, 30)]); // 7th part
  assert.deepEqual([sun.abhijit.start, sun.abhijit.end], [at(11, 36), at(12, 24)]);
  assert.equal(dayMuhurat(3, at(6), at(18), at(6, 0, 2)).abhijitAvoid, true);
});

test("next good window skips bad slots and Rahu Kaal", () => {
  assert.deepEqual(currentSlot(sun, at(6, 10))?.name, "udveg");
  assert.deepEqual(nextGoodWindow(sun, at(6, 10)), { start: at(9), end: at(10, 30) }); // Labh
  assert.deepEqual(nextGoodWindow(sun, at(6, 10), { travel: true }), { start: at(7, 30), end: at(9) }); // Char ok for travel
  assert.deepEqual(nextGoodWindow(sun, at(9, 40)), { start: at(9, 40), end: at(10, 30) }); // already inside Labh
  assert.deepEqual(nextGoodWindow(sun, at(10, 20), { minutes: 30 }), { start: at(10, 30), end: at(12) }); // Amrit
});
