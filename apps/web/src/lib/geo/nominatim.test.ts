import assert from "node:assert/strict";
import { test } from "node:test";
import { guessTimeZone, searchNominatim, toPlace } from "./nominatim";

test("India and single-zone countries map to exact IANA zones", () => {
  assert.deepEqual(guessTimeZone("IN", 75.8), { tzName: "Asia/Kolkata", approximate: false });
  assert.deepEqual(guessTimeZone("ae", 55.3), { tzName: "Asia/Dubai", approximate: false });
});

test("multi-zone countries fall back to an Etc/GMT offset from longitude", () => {
  assert.deepEqual(guessTimeZone("us", -74), { tzName: "Etc/GMT+5", approximate: true });
  assert.deepEqual(guessTimeZone(undefined, 151.2), { tzName: "Etc/GMT-10", approximate: true });
  assert.deepEqual(guessTimeZone("xx", 3), { tzName: "Etc/GMT", approximate: true });
});

test("builds a short place label from address parts", () => {
  const p = toPlace({
    lat: "26.9124336",
    lon: "75.7872709",
    display_name: "Jaipur, Jaipur Tehsil, Jaipur District, Rajasthan, 302001, India",
    address: { city: "Jaipur", state: "Rajasthan", country: "India", country_code: "in" },
  });
  assert.equal(p.placeName, "Jaipur, Rajasthan, India");
  assert.equal(p.tzName, "Asia/Kolkata");
  assert.equal(p.latitude, 26.912434);
});

test("caches results and sends an identifying User-Agent", async () => {
  let calls = 0;
  let ua = "";
  const fake = (async (_url: string | URL, init?: RequestInit) => {
    calls++;
    ua = (init?.headers as Record<string, string>)["User-Agent"];
    return new Response(JSON.stringify([{ lat: "19.07", lon: "72.87", display_name: "Mumbai", address: { city: "Mumbai", country_code: "in", country: "India" } }]));
  }) as typeof fetch;
  const a = await searchNominatim("Mumbai-test", fake);
  const b = await searchNominatim("mumbai-TEST", fake);
  assert.equal(calls, 1);
  assert.equal(a[0].tzName, "Asia/Kolkata");
  assert.deepEqual(a, b);
  assert.match(ua, /astromax/);
});
