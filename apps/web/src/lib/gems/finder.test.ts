import assert from "node:assert/strict";
import { test } from "node:test";
import { findGems, recommendedWeight, safePlanets } from "./finder";

test("Gemini: Mercury, Venus (5th lord) safe; Mars (6th) and Saturn (8th+9th) not", () => {
  const safe = safePlanets(3).map((s) => s.planet);
  assert.ok(safe.includes("mercury") && safe.includes("venus"));
  assert.ok(!safe.includes("mars") && !safe.includes("saturn"));
});

test("Aries: Lagna lord Mars is safe even though it rules the 8th", () => {
  assert.equal(safePlanets(1)[0].planet, "mars");
});

test("ratti follows body weight within the stone's range", () => {
  assert.equal(recommendedWeight("mercury", 50), 5);
  assert.equal(recommendedWeight("mercury", 120), 6);
  assert.equal(recommendedWeight("moon", 30), 4);
});

test("problems steer the pick; nothing unsafe is ever suggested", () => {
  const r = findGems(3, ["marriage"], 60, "en");
  assert.ok(r.gems.length >= 1);
  assert.ok(r.gems.every((g) => !["mars", "saturn"].includes(g.planet)));
  assert.ok(r.gems[0].helps.includes("marriage"));
});
