import assert from "node:assert/strict";
import { test } from "node:test";
import type { PlanetKey } from "@/lib/contracts";
import { type PlanetPos, predictArea } from "./predict";

const KEYS: PlanetKey[] = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];
const chart = (houses: number[]): PlanetPos[] => KEYS.map((key, i) => ({ key, house: houses[i], dignity: "neutral" }));
const ctx = (houses: number[], lagnaSign = 1) => ({ lagnaSign, planets: chart(houses), dashaLords: [] as PlanetKey[], dashaUntil: null, fieldText: "X." });

test("gives three plain-language paragraphs without planet names", () => {
  const p = predictArea("career", ctx([10, 4, 1, 11, 9, 7, 3, 6, 12]), "en");
  assert.equal(p.paragraphs.length, 3);
  assert.doesNotMatch(p.paragraphs.join(" "), /Saturn|Jupiter|Mars|Venus|Mercury|Rahu|Ketu/);
});

test("different charts read differently", () => {
  const a = predictArea("career", ctx([10, 4, 1, 11, 9, 7, 3, 6, 12]), "en");
  const b = predictArea("career", ctx([8, 6, 12, 8, 12, 6, 8, 2, 8]), "en");
  assert.notEqual(a.paragraphs.join(), b.paragraphs.join());
  assert.notEqual(a.tone, b.tone);
});

test("running dasha of the house lord marks the area active", () => {
  const p = predictArea("career", { ...ctx([10, 4, 1, 11, 9, 7, 3, 6, 12]), dashaLords: ["saturn"], dashaUntil: "2040" }, "en");
  assert.match(p.paragraphs[2], /until 2040/);
});
