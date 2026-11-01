import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MIN_LINK_LIFETIME_MS,
  QuoteError,
  balanceDueAt,
  fromPaise,
  installments,
  isSplitAllowed,
  quoteFor,
  toPaise,
} from "./plan";

const now = new Date("2026-11-02T04:30:00Z"); // 10:00 IST
const HOUR = 3_600_000;

describe("quoteFor", () => {
  it("prices a full upfront astrology session from the catalog", () => {
    const q = quoteFor({ serviceSlug: "astrology", durationMin: 60, planType: "FULL_UPFRONT" });
    assert.deepEqual(q, {
      serviceSlug: "astrology",
      durationMin: 60,
      planType: "FULL_UPFRONT",
      totalInr: 2100,
      advancePct: 100,
      advanceInr: 2100,
      balanceInr: 0,
    });
  });

  it("splits vastu 50/50", () => {
    const q = quoteFor({ serviceSlug: "vastu", durationMin: 120, planType: "SPLIT_PLAN" });
    assert.equal(q.totalInr, 5100);
    assert.equal(q.advanceInr, 2550);
    assert.equal(q.balanceInr, 2550);
    assert.equal(q.advanceInr + q.balanceInr, q.totalInr);
  });

  it("rounds an odd advance and keeps the sum exact", () => {
    const q = quoteFor({ serviceSlug: "vastu", durationMin: 60, planType: "SPLIT_PLAN" });
    assert.equal(q.totalInr, 3100);
    assert.equal(q.advanceInr + q.balanceInr, 3100);
  });

  it("rejects split for services that do not allow it", () => {
    assert.equal(isSplitAllowed("astrology"), false);
    assert.throws(
      () => quoteFor({ serviceSlug: "astrology", durationMin: 30, planType: "SPLIT_PLAN" }),
      (e: unknown) => e instanceof QuoteError && e.code === "split_not_allowed",
    );
  });

  it("rejects unknown services and durations", () => {
    assert.throws(() => quoteFor({ serviceSlug: "tarot", durationMin: 30, planType: "FULL_UPFRONT" }), /unknown_service/);
    assert.throws(() => quoteFor({ serviceSlug: "astrology", durationMin: 45, planType: "FULL_UPFRONT" }), /invalid_duration/);
  });
});

describe("installments", () => {
  it("returns one installment for full upfront", () => {
    const q = quoteFor({ serviceSlug: "gems", durationMin: 30, planType: "FULL_UPFRONT" });
    assert.deepEqual(installments(q, { now }), [{ installmentNo: 1, amountInr: 1100, dueAt: now }]);
  });

  it("returns advance now and balance before the slot for split", () => {
    const q = quoteFor({ serviceSlug: "vastu", durationMin: 120, planType: "SPLIT_PLAN" });
    const slotStart = new Date(now.getTime() + 5 * 24 * HOUR);
    const [first, second] = installments(q, { now, slotStart, daysBefore: 2 });
    assert.deepEqual(first, { installmentNo: 1, amountInr: 2550, dueAt: now });
    assert.equal(second.installmentNo, 2);
    assert.equal(second.amountInr, 2550);
    assert.equal(second.dueAt.getTime(), slotStart.getTime() - 2 * 24 * HOUR);
  });
});

describe("balanceDueAt", () => {
  it("uses N days before the slot when there is time", () => {
    const slot = new Date(now.getTime() + 3 * 24 * HOUR);
    assert.equal(balanceDueAt(slot, now, 1).getTime(), slot.getTime() - 24 * HOUR);
  });
  it("falls back to 1h before the slot when the slot is close", () => {
    const slot = new Date(now.getTime() + 5 * HOUR);
    assert.equal(balanceDueAt(slot, now, 1).getTime(), slot.getTime() - HOUR);
  });
  it("never expires sooner than Razorpay's minimum link lifetime", () => {
    const slot = new Date(now.getTime() + HOUR);
    assert.equal(balanceDueAt(slot, now, 1).getTime(), now.getTime() + MIN_LINK_LIFETIME_MS);
  });
});

describe("paise helpers", () => {
  it("converts whole rupees", () => {
    assert.equal(toPaise(0), 0);
    assert.equal(toPaise(1), 100);
    assert.equal(toPaise(2550), 255000);
    assert.equal(toPaise(100000), 10000000);
  });
  it("rounds half-up on the decimal value, immune to float error", () => {
    assert.equal(toPaise(10.005), 1001);
    assert.equal(toPaise(1.005), 101);
    assert.equal(toPaise(0.1 + 0.2), 30);
    assert.equal(toPaise(19.994), 1999);
  });
  it("rejects negative and non-finite amounts", () => {
    assert.throws(() => toPaise(-1), RangeError);
    assert.throws(() => toPaise(Number.NaN), RangeError);
    assert.throws(() => toPaise(Number.POSITIVE_INFINITY), RangeError);
  });
  it("converts paise back to rupees", () => {
    assert.equal(fromPaise(255000), 2550);
    assert.equal(fromPaise(1001), 10.01);
    assert.throws(() => fromPaise(10.5), RangeError);
  });
});
