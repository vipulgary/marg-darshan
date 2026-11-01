import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildIcs, escapeText, foldLine, formatUtc, icsDataUrl } from "./ics";

const octets = (s: string) => Buffer.byteLength(s, "utf8");
const unfold = (s: string) => s.replace(/\r\n /g, "");

const base = {
  uid: "appt-123@astromax",
  start: new Date("2026-11-02T04:30:00Z"),
  end: new Date("2026-11-02T05:30:00Z"),
  stamp: new Date("2026-10-31T10:00:00Z"),
  title: "ज्योतिष परामर्श — Marg Darshan",
};

describe("formatUtc", () => {
  it("formats as basic UTC date-time", () => {
    assert.equal(formatUtc(new Date("2026-11-02T04:30:00.123Z")), "20261102T043000Z");
  });
  it("converts from an IST offset to UTC", () => {
    assert.equal(formatUtc(new Date("2026-11-02T10:00:00+05:30")), "20261102T043000Z");
  });
});

describe("escapeText", () => {
  it("escapes backslash, semicolon, comma and newlines", () => {
    assert.equal(escapeText("a\\b;c,d\ne\r\nf"), "a\\\\b\\;c\\,d\\ne\\nf");
  });
});

describe("foldLine", () => {
  it("leaves short lines alone", () => {
    assert.equal(foldLine("SUMMARY:short"), "SUMMARY:short");
  });
  it("folds at 75 octets with a leading space on continuation lines", () => {
    const line = `DESCRIPTION:${"x".repeat(200)}`;
    const folded = foldLine(line);
    for (const physical of folded.split("\r\n")) assert.ok(octets(physical) <= 75, `${octets(physical)} > 75`);
    assert.equal(octets(folded.split("\r\n")[0]), 75);
    assert.ok(folded.split("\r\n").slice(1).every((l) => l.startsWith(" ")));
    assert.equal(unfold(folded), line);
  });
  it("never splits a multi-byte Devanagari character", () => {
    const line = `SUMMARY:${"नमस्ते ज्योतिष ".repeat(12)}`;
    const folded = foldLine(line);
    for (const physical of folded.split("\r\n")) {
      assert.ok(octets(physical) <= 75);
      // a cut UTF-8 sequence would decode to U+FFFD
      assert.ok(!Buffer.from(physical, "utf8").toString("utf8").includes("�"));
    }
    assert.equal(unfold(folded), line);
  });
});

describe("buildIcs", () => {
  const ics = buildIcs({
    ...base,
    description: "Zoom link: https://zoom.us/j/123; please join 5 min early, thanks\nधन्यवाद",
    location: "Online (Zoom)",
    url: "https://astromax.in/payment/success?appointment=123",
    alarmMinutesBefore: 60,
  });

  it("uses CRLF line endings only and ends with CRLF", () => {
    assert.ok(ics.endsWith("\r\n"));
    assert.ok(!/[^\r]\n/.test(ics), "bare LF found");
  });
  it("keeps every physical line within 75 octets", () => {
    for (const line of ics.split("\r\n")) assert.ok(octets(line) <= 75, line);
  });
  it("contains the required calendar and event properties", () => {
    const u = unfold(ics);
    for (const needle of [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Marg Darshan//Booking//EN",
      "BEGIN:VEVENT",
      "UID:appt-123@astromax",
      "DTSTAMP:20261031T100000Z",
      "DTSTART:20261102T043000Z",
      "DTEND:20261102T053000Z",
      "SUMMARY:ज्योतिष परामर्श — Marg Darshan",
      "DESCRIPTION:Zoom link: https://zoom.us/j/123\\; please join 5 min early\\, thanks\\nधन्यवाद",
      "LOCATION:Online (Zoom)",
      "URL:https://astromax.in/payment/success?appointment=123",
      "TRIGGER:-PT60M",
      "END:VEVENT",
      "END:VCALENDAR",
    ]) {
      assert.ok(u.includes(needle), `missing ${needle}`);
    }
  });
  it("nests VALARM inside VEVENT", () => {
    const u = unfold(ics);
    assert.ok(u.indexOf("BEGIN:VEVENT") < u.indexOf("BEGIN:VALARM"));
    assert.ok(u.indexOf("END:VALARM") < u.indexOf("END:VEVENT"));
  });
  it("omits optional properties when not given", () => {
    const minimal = buildIcs(base);
    assert.ok(!minimal.includes("DESCRIPTION:"));
    assert.ok(!minimal.includes("LOCATION:"));
    assert.ok(!minimal.includes("URL:"));
    assert.ok(!minimal.includes("VALARM"));
  });
  it("rejects an end before the start", () => {
    assert.throws(() => buildIcs({ ...base, end: base.start }), RangeError);
  });
  it("produces a downloadable data URL", () => {
    const url = icsDataUrl(buildIcs(base));
    assert.ok(url.startsWith("data:text/calendar;charset=utf-8,BEGIN%3AVCALENDAR%0D%0A"));
  });
});
