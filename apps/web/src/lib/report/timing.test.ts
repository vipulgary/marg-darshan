import assert from "node:assert/strict";
import { test } from "node:test";
import type { DashaPeriod, PlanetKey } from "@/lib/contracts";
import { goodWindows, sevaSuggestion, studyGuidance, windowsSentence } from "./timing";

const antar = (lord: PlanetKey, start: string, end: string): DashaPeriod => ({ lord, start, end });
const dashas: DashaPeriod[] = [
  {
    lord: "jupiter",
    start: "2020-01-01",
    end: "2036-01-01",
    antardashas: [antar("venus", "2026-01-01", "2028-01-01"), antar("mars", "2028-01-01", "2029-01-01"), antar("saturn", "2029-01-01", "2031-06-01")],
  },
];
const houseOf = () => 3;

test("Aries: Venus (7th lord, marriage karaka) period is a marriage window; Mars 8th-lord penalty does not apply (Lagna lord)", () => {
  const w = goodWindows("marriage", 1, houseOf, dashas, "2026-06-01");
  assert.equal(w[0].lord, "venus");
  assert.equal(w[0].from, "2026-06-01"); // a running period starts today
});

test("Aries: Saturn (10th lord) is a career window", () => {
  assert.ok(goodWindows("career", 1, houseOf, dashas, "2026-06-01").some((w) => w.lord === "saturn"));
});

test("sentences are plain, bilingual and punctuated", () => {
  const w = goodWindows("marriage", 1, houseOf, dashas, "2026-06-01");
  assert.match(windowsSentence("marriage", w, "hi")!, /।$/);
  assert.match(windowsSentence("marriage", w, "en")!, /\.$/);
  assert.equal(windowsSentence("career", [], "en"), null);
  assert.match(studyGuidance(1, houseOf, "en"), /^Study direction:/);
  assert.match(sevaSuggestion("jupiter", "en"), /gaushala/);
});
