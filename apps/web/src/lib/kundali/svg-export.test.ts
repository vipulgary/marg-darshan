import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chartFilename } from "./svg-export";

describe("chartFilename", () => {
  it("slugifies names and falls back", () => {
    assert.equal(chartFilename("Rahul Sharma", "d9", "north"), "rahul-sharma-d9-north.svg");
    assert.equal(chartFilename("  ", "d1", "south"), "kundali-d1-south.svg");
  });
});
