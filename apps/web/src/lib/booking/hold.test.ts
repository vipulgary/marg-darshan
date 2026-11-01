import assert from "node:assert/strict";
import { test } from "node:test";
import { FIRM_STATUSES, blockingAppointmentWhere, formatCountdown, holdExpiresAt, holdRemainingMs, isHoldActive } from "./hold";

const NOW = new Date("2026-11-02T05:00:00Z");

test("hold lasts SETTINGS.holdMinutes", () => {
  assert.equal(holdExpiresAt(NOW).toISOString(), "2026-11-02T05:10:00.000Z");
  assert.equal(holdExpiresAt(NOW, 1).toISOString(), "2026-11-02T05:01:00.000Z");
});

test("isHoldActive only for hold statuses with a future expiry", () => {
  const later = new Date(NOW.getTime() + 60_000);
  const earlier = new Date(NOW.getTime() - 1);
  assert.equal(isHoldActive({ status: "HELD", holdExpiresAt: later }, NOW), true);
  assert.equal(isHoldActive({ status: "PENDING_PAYMENT", holdExpiresAt: later.toISOString() }, NOW), true);
  assert.equal(isHoldActive({ status: "HELD", holdExpiresAt: earlier }, NOW), false);
  assert.equal(isHoldActive({ status: "HELD", holdExpiresAt: NOW }, NOW), false);
  assert.equal(isHoldActive({ status: "HELD", holdExpiresAt: null }, NOW), false);
  assert.equal(isHoldActive({ status: "CONFIRMED", holdExpiresAt: later }, NOW), false);
});

test("countdown formatting", () => {
  assert.equal(formatCountdown(582_000), "09:42");
  assert.equal(formatCountdown(500), "00:01");
  assert.equal(formatCountdown(-5), "00:00");
  assert.equal(holdRemainingMs("2026-11-02T05:00:30Z", NOW.getTime()), 30_000);
  assert.equal(holdRemainingMs("2026-11-02T04:00:00Z", NOW.getTime()), 0);
});

test("blocking filter: firm statuses always, holds only while active", () => {
  assert.deepEqual(FIRM_STATUSES, ["PARTIALLY_PAID", "CONFIRMED"]);
  assert.deepEqual(blockingAppointmentWhere(NOW), {
    OR: [
      { status: { in: ["PARTIALLY_PAID", "CONFIRMED"] } },
      { status: { in: ["HELD", "PENDING_PAYMENT"] }, holdExpiresAt: { gt: NOW } },
    ],
  });
});
