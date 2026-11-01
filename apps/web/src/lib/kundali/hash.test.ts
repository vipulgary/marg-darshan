import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BirthInput } from "../contracts";
import { normalizeTob, normalizedInputHash } from "./hash";

const base: BirthInput = {
  name: "Rahul Sharma",
  gender: "male",
  dob: "1990-03-12",
  tob: "10:30",
  place: { placeName: "Jaipur, Rajasthan, India", latitude: 26.912434, longitude: 75.78727, tzName: "Asia/Kolkata" },
  lang: "hi",
};

describe("normalizeTob", () => {
  it("pads and drops seconds", () => {
    assert.equal(normalizeTob("9:5"), "09:05");
    assert.equal(normalizeTob("09:05:00"), "09:05");
    assert.equal(normalizeTob("23:59"), "23:59");
  });
});

describe("normalizedInputHash", () => {
  const h = normalizedInputHash(base);

  it("is a sha256 hex digest", () => {
    assert.match(h, /^[0-9a-f]{64}$/);
  });

  it("ignores name, gender, language and place label", () => {
    assert.equal(
      normalizedInputHash({ ...base, name: "राहुल", gender: "other", lang: "en", place: { ...base.place, placeName: "JAIPUR" } }),
      h,
    );
  });

  it("treats equivalent time spellings the same", () => {
    assert.equal(normalizedInputHash({ ...base, tob: "10:30:00" }), h);
  });

  it("rounds coordinates to 4 decimal places", () => {
    assert.equal(normalizedInputHash({ ...base, place: { ...base.place, latitude: 26.91238, longitude: 75.78731 } }), normalizedInputHash({ ...base, place: { ...base.place, latitude: 26.9124, longitude: 75.7873 } }));
    assert.notEqual(normalizedInputHash({ ...base, place: { ...base.place, latitude: 26.9125 } }), h);
  });

  it("changes with date, time and timezone", () => {
    assert.notEqual(normalizedInputHash({ ...base, dob: "1990-03-13" }), h);
    assert.notEqual(normalizedInputHash({ ...base, tob: "10:31" }), h);
    assert.notEqual(normalizedInputHash({ ...base, place: { ...base.place, tzName: "Asia/Kathmandu" } }), h);
  });

  it("does not distinguish -0 from 0", () => {
    const a = normalizedInputHash({ ...base, place: { ...base.place, latitude: -0.00001, longitude: 0 } });
    const b = normalizedInputHash({ ...base, place: { ...base.place, latitude: 0, longitude: 0 } });
    assert.equal(a, b);
  });
});
