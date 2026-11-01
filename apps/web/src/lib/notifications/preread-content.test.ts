import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { describeJson, jyotishPreReadEmail } from "./preread-content";

const base = {
  appointmentId: "appt-1",
  client: { name: "Ravi <Sharma>", email: "ravi@example.com", phone: "+919800000000", lang: "hi" },
  serviceTitle: "Jyotish consultation",
  problemTitle: "Career",
  question: "Will I get the job?",
  mode: "ONLINE_ZOOM" as const,
  slotStart: new Date("2026-11-05T04:30:00Z"),
  slotEnd: new Date("2026-11-05T05:15:00Z"),
  adminUrl: "https://astromax.in/admin/appointments/appt-1",
};

describe("jyotishPreReadEmail", () => {
  it("includes question, birth details, kundali and admin links; escapes HTML", () => {
    const e = jyotishPreReadEmail({
      ...base,
      birth: {
        name: "Ravi",
        dob: new Date("1990-04-12T00:00:00Z"),
        tob: new Date("1970-01-01T06:45:00Z"),
        isTimeUnknown: false,
        isDateUnknown: false,
        place: "Jaipur",
        tzName: "Asia/Kolkata",
      },
      lifeEvents: [{ event: "marriage", year: 2015 }],
      kundaliUrl: "https://astromax.in/en/kundali/h1",
    });
    assert.match(e.subject, /^Pre-read: Ravi <Sharma>/);
    assert.match(e.text, /Will I get the job\?/);
    assert.match(e.text, /Date of birth: 1990-04-12/);
    assert.match(e.text, /Time of birth: 06:45/);
    assert.match(e.text, /event: marriage, year: 2015/);
    assert.match(e.text, /\/en\/kundali\/h1/);
    assert.match(e.text, /\/admin\/appointments\/appt-1/);
    assert.match(e.html, /Ravi &lt;Sharma&gt;/);
    assert.doesNotMatch(e.html, /<Sharma>/);
  });
  it("marks the 2h resend and shows Vastu floor plan", () => {
    const e = jyotishPreReadEmail({ ...base, reminder: true, vastuProperty: { type: "flat", facing: "east" }, vastuMapUrl: "https://r2/plan.pdf" });
    assert.match(e.subject, /^\[2h\] /);
    assert.match(e.text, /Floor plan: https:\/\/r2\/plan\.pdf/);
    assert.match(e.text, /type: flat, facing: east/);
  });
});

describe("describeJson", () => {
  it("handles empty and nested values", () => {
    assert.deepEqual(describeJson(null), []);
    assert.deepEqual(describeJson({ a: { b: 1 } }), ["a > b: 1"]);
  });
});
