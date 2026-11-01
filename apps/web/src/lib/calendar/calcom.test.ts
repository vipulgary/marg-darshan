import assert from "node:assert/strict";
import { test } from "node:test";
import { parseBookingResult, parseBusy } from "./calcom";

test("parseBusy keeps active bookings and drops junk", () => {
  const busy = parseBusy({
    status: "success",
    data: [
      { uid: "a", start: "2026-11-03T05:30:00.000Z", end: "2026-11-03T06:30:00.000Z", status: "accepted" },
      { uid: "b", start: "2026-11-03T07:30:00.000Z", end: "2026-11-03T08:30:00.000Z", status: "cancelled" },
      { uid: "c", start: "not a date", end: "2026-11-03T08:30:00.000Z" },
      null,
      { uid: "d", startTime: "2026-11-04T05:30:00Z", endTime: "2026-11-04T06:00:00Z" },
    ],
  });
  assert.equal(busy.length, 2);
  assert.equal(busy[0].start.toISOString(), "2026-11-03T05:30:00.000Z");
  assert.deepEqual(parseBusy({ error: "x" }), []);
  assert.deepEqual(parseBusy(null), []);
});

test("parseBookingResult extracts uid and an https meeting url", () => {
  assert.deepEqual(parseBookingResult({ status: "success", data: { uid: "u1", meetingUrl: "https://zoom.us/j/1" } }), {
    uid: "u1",
    meetingUrl: "https://zoom.us/j/1",
  });
  assert.deepEqual(parseBookingResult({ data: { uid: "u2", location: "Office" } }), { uid: "u2", meetingUrl: undefined });
  assert.throws(() => parseBookingResult({ data: {} }));
});
