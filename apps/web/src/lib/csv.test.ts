import assert from "node:assert/strict";
import { test } from "node:test";
import { csvCell, toCsv } from "./csv";

test("quotes commas, quotes and newlines", () => {
  assert.equal(csvCell('a,"b"'), '"a,""b"""');
  assert.equal(csvCell("line1\nline2"), '"line1\nline2"');
  assert.equal(csvCell("plain"), "plain");
});

test("neutralises formula injection in strings only", () => {
  assert.equal(csvCell("=HYPERLINK(\"x\")"), "\"'=HYPERLINK(\"\"x\"\")\"");
  assert.equal(csvCell("+91 98765"), "'+91 98765");
  assert.equal(csvCell(-5), "-5");
});

test("dates, nulls and BOM", () => {
  assert.equal(csvCell(new Date("2026-11-01T00:00:00Z")), "2026-11-01T00:00:00.000Z");
  assert.equal(csvCell(null), "");
  const out = toCsv(["name", "शहर"], [["राहुल", "लखनऊ"]]);
  assert.ok(out.startsWith("﻿name,शहर\r\n"));
  assert.ok(out.endsWith("राहुल,लखनऊ\r\n"));
});
