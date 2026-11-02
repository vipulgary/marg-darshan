import assert from "node:assert/strict";
import { test } from "node:test";
import { parseBiodata, parseDate, parseTime } from "./parse";

test("dates in common biodata formats", () => {
  assert.equal(parseDate("14/03/1995"), "1995-03-14");
  assert.equal(parseDate("14-3-95"), "1995-03-14");
  assert.equal(parseDate("14th March 1995"), "1995-03-14");
  assert.equal(parseDate("March 14, 1995"), "1995-03-14");
  assert.equal(parseDate("१४ मार्च १९९५"), "1995-03-14");
  assert.equal(parseDate("31/02/1995"), null);
});

test("times with AM/PM and Hindi day-part words", () => {
  assert.equal(parseTime("8:30 AM"), "08:30");
  assert.equal(parseTime("8.30 pm"), "20:30");
  assert.equal(parseTime("सुबह 8:30 बजे"), "08:30");
  assert.equal(parseTime("शाम 6:15"), "18:15");
  assert.equal(parseTime("रात 2:10"), "02:10");
  assert.equal(parseTime("14:56"), "14:56");
  assert.equal(parseTime("morning"), null);
});

test("English biodata", () => {
  const f = parseBiodata(`BIODATA
Name : Sample Kumar
Father's Name : Ram Kumar
Gender: Male
Date of Birth : 15/06/1990
Time of Birth : 7:45 AM
Place of Birth : Pune, Maharashtra
Height : 5'9"
Education : B.Tech (Computer Science)
Occupation : Software Engineer`);
  assert.deepEqual(f, { name: "Sample Kumar", gender: "male", dob: "1990-06-15", tob: "07:45", place: "Pune, Maharashtra", height: `5'9"`, education: "B.Tech (Computer Science)", profession: "Software Engineer" });
});

test("Hindi biodata without birth time", () => {
  const f = parseBiodata(`• नाम : सैंपल शर्मा
• पिता का नाम : कोई शर्मा
• जन्म तिथि : २ सितंबर १९९२
• जन्म स्थान : जयपुर, राजस्थान
• कद : 5 फीट 4 इंच
• शिक्षा : एम.ए.`);
  assert.equal(f.name, "सैंपल शर्मा");
  assert.equal(f.dob, "1992-09-02");
  assert.equal(f.tob, null);
  assert.equal(f.place, "जयपुर, राजस्थान");
  assert.equal(f.height, "5 फीट 4 इंच");
});

test("combined date & time line", () => {
  const f = parseBiodata("Date & Time of Birth : 02-09-1992, 06:20 PM");
  assert.equal(f.dob, "1992-09-02");
  assert.equal(f.tob, "18:20");
});
