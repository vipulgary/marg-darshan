import assert from "node:assert/strict";
import { test } from "node:test";
import { manageToken, readManageToken } from "./links";
import { manageOptions } from "./policy";

const NOW = new Date("2026-11-02T05:00:00Z");
const H = 3_600_000;
const at = (h: number) => new Date(NOW.getTime() + h * H);

test("more than cancellationHours ahead: reschedule, cancel and refund allowed", () => {
  assert.deepEqual(manageOptions(at(25), NOW, "CONFIRMED", 24), { canReschedule: true, canCancel: true, refundEligible: true, reason: "ok" });
  assert.equal(manageOptions(at(24), NOW, "PARTIALLY_PAID", 24).canCancel, true);
});

test("inside the window: nothing online", () => {
  const o = manageOptions(at(23.9), NOW, "CONFIRMED", 24);
  assert.equal(o.reason, "too_late");
  assert.equal(o.canReschedule || o.canCancel || o.refundEligible, false);
});

test("past, cancelled and non-manageable statuses", () => {
  assert.equal(manageOptions(at(-1), NOW, "CONFIRMED", 24).reason, "past");
  assert.equal(manageOptions(at(48), NOW, "CANCELLED", 24).reason, "cancelled");
  assert.equal(manageOptions(at(48), NOW, "REFUNDED", 24).reason, "cancelled");
  assert.equal(manageOptions(at(48), NOW, "HELD", 24).reason, "not_manageable");
  assert.equal(manageOptions(at(48), NOW, "COMPLETED", 24).canCancel, false);
});

test("manage token round-trips and expires a day after the slot", () => {
  const slot = at(48);
  const tok = manageToken("appt-1", slot, "s3cret", NOW.getTime());
  assert.equal(readManageToken(tok, "s3cret", NOW.getTime()), "appt-1");
  assert.equal(readManageToken(tok, "other", NOW.getTime()), null);
  assert.equal(readManageToken(tok, "s3cret", slot.getTime() + 23 * H), "appt-1");
  assert.equal(readManageToken(tok, "s3cret", slot.getTime() + 25 * H), null);
  assert.equal(readManageToken(`${tok}x`, "s3cret", NOW.getTime()), null);
});
