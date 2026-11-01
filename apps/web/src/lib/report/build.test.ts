import assert from "node:assert/strict";
import { test } from "node:test";
import { FIXTURE_CHART } from "@/lib/kundali/fixture";
import { LAGNA } from "./content/lagna";
import { NAKSHATRA } from "./content/nakshatra";
import { PLANET_IN_HOUSE } from "./content/planets";
import { RASHI } from "./content/rashi";
import { DOSHA_REMEDIES } from "./content/remedies";
import { buildReport, dignity, luckyGems, signFrom } from "./build";

test("content is complete and bilingual", () => {
  for (let s = 1; s <= 12; s++) {
    for (const v of Object.values(LAGNA[s])) assert.ok(v.hi && v.en, `lagna ${s}`);
    assert.ok(RASHI[s].mind.hi && RASHI[s].tip.en, `rashi ${s}`);
  }
  for (let n = 1; n <= 27; n++) assert.ok(NAKSHATRA[n].traits.hi && NAKSHATRA[n].deity.en, `nakshatra ${n}`);
  for (const [planet, rows] of Object.entries(PLANET_IN_HOUSE)) {
    assert.equal(rows.length, 12, planet);
    for (const r of rows) assert.ok(r.hi && r.en, planet);
  }
  for (const key of ["manglik", "kaal_sarp", "sade_sati", "pitru", "guru_chandal", "shrapit", "grahan"]) assert.ok(DOSHA_REMEDIES[key]?.length);
});

test("dignity: exaltation, debilitation, own, friend, enemy", () => {
  assert.equal(dignity("sun", 1), "exalted");
  assert.equal(dignity("sun", 7), "debilitated");
  assert.equal(dignity("moon", 4), "own");
  assert.equal(dignity("jupiter", 5), "friend"); // Leo lord Sun is Jupiter's friend
  assert.equal(dignity("sun", 10), "enemy"); // Capricorn lord Saturn
  assert.equal(dignity("rahu", 5), "neutral");
});

test("signFrom wraps around the zodiac", () => {
  assert.equal(signFrom(5, 9), 1); // 9th from Leo is Aries
  assert.equal(signFrom(12, 2), 1);
});

test("lucky gem: Lagna lord first, friendly trikona lord as alternate, never nodes", () => {
  assert.deepEqual(luckyGems(5), { primary: "sun", alternate: "mars" }); // Leo: 9th Aries (Mars)
  assert.deepEqual(luckyGems(2), { primary: "venus", alternate: "saturn" }); // Taurus: 9th Capricorn (Saturn)
  for (let s = 1; s <= 12; s++) {
    const g = luckyGems(s);
    assert.ok(!["rahu", "ketu"].includes(g.primary));
    assert.notEqual(g.alternate, g.primary);
  }
});

test("buildReport returns a full report in both languages", () => {
  for (const locale of ["hi", "en"] as const) {
    const r = buildReport(FIXTURE_CHART, locale, new Date("2026-11-01T00:00:00Z"));
    assert.ok(r.lagna.personality.length > 20);
    assert.ok(r.rashi.mind && r.nakshatra.traits);
    assert.equal(r.planets.length, 9);
    assert.ok(r.planets.every((p) => p.result && p.house >= 1 && p.house <= 12));
    assert.ok(r.lucky.gem && r.lucky.mantra);
    assert.equal(r.reviewed, false);
    // Remedies only for doshas that are present and not cancelled.
    for (const d of r.doshas) assert.equal(d.remedies.length > 0, d.present && !d.cancelled);
  }
});

test("report survives a chart without yogas_doshas or antardashas", () => {
  const { yogas_doshas: _drop, ...rest } = FIXTURE_CHART;
  const chart = { ...rest, vimshottari: FIXTURE_CHART.vimshottari.map(({ antardashas: _a, ...d }) => d) };
  const r = buildReport(chart, "en", new Date("2026-11-01T00:00:00Z"));
  assert.deepEqual(r.doshas, []);
  assert.deepEqual(r.yogas, []);
  assert.equal(r.currentDasha?.antar ?? null, null);
});
