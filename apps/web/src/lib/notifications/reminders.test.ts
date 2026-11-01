import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeReminderTimes, dueReminders, reminderTemplate, selectDueActions } from "./reminders";

const HOUR = 3_600_000;
const slot = new Date("2026-11-05T04:30:00Z"); // 10:00 IST

describe("computeReminderTimes", () => {
  it("returns T-24h and T-1h when both are in the future", () => {
    const now = new Date(slot.getTime() - 3 * 24 * HOUR);
    assert.deepEqual(computeReminderTimes(slot, now), [
      { kind: "24h", at: new Date("2026-11-04T04:30:00Z") },
      { kind: "1h", at: new Date("2026-11-05T03:30:00Z") },
    ]);
  });
  it("drops T-24h for a booking made less than a day ahead", () => {
    const now = new Date(slot.getTime() - 5 * HOUR);
    assert.deepEqual(
      computeReminderTimes(slot, now).map((r) => r.kind),
      ["1h"],
    );
  });
  it("returns nothing when the session is within the hour", () => {
    assert.deepEqual(computeReminderTimes(slot, new Date(slot.getTime() - 30 * 60_000)), []);
  });
  it("treats a reminder exactly at now as past", () => {
    assert.deepEqual(
      computeReminderTimes(slot, new Date(slot.getTime() - 24 * HOUR)).map((r) => r.kind),
      ["1h"],
    );
  });
});

describe("dueReminders", () => {
  it("is empty before T-24h", () => {
    assert.deepEqual(dueReminders(slot, new Date(slot.getTime() - 25 * HOUR)), []);
  });
  it("returns 24h once due and not sent", () => {
    const now = new Date(slot.getTime() - 23 * HOUR);
    assert.deepEqual(dueReminders(slot, now), ["24h"]);
    assert.deepEqual(dueReminders(slot, now, ["24h"]), []);
  });
  it("collapses overdue reminders into the 1h one", () => {
    assert.deepEqual(dueReminders(slot, new Date(slot.getTime() - 30 * 60_000)), ["1h"]);
  });
  it("is empty once the session started", () => {
    assert.deepEqual(dueReminders(slot, slot), []);
  });
  it("names templates per kind", () => {
    assert.equal(reminderTemplate("24h"), "reminder_24h");
  });
});

describe("selectDueActions", () => {
  const id = "a1";
  const at = (msBefore: number) => new Date(slot.getTime() - msBefore);
  const run = (now: Date, sent: string[] = [], createdAt: Date | null = new Date("2026-10-01T00:00:00Z")) =>
    selectDueActions([{ id, slotStart: slot, createdAt }], new Map([[id, new Set(sent)]]), now).map((a) => a.kind);

  it("sends the 24h reminder once it is due", () => {
    assert.deepEqual(run(at(23.9 * HOUR)), ["24h"]);
    assert.deepEqual(run(at(23.9 * HOUR), ["reminder_24h"]), []);
  });
  it("skips a 24h reminder that is more than 6h late", () => {
    assert.deepEqual(run(at(17 * HOUR)), []);
  });
  it("skips reminders scheduled before the booking was made", () => {
    assert.deepEqual(run(at(10 * HOUR), [], at(12 * HOUR)), []);
  });
  it("sends 1h plus the Jyotish 2h pre-read close to the slot", () => {
    assert.deepEqual(run(at(50 * 60_000), ["reminder_24h"]), ["1h", "preread_2h"]);
    assert.deepEqual(run(at(50 * 60_000), ["reminder_24h", "reminder_1h", "jyotish_preread_2h"]), []);
  });
  it("sends only the pre-read between T-2h and T-1h", () => {
    assert.deepEqual(run(at(1.5 * HOUR), ["reminder_24h"]), ["preread_2h"]);
  });
  it("skips the 2h pre-read for bookings made inside the 2h window", () => {
    assert.deepEqual(run(at(50 * 60_000), [], at(90 * 60_000)), ["1h"]);
  });
  it("ignores started and far-away sessions", () => {
    assert.deepEqual(run(slot), []);
    assert.deepEqual(run(at(26 * HOUR)), []);
  });
});
