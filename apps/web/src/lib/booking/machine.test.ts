import assert from "node:assert/strict";
import { test } from "node:test";
import { InvalidTransitionError, canTransition, transition } from "./machine";

test("full upfront happy path", () => {
  let s = transition("DRAFT", "HOLD");
  s = transition(s, "START_PAYMENT");
  s = transition(s, "PAYMENT_CAPTURED");
  assert.equal(s, "CONFIRMED");
  assert.equal(transition(s, "COMPLETE"), "COMPLETED");
});

test("split plan goes through PARTIALLY_PAID", () => {
  const s = transition("PENDING_PAYMENT", "ADVANCE_CAPTURED");
  assert.equal(s, "PARTIALLY_PAID");
  assert.equal(transition(s, "BALANCE_CAPTURED"), "CONFIRMED");
});

test("hold expiry and late capture", () => {
  assert.equal(transition("HELD", "HOLD_EXPIRED"), "EXPIRED");
  assert.equal(transition("EXPIRED", "PAYMENT_CAPTURED"), "CONFIRMED");
});

test("invalid transitions throw", () => {
  assert.equal(canTransition("COMPLETED", "CANCEL"), false);
  assert.throws(() => transition("DRAFT", "PAYMENT_CAPTURED"), InvalidTransitionError);
});
