import assert from "node:assert/strict";
import { test } from "node:test";
import { quote } from "@/lib/booking/pricing";
import { quoteFor } from "@/lib/payments/plan";
import { defaultSettings, flattenSettings, formValuesFrom, mergeSettings, parseSettingsForm, serviceLookup } from "./schema";

const defaults = () => defaultSettings({});

function validForm(over: Record<string, string | string[]> = {}): FormData {
  const values = { ...flattenSettings(defaults()), whatsappNumber: "+91 98765 43210", ...over };
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) for (const x of Array.isArray(v) ? v : [v]) fd.append(k, x);
  return fd;
}

test("defaults mirror the catalog and env", () => {
  const d = defaultSettings({ PAYMENT_BALANCE_DAYS_BEFORE: "2", NEXT_PUBLIC_CONTACT_EMAIL: "a@b.in" });
  assert.equal(d.holdMinutes, 10);
  assert.equal(d.cancellationHours, 24);
  assert.equal(d.paymentBalanceDaysBefore, 2);
  assert.equal(d.contactEmail, "a@b.in");
  assert.deepEqual(d.services.vastu, { prices: { 60: 3100, 120: 5100 }, advancePct: 50 });
  assert.equal(d.services.astrology.advancePct, undefined);
  assert.equal(defaultSettings({}).paymentBalanceDaysBefore, 1);
});

test("merge: no rows returns defaults unchanged", () => {
  const { settings, invalid } = mergeSettings(defaults(), []);
  assert.deepEqual(settings, defaults());
  assert.deepEqual(invalid, []);
});

test("merge: valid rows override, invalid and unknown rows are ignored", () => {
  const { settings, invalid } = mergeSettings(defaults(), [
    { key: "holdMinutes", value: 15 },
    { key: "cancellationHours", value: -3 },
    { key: "workingHours", value: { start: 9, end: 18, days: [6, 1, 1, 2] } },
    { key: "whatsappNumber", value: "+91 99999 00000" },
    { key: "somethingElse", value: 1 },
  ]);
  assert.equal(settings.holdMinutes, 15);
  assert.equal(settings.cancellationHours, 24);
  assert.deepEqual(settings.workingHours, { start: 9, end: 18, days: [1, 2, 6] });
  assert.equal(settings.whatsappNumber, "919999900000");
  assert.deepEqual(invalid, ["cancellationHours"]);
});

test("merge: working hours with end before start are rejected", () => {
  const { settings, invalid } = mergeSettings(defaults(), [{ key: "workingHours", value: { start: 18, end: 10, days: [1] } }]);
  assert.deepEqual(settings.workingHours, defaults().workingHours);
  assert.deepEqual(invalid, ["workingHours"]);
});

test("merge: service pricing merges per duration and ignores unknown services/durations", () => {
  const { settings } = mergeSettings(defaults(), [
    {
      key: "services",
      value: {
        astrology: { prices: { 30: 1500, 45: 999 }, advancePct: 40 },
        vastu: { prices: { 120: "oops" }, advancePct: 30 },
        nope: { prices: { 30: 1 } },
      },
    },
  ]);
  assert.deepEqual(settings.services.astrology, { prices: { 30: 1500, 60: 2100 } });
  assert.deepEqual(settings.services.vastu, { prices: { 60: 3100, 120: 5100 }, advancePct: 30 });
  assert.equal(settings.services.nope, undefined);
});

test("merge: does not mutate the defaults object", () => {
  const d = defaults();
  mergeSettings(d, [{ key: "services", value: { astrology: { prices: { 30: 1 } } } }]);
  assert.equal(d.services.astrology.prices[30], 1100);
});

test("form: valid submission parses to settings", () => {
  const r = parseSettingsForm(validForm({ "services.vastu.prices.60": "3500", "services.vastu.advancePct": "40", holdMinutes: "12" }));
  assert.ok(r.ok);
  assert.equal(r.value.whatsappNumber, "919876543210");
  assert.equal(r.value.holdMinutes, 12);
  assert.equal(r.value.services.vastu.prices[60], 3500);
  assert.equal(r.value.services.vastu.advancePct, 40);
  assert.equal(r.value.services.astrology.advancePct, undefined);
});

test("form: errors are keyed by input name", () => {
  const r = parseSettingsForm(
    validForm({
      whatsappNumber: "12ab",
      contactEmail: "nope",
      "officeAddress.hi": "  ",
      "workingHours.days": [],
      holdMinutes: "",
      "services.astrology.prices.30": "10.5",
      "services.vastu.advancePct": "100",
    }),
  );
  assert.ok(!r.ok);
  assert.deepEqual(Object.keys(r.fieldErrors).sort(), [
    "contactEmail",
    "holdMinutes",
    "officeAddress.hi",
    "services.astrology.prices.30",
    "services.vastu.advancePct",
    "whatsappNumber",
    "workingHours.days",
  ]);
  assert.match(r.fieldErrors.holdMinutes, /number/);
});

test("form: closing hour must follow opening hour", () => {
  const r = parseSettingsForm(validForm({ "workingHours.start": "19", "workingHours.end": "10" }));
  assert.ok(!r.ok);
  assert.deepEqual(Object.keys(r.fieldErrors), ["workingHours.end"]);
});

test("form values round-trip and skip React action fields", () => {
  const fd = validForm();
  fd.append("$ACTION_ID_abc", "");
  const v = formValuesFrom(fd);
  assert.equal(v["$ACTION_ID_abc"], undefined);
  assert.deepEqual(v["workingHours.days"], ["1", "2", "3", "4", "5", "6"]);
  const none = new FormData();
  assert.deepEqual(formValuesFrom(none)["workingHours.days"], []);
});

test("serviceLookup feeds edited prices into both quote functions", () => {
  const s = defaults();
  s.services.vastu = { prices: { 60: 4000, 120: 6000 }, advancePct: 25 };
  s.services.astrology = { prices: { 30: 1200, 60: 2200 }, advancePct: 10 };
  const lookup = serviceLookup(s);
  assert.equal(quoteFor({ serviceSlug: "astrology", durationMin: 30, planType: "FULL_UPFRONT" }, lookup).totalInr, 1200);
  const split = quoteFor({ serviceSlug: "vastu", durationMin: 120, planType: "SPLIT_PLAN" }, lookup);
  assert.deepEqual([split.totalInr, split.advanceInr, split.balanceInr, split.advancePct], [6000, 1500, 4500, 25]);
  const q = quote({ serviceSlug: "vastu", durationMin: 60, mode: "ONLINE_ZOOM", planType: "SPLIT_PLAN" }, lookup);
  assert.deepEqual([q.totalInr, q.advanceInr], [4000, 1000]);
  // astrology can't split, so its stray advance is ignored
  assert.equal(lookup("astrology")?.advancePct, undefined);
  assert.equal(lookup("missing"), undefined);
  // default lookup is untouched
  assert.equal(quoteFor({ serviceSlug: "astrology", durationMin: 30, planType: "FULL_UPFRONT" }).totalInr, 1100);
});
