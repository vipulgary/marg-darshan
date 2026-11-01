import assert from "node:assert/strict";
import { test } from "node:test";
import { financialYear, formatInvoiceNumber, inrInWords, splitInclusive } from "./gst";

const base = { registered: true, supplierState: "09" };

test("intra-state split: CGST + SGST and parts add up to the total", () => {
  const b = splitInclusive(110_000, base); // ₹1,100 inclusive
  assert.equal(b.taxablePaise, 93_220); // 1100 / 1.18 = 932.20
  assert.equal(b.cgstPaise + b.sgstPaise, 16_780);
  assert.equal(b.igstPaise, 0);
  assert.equal(b.taxablePaise + b.cgstPaise + b.sgstPaise, b.totalPaise);
});

test("inter-state split uses IGST only", () => {
  const b = splitInclusive(210_000, { ...base, placeOfSupply: "27" });
  assert.equal(b.interState, true);
  assert.equal(b.cgstPaise + b.sgstPaise, 0);
  assert.equal(b.taxablePaise + b.igstPaise, 210_000);
});

test("odd tax paise go to SGST so nothing is lost", () => {
  for (const total of [1, 99, 101, 110_001, 510_003]) {
    const b = splitInclusive(total, base);
    assert.equal(b.taxablePaise + b.cgstPaise + b.sgstPaise, total);
    assert.ok(b.sgstPaise - b.cgstPaise <= 1);
  }
});

test("unregistered business charges no GST", () => {
  const b = splitInclusive(110_000, { ...base, registered: false });
  assert.deepEqual([b.taxablePaise, b.cgstPaise, b.sgstPaise, b.igstPaise, b.rateBps], [110_000, 0, 0, 0, 0]);
});

test("rejects fractional paise", () => {
  assert.throws(() => splitInclusive(10.5, base), RangeError);
});

test("financial year boundaries are in IST", () => {
  assert.equal(financialYear(new Date("2026-03-31T18:29:59Z")), "2025-26"); // 23:59 IST on 31 Mar
  assert.equal(financialYear(new Date("2026-03-31T18:30:00Z")), "2026-27"); // 00:00 IST on 1 Apr
  assert.equal(financialYear(new Date("2099-12-01T00:00:00Z")), "2099-00");
});

test("invoice number and amount in words", () => {
  assert.equal(formatInvoiceNumber("2026-27", 7), "AMX/2026-27/00007");
  assert.equal(inrInWords(110_000), "Rupees One Thousand One Hundred Only");
  assert.equal(inrInWords(12_345_678_950), "Rupees Twelve Crore Thirty Four Lakh Fifty Six Thousand Seven Hundred Eighty Nine and Fifty Paise Only");
  assert.equal(inrInWords(0), "Rupees Zero Only");
});
