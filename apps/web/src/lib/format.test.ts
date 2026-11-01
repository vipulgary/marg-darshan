import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDateIST, formatINR, formatNumber, formatSlotRange, formatTimeIST, formatWeekday } from "./format";

test("formatINR uses Indian digit grouping in both locales", () => {
  assert.equal(formatINR(100000, "hi"), "₹1,00,000");
  assert.equal(formatINR(100000, "en"), "₹1,00,000");
  assert.equal(formatINR(1100, "hi"), "₹1,100");
  assert.equal(formatINR(12345678, "en"), "₹1,23,45,678");
  assert.equal(formatINR(0, "en"), "₹0");
});

test("formatINR shows paise only when the amount has them", () => {
  assert.equal(formatINR(1100.5, "en"), "₹1,100.50");
  assert.equal(formatINR(Number.NaN, "en"), "");
});

test("formatNumber groups without currency", () => {
  assert.equal(formatNumber(10000, "hi"), "10,000");
  assert.equal(formatNumber(4.9, "en", 1), "4.9");
});

test("formatDateIST converts UTC to the IST calendar day", () => {
  // 20:00 UTC on 31 Oct is 01:30 IST on 1 Nov.
  const late = "2026-10-31T20:00:00Z";
  assert.equal(formatDateIST(late, "en"), "1 November 2026");
  assert.equal(formatDateIST(late, "hi"), "1 नवंबर 2026");
  assert.equal(formatDateIST(new Date("2026-10-31T04:30:00Z"), "hi"), "31 अक्टूबर 2026");
});

test("formatDateIST hi and en differ and respect custom options", () => {
  const d = "2026-03-15T06:00:00Z";
  assert.notEqual(formatDateIST(d, "hi"), formatDateIST(d, "en"));
  assert.equal(formatDateIST(d, "en", { day: "numeric", month: "short" }), "15 Mar");
  assert.equal(formatDateIST("not a date", "en"), "");
});

test("formatTimeIST shifts UTC by +05:30 with a 24h clock", () => {
  assert.equal(formatTimeIST("2026-10-31T04:30:00Z", "en"), "10:00");
  assert.equal(formatTimeIST("2026-10-31T04:30:00Z", "hi"), "10:00");
  assert.equal(formatTimeIST("2026-10-31T18:45:00Z", "en"), "00:15");
  assert.equal(formatTimeIST(new Date(Date.UTC(2026, 0, 1, 8, 0)), "en"), "13:30");
});

test("formatSlotRange renders an hourly slot label", () => {
  assert.equal(formatSlotRange("2026-10-31T04:30:00Z", "2026-10-31T05:30:00Z", "hi"), "10:00 – 11:00");
  assert.equal(formatSlotRange("2026-10-31T11:30:00Z", "2026-10-31T13:30:00Z", "en"), "17:00 – 19:00");
  assert.equal(formatSlotRange("bad", "2026-10-31T05:30:00Z", "en"), "");
});

test("formatWeekday maps JS weekday numbers", () => {
  assert.equal(formatWeekday(1, "en"), "Mon");
  assert.equal(formatWeekday(6, "en", "long"), "Saturday");
  assert.equal(formatWeekday(1, "hi"), "सोम");
  assert.equal(formatWeekday(0, "en"), "Sun");
});
