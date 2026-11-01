import assert from "node:assert/strict";
import { test } from "node:test";
import { QuoteError, canSplit, quote } from "./pricing";

test("full upfront astrology quote", () => {
  assert.deepEqual(quote({ serviceSlug: "astrology", durationMin: 60, mode: "ONLINE_ZOOM" }), {
    totalInr: 2100,
    advanceInr: 2100,
    balanceInr: 0,
    planType: "FULL_UPFRONT",
  });
});

test("split request falls back to full when the service does not allow it", () => {
  assert.equal(canSplit("astrology"), false);
  const q = quote({ serviceSlug: "astrology", durationMin: 30, mode: "PERSONAL_VISIT", planType: "SPLIT_PLAN" });
  assert.equal(q.planType, "FULL_UPFRONT");
  assert.equal(q.advanceInr, 1100);
  assert.equal(q.balanceInr, 0);
});

test("vastu split plan takes the advance percentage", () => {
  assert.equal(canSplit("vastu"), true);
  const q = quote({ serviceSlug: "vastu", durationMin: 120, mode: "PERSONAL_VISIT", planType: "SPLIT_PLAN" });
  assert.deepEqual(q, { totalInr: 5100, advanceInr: 2550, balanceInr: 2550, planType: "SPLIT_PLAN" });
  const q60 = quote({ serviceSlug: "vastu", durationMin: 60, mode: "ONLINE_ZOOM", planType: "SPLIT_PLAN" });
  assert.equal(q60.advanceInr + q60.balanceInr, q60.totalInr);
  assert.equal(q60.advanceInr, 1550);
});

test("invalid combinations throw QuoteError", () => {
  assert.throws(() => quote({ serviceSlug: "nope", durationMin: 60, mode: "ONLINE_ZOOM" }), QuoteError);
  assert.throws(
    () => quote({ serviceSlug: "astrology", durationMin: 90, mode: "ONLINE_ZOOM" }),
    (e: unknown) => e instanceof QuoteError && e.code === "invalid_duration",
  );
});
