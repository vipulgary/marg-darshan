import type { ChartData, PlanetKey, PlanetPosition } from "@/lib/contracts";

/**
 * Hand-written ChartData used by unit tests (and handy for UI previews).
 * Lagna Leo; Moon in Taurus; Mars retrograde in Cancer; Sun + Mercury in Pisces.
 * Values are illustrative, not an ephemeris computation.
 */
const SIGNS_EN = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const SIGNS_HI = ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
const LAGNA = 5;

function planet(name_en: string, name_hi: string, longitude: number, retrograde = false): PlanetPosition {
  const sign = Math.floor(longitude / 30) + 1;
  return {
    name_en,
    name_hi,
    longitude,
    retrograde,
    sign,
    sign_en: SIGNS_EN[sign - 1],
    sign_hi: SIGNS_HI[sign - 1],
    degree_in_sign: Number((longitude % 30).toFixed(4)),
    house: ((sign - LAGNA + 12) % 12) + 1,
    nakshatra: { index: Math.floor(longitude / (360 / 27)) + 1, name_en: "Revati", name_hi: "रेवती", pada: 2, lord: "mercury" },
    d9_sign: 1,
  };
}

const planets: Record<PlanetKey, PlanetPosition> = {
  sun: planet("Sun", "सूर्य", 337.5),
  moon: planet("Moon", "चंद्र", 45.25),
  mars: planet("Mars", "मंगल", 100.5833, true),
  mercury: planet("Mercury", "बुध", 350.1),
  jupiter: planet("Jupiter", "गुरु", 85.0),
  venus: planet("Venus", "शुक्र", 300.75),
  saturn: planet("Saturn", "शनि", 290.2),
  rahu: planet("Rahu", "राहु", 295.4, true),
  ketu: planet("Ketu", "केतु", 115.4, true),
};

export const FIXTURE_CHART: ChartData = {
  meta: { ayanamsa: "LAHIRI", ayanamsa_deg: 23.72, birth_utc: "1990-03-12T05:00:00+00:00", julian_day: 2447962.708333, house_system: "whole_sign" },
  ascendant: {
    longitude: 132.4,
    sign: LAGNA,
    sign_en: "Leo",
    sign_hi: "सिंह",
    degree_in_sign: 12.4,
    nakshatra: { index: 10, name_en: "Magha", name_hi: "मघा", pada: 4, lord: "ketu" },
    d9_sign: 4,
  },
  rashi: { sign: 2, sign_en: "Taurus", sign_hi: "वृषभ" },
  planets,
  vimshottari: [
    { lord: "moon", years: 10, start: "1985-06-01", end: "1995-06-01" },
    { lord: "mars", years: 7, start: "1995-06-01", end: "2002-06-01" },
    { lord: "rahu", years: 18, start: "2002-06-01", end: "2020-06-01" },
    {
      lord: "jupiter",
      years: 16,
      start: "2020-06-01",
      end: "2036-06-01",
      antardashas: [
        { lord: "jupiter", start: "2020-06-01", end: "2022-07-20" },
        { lord: "saturn", start: "2022-07-20", end: "2025-02-01" },
        { lord: "mercury", start: "2025-02-01", end: "2027-05-08" },
        { lord: "ketu", start: "2027-05-08", end: "2028-04-14" },
      ],
    },
    { lord: "saturn", years: 19, start: "2036-06-01", end: "2055-06-01" },
    { lord: "mercury", years: 17, start: "2055-06-01", end: "2072-06-01" },
    { lord: "ketu", years: 7, start: "2072-06-01", end: "2079-06-01" },
    { lord: "venus", years: 20, start: "2079-06-01", end: "2099-06-01" },
    { lord: "sun", years: 6, start: "2099-06-01", end: "2105-06-01" },
    { lord: "moon", years: 10, start: "2105-06-01", end: "2115-06-01" },
  ],
  running_mahadasha: { lord: "jupiter", years: 16, start: "2020-06-01", end: "2036-06-01" },
  yogas_doshas: {
    doshas: [
      { key: "manglik", name_hi: "मांगलिक दोष", name_en: "Manglik Dosha", present: true, cancelled: true, severity: "low", details_hi: "मंगल स्वराशि में", details_en: "Mars in own sign" },
      { key: "kaal_sarp", name_hi: "काल सर्प दोष", name_en: "Kaal Sarp Dosha", present: false, details_hi: "नहीं", details_en: "Absent" },
    ],
    yogas: [
      { key: "budhaditya", name_hi: "बुधादित्य योग", name_en: "Budhaditya Yoga", description_hi: "सूर्य और बुध साथ", description_en: "Sun with Mercury", planets: ["sun", "mercury"] },
    ],
  },
};
