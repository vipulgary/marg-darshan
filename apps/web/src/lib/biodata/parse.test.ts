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
  assert.deepEqual(
    { name: f.name, gender: f.gender, dob: f.dob, tob: f.tob, place: f.place, height: f.height, education: f.education, profession: f.profession, father: f.father },
    { name: "Sample Kumar", gender: "male", dob: "1990-06-15", tob: "07:45", place: "Pune, Maharashtra", height: `5'9"`, education: "B.Tech (Computer Science)", profession: "Software Engineer", father: "Ram Kumar" },
  );
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

test("designer layouts: dash labels, label above value, heading name, birthplace in brackets", () => {
  const f = parseBiodata(
    `SAMPLE PERSON
PERSONAL DETAILS
D.O.B. – 4 August, 1995
Birth Time – 1.45 PM (Jaipur)
Height – 5’10’’
Contact details
9876543210
12, Sample Marg
Sample City
Father
Sample Senior`,
    "SAMPLE PERSON",
  );
  assert.equal(f.name, "Sample Person");
  assert.equal(f.dob, "1995-08-04");
  assert.equal(f.tob, "13:45");
  assert.equal(f.place, "Jaipur");
  assert.equal(f.mobile, "9876543210");
  assert.equal(f.residence, "12, Sample Marg, Sample City");
  assert.equal(f.father, "Sample Senior");
});

test("plain 'Time:' label, 'Current Residence', and titles before names", () => {
  const f = parseBiodata(`Name: Ms Sample Devi
Date of Birth: 23rd February 1997
Time: 01:05 P.M.
Place of Birth: Sample Nagar, Nepal
Native Place: Sample Gaon
Current Residence: Jaipur, Rajasthan`);
  assert.equal(f.name, "Sample Devi");
  assert.equal(f.dob, "1997-02-23");
  assert.equal(f.tob, "13:05");
  assert.equal(f.place, "Sample Nagar, Nepal");
  assert.equal(f.residence, "Jaipur, Rajasthan");
});

test("glued ordinal date, physique line, hobbies label, professional title", () => {
  const f = parseBiodata(
    `ADV. SAMPLE KUMAR
Date of Birth:
12thMarch, 1997
Time of Birth:
06:52 P.M.
Place of Birth
Jaipur
Physique
5’10”, Fair, Smart
Residence:
Hobbies:, Travelling, Reading`,
    "ADV. SAMPLE KUMAR",
  );
  assert.equal(f.name, "Sample Kumar");
  assert.equal(f.dob, "1997-03-12");
  assert.equal(f.tob, "18:52");
  assert.equal(f.height, "5’10”");
  assert.equal(f.complexion, "Fair");
  assert.equal(f.residence, null);
  assert.equal(parseBiodata("Name: Dr. Prof. Sample Devi").name, "Sample Devi");
});
