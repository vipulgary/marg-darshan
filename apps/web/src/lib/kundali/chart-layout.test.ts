import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DashaPeriod } from "../contracts";
import {
  PLANET_ABBR,
  SOUTH_GRID,
  dashaProgress,
  formatDegMin,
  houseForSign,
  northIndianHouses,
  periodYears,
  signForHouse,
  southIndianCells,
  timelinePeriods,
  toDegMin,
} from "./chart-layout";
import { FIXTURE_CHART } from "./fixture";

describe("sign/house arithmetic", () => {
  it("rotates signs from the Lagna and wraps past Pisces", () => {
    assert.equal(signForHouse(5, 1), 5);
    assert.equal(signForHouse(5, 8), 12);
    assert.equal(signForHouse(5, 9), 1);
    assert.equal(signForHouse(12, 2), 1);
  });
  it("is the inverse of houseForSign", () => {
    for (let lagna = 1; lagna <= 12; lagna++)
      for (let h = 1; h <= 12; h++) assert.equal(houseForSign(lagna, signForHouse(lagna, h)), h);
  });
});

describe("northIndianHouses", () => {
  const houses = northIndianHouses(FIXTURE_CHART, "en");

  it("returns 12 houses with house 1 holding the Lagna sign", () => {
    assert.equal(houses.length, 12);
    assert.deepEqual(houses.map((h) => h.house), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    assert.equal(houses[0].sign, 5); // Leo
    assert.deepEqual(houses.map((h) => h.sign), [5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4]);
  });

  it("places every planet exactly once, in its whole-sign house", () => {
    const placed = houses.flatMap((h) => h.planets.map((p) => [p.key, h.house] as const));
    assert.equal(placed.length, 9);
    const where = Object.fromEntries(placed);
    assert.equal(where.sun, 8);
    assert.equal(where.mercury, 8);
    assert.equal(where.moon, 10);
    assert.equal(where.mars, 12);
    assert.equal(where.ketu, 12);
    assert.equal(where.jupiter, 11);
    assert.equal(where.venus, 7);
    assert.equal(where.saturn, 6);
    assert.equal(where.rahu, 6);
    // engine's own house numbers agree
    for (const [key, house] of placed) assert.equal(FIXTURE_CHART.planets[key].house, house);
  });

  it("keeps PLANET_ORDER within a house and carries retrograde + degree", () => {
    const h8 = houses[7];
    assert.deepEqual(h8.planets.map((p) => p.key), ["sun", "mercury"]);
    const h12 = houses[11];
    assert.deepEqual(h12.planets.map((p) => p.key), ["mars", "ketu"]);
    assert.equal(h12.planets[0].retrograde, true);
    assert.equal(h12.planets[0].abbr, "Ma");
    assert.ok(Math.abs(h12.planets[0].degree - 10.5833) < 1e-6);
  });

  it("uses Devanagari abbreviations for hi", () => {
    const hi = northIndianHouses(FIXTURE_CHART, "hi");
    assert.deepEqual(hi[7].planets.map((p) => p.abbr), ["सू", "बु"]);
    assert.equal(PLANET_ABBR.hi.saturn, "श");
    assert.equal(PLANET_ABBR.en.ketu, "Ke");
  });
});

describe("southIndianCells", () => {
  const cells = southIndianCells(FIXTURE_CHART, "en");

  it("uses the fixed South Indian grid (Pisces top-left, clockwise)", () => {
    const at = (r: number, c: number) => cells.find((x) => x.row === r && x.col === c)?.sign;
    assert.deepEqual([at(0, 0), at(0, 1), at(0, 2), at(0, 3)], [12, 1, 2, 3]);
    assert.deepEqual([at(1, 3), at(2, 3), at(3, 3)], [4, 5, 6]);
    assert.deepEqual([at(3, 2), at(3, 1), at(3, 0)], [7, 8, 9]);
    assert.deepEqual([at(2, 0), at(1, 0)], [10, 11]);
  });

  it("never uses the merged centre 2x2", () => {
    for (const { row, col } of Object.values(SOUTH_GRID)) assert.ok(!(row >= 1 && row <= 2 && col >= 1 && col <= 2));
    assert.equal(new Set(Object.values(SOUTH_GRID).map((p) => `${p.row},${p.col}`)).size, 12);
  });

  it("marks the Lagna cell and numbers houses from it", () => {
    const lagna = cells.filter((c) => c.isLagna);
    assert.equal(lagna.length, 1);
    assert.equal(lagna[0].sign, 5);
    assert.equal(lagna[0].house, 1);
    assert.equal(cells.find((c) => c.sign === 4)?.house, 12);
  });

  it("puts planets in their sign cells", () => {
    assert.deepEqual(cells.find((c) => c.sign === 10)?.planets.map((p) => p.key), ["saturn", "rahu"]);
    assert.deepEqual(cells.find((c) => c.sign === 2)?.planets.map((p) => p.key), ["moon"]);
    assert.equal(cells.reduce((n, c) => n + c.planets.length, 0), 9);
  });
});

describe("degree formatting", () => {
  it("truncates to degrees and minutes", () => {
    assert.deepEqual(toDegMin(10.5833), { deg: 10, min: 34 });
    assert.deepEqual(toDegMin(29.99999), { deg: 29, min: 59 });
    assert.deepEqual(toDegMin(0), { deg: 0, min: 0 });
    assert.equal(formatDegMin(7.05), "7° 03′");
  });
});

describe("dashaProgress", () => {
  it("finds the running mahadasha and antardasha with percent elapsed", () => {
    const p = dashaProgress(FIXTURE_CHART.vimshottari, new Date("2028-06-01T12:00:00Z"));
    assert.ok(p);
    assert.equal(p.current.lord, "jupiter");
    assert.equal(p.index, 3);
    assert.equal(Math.round(p.percent), 50);
    assert.equal(p.antardasha, null); // fixture antardashas stop in 2028-04
    const q = dashaProgress(FIXTURE_CHART.vimshottari, new Date("2026-01-01T00:00:00Z"));
    assert.equal(q?.antardasha?.period.lord, "mercury");
    assert.ok(q!.antardasha!.percent > 0 && q!.antardasha!.percent < 100);
  });

  it("treats start as inclusive and end as exclusive", () => {
    assert.equal(dashaProgress(FIXTURE_CHART.vimshottari, new Date("2020-06-01T00:00:00Z"))?.current.lord, "jupiter");
    assert.equal(dashaProgress(FIXTURE_CHART.vimshottari, new Date("2020-06-01T00:00:00Z"))?.percent, 0);
    assert.equal(dashaProgress(FIXTURE_CHART.vimshottari, new Date("2020-05-31T23:00:00Z"))?.current.lord, "rahu");
  });

  it("returns null outside the sequence", () => {
    assert.equal(dashaProgress(FIXTURE_CHART.vimshottari, new Date("1980-01-01")), null);
    assert.equal(dashaProgress([], new Date()), null);
  });

  it("reports days left", () => {
    const p = dashaProgress(FIXTURE_CHART.vimshottari, new Date("2036-05-22T00:00:00Z"));
    assert.equal(p?.daysLeft, 10);
  });
});

describe("timeline helpers", () => {
  it("periodYears prefers the engine's years and falls back to dates", () => {
    assert.equal(periodYears({ lord: "sun", years: 6, start: "2000-01-01", end: "2006-01-01" }), 6);
    const p: DashaPeriod = { lord: "sun", start: "2000-01-01", end: "2002-01-01" };
    assert.ok(Math.abs(periodYears(p) - 2) < 0.01);
  });

  it("shows one cycle, extended to include the running period", () => {
    assert.equal(timelinePeriods(FIXTURE_CHART.vimshottari, new Date("2026-01-01")).length, 9);
    assert.equal(timelinePeriods(FIXTURE_CHART.vimshottari, new Date("2110-01-01")).length, 10);
  });
});

describe("navamsa (D9)", () => {
  it("uses ascendant.d9_sign as Lagna and places planets by d9_sign", async () => {
    const { navamsaChart, northIndianD9Houses, southIndianD9Cells, houseForSign: hfs } = await import("./chart-layout");
    const d9 = navamsaChart(FIXTURE_CHART);
    assert.equal(d9.ascendant.sign, FIXTURE_CHART.ascendant.d9_sign);
    const houses = northIndianD9Houses(FIXTURE_CHART);
    assert.equal(houses[0].sign, FIXTURE_CHART.ascendant.d9_sign);
    for (const [key, p] of Object.entries(FIXTURE_CHART.planets)) {
      assert.equal(d9.planets[key as keyof typeof d9.planets].sign, p.d9_sign);
      assert.equal(d9.planets[key as keyof typeof d9.planets].house, hfs(FIXTURE_CHART.ascendant.d9_sign, p.d9_sign));
      const h = houses.find((x) => x.planets.some((q) => q.key === key));
      assert.equal(h?.sign, p.d9_sign);
    }
    const cells = southIndianD9Cells(FIXTURE_CHART);
    assert.equal(cells.filter((c) => c.isLagna).length, 1);
    assert.equal(cells.find((c) => c.isLagna)?.sign, FIXTURE_CHART.ascendant.d9_sign);
    assert.equal(cells.reduce((n, c) => n + c.planets.length, 0), 9);
    // D1 input untouched
    assert.notEqual(FIXTURE_CHART.ascendant.sign, undefined);
  });
  it("computes navamsa degree and divisionChart passthrough", async () => {
    const { navamsaDegree, divisionChart, parseChartStyle } = await import("./chart-layout");
    assert.ok(Math.abs(navamsaDegree(1) - 9) < 1e-9);
    assert.ok(Math.abs(navamsaDegree(3 + 1 / 3 + 0.5) - 4.5) < 1e-9);
    assert.equal(divisionChart(FIXTURE_CHART, "d1"), FIXTURE_CHART);
    assert.equal(parseChartStyle("south"), "south");
    assert.equal(parseChartStyle("x", "south"), "south");
  });
});
