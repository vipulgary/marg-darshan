import assert from "node:assert/strict";
import { test } from "node:test";
import { WINDOW_PRESETS, formatHHmm, parseHHmm, resolveWindow, toDbTime } from "./windows";

test("parseHHmm accepts 00:00..23:59 and 24:00 only", () => {
  assert.equal(parseHHmm("00:00"), 0);
  assert.equal(parseHHmm("04:30"), 270);
  assert.equal(parseHHmm("23:59"), 1439);
  assert.equal(parseHHmm("24:00"), 1440);
  assert.equal(parseHHmm("24:01"), null);
  assert.equal(parseHHmm("12:60"), null);
  assert.equal(parseHHmm("9:00"), null);
  assert.equal(parseHHmm("ab:cd"), null);
});

test("formatHHmm round-trips and keeps 24:00", () => {
  assert.equal(formatHHmm(270), "04:30");
  assert.equal(formatHHmm(1440), "24:00");
  assert.equal(formatHHmm(0), "00:00");
});

test("daytime presets resolve to plain windows", () => {
  const m = resolveWindow("morning");
  assert.deepEqual(m, { start: "04:00", end: "10:00", startMin: 240, endMin: 600, overnight: false, durationMin: 360 });
  assert.equal(resolveWindow("day")?.durationMin, 360);
  assert.equal(resolveWindow("evening")?.end, "22:00");
});

test("night preset wraps past midnight", () => {
  const n = resolveWindow("night");
  assert.equal(n?.overnight, true);
  assert.equal(n?.start, WINDOW_PRESETS.night.start);
  assert.equal(n?.end, "04:00");
  assert.equal(n?.durationMin, 6 * 60);
});

test("full day is 24h and not overnight", () => {
  const f = resolveWindow("full");
  assert.equal(f?.overnight, false);
  assert.equal(f?.durationMin, 1440);
  assert.equal(f?.endMin, 1440);
});

test("custom windows: normal, overnight wrap, invalid", () => {
  assert.equal(resolveWindow("custom", { start: "05:15", end: "07:45" })?.durationMin, 150);
  const wrap = resolveWindow("custom", { start: "23:30", end: "01:00" });
  assert.equal(wrap?.overnight, true);
  assert.equal(wrap?.durationMin, 90);
  assert.equal(resolveWindow("custom", { start: "05:00", end: "05:00" }), null);
  assert.equal(resolveWindow("custom", { start: "05:00" }), null);
  assert.equal(resolveWindow("custom", { start: "24:00", end: "02:00" }), null);
  assert.equal(resolveWindow("custom", { start: "25:00", end: "02:00" }), null);
  assert.equal(resolveWindow("custom"), null);
});

test("toDbTime builds a TIME value and clamps end-of-day", () => {
  assert.equal(toDbTime(270).toISOString(), "1970-01-01T04:30:00.000Z");
  assert.equal(toDbTime(1440).toISOString(), "1970-01-01T23:59:59.000Z");
  assert.equal(toDbTime(0).toISOString(), "1970-01-01T00:00:00.000Z");
});
