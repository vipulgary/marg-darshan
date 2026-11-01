import assert from "node:assert/strict";
import { test } from "node:test";
import { bhagyank, mulank, nameNumber, numerology, reduce } from "./index";

test("reduce to a single digit", () => {
  assert.equal(reduce(29), 2); // 2+9=11 → 2
  assert.equal(reduce(9), 9);
  assert.equal(reduce(0), 0);
});

test("mulank and bhagyank from an ISO date", () => {
  assert.equal(mulank("1990-08-15"), 6); // 15 → 6
  assert.equal(mulank("2001-01-29"), 2); // 29 → 11 → 2
  assert.equal(bhagyank("1990-08-15"), 6); // 1+9+9+0+0+8+1+5 = 33 → 6
});

test("Chaldean name number ignores spaces and non-Latin letters", () => {
  assert.equal(nameNumber("Asha"), reduce(1 + 3 + 5 + 1)); // 10 → 1
  assert.equal(nameNumber("A sha!"), nameNumber("Asha"));
  assert.equal(nameNumber("आशा"), null);
});

test("numerology result has lore and lucky numbers", () => {
  const r = numerology("Asha Verma", "1990-08-15");
  assert.equal(r.mulank, 6);
  assert.ok(r.lucky.includes(6));
  assert.ok(["good", "ok", "weak"].includes(r.nameFit ?? ""));
  assert.ok(r.mulankLore.colours.hi && r.mulankLore.gem.en);
});
