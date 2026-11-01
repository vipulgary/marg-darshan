// DRAFT — to be reviewed and approved by the client's Jyotish before launch
import type { PlanetKey } from "@/lib/contracts";
import type { Bi } from "./meta";

/** Classical (Parashari) sign lordship, index 1..12 → lord. Rahu/Ketu own no sign here. */
export const SIGN_LORD: Record<number, PlanetKey> = {
  1: "mars", 2: "venus", 3: "mercury", 4: "moon", 5: "sun", 6: "mercury",
  7: "venus", 8: "mars", 9: "jupiter", 10: "saturn", 11: "saturn", 12: "jupiter",
};

export const SIGN_NAMES: Bi[] = [
  { hi: "मेष", en: "Aries" }, { hi: "वृषभ", en: "Taurus" }, { hi: "मिथुन", en: "Gemini" }, { hi: "कर्क", en: "Cancer" },
  { hi: "सिंह", en: "Leo" }, { hi: "कन्या", en: "Virgo" }, { hi: "तुला", en: "Libra" }, { hi: "वृश्चिक", en: "Scorpio" },
  { hi: "धनु", en: "Sagittarius" }, { hi: "मकर", en: "Capricorn" }, { hi: "कुंभ", en: "Aquarius" }, { hi: "मीन", en: "Pisces" },
];

export const PLANET_NAME: Record<PlanetKey, Bi> = {
  sun: { hi: "सूर्य", en: "Sun" }, moon: { hi: "चंद्र", en: "Moon" }, mars: { hi: "मंगल", en: "Mars" },
  mercury: { hi: "बुध", en: "Mercury" }, jupiter: { hi: "गुरु", en: "Jupiter" }, venus: { hi: "शुक्र", en: "Venus" },
  saturn: { hi: "शनि", en: "Saturn" }, rahu: { hi: "राहु", en: "Rahu" }, ketu: { hi: "केतु", en: "Ketu" },
};

/** Exaltation signs (Rahu Taurus / Ketu Scorpio per the common modern convention). Debilitation = opposite sign. */
export const EXALTATION: Record<PlanetKey, number> = {
  sun: 1, moon: 2, mars: 10, mercury: 6, jupiter: 4, venus: 12, saturn: 7, rahu: 2, ketu: 8,
};

export const OWN_SIGNS: Record<PlanetKey, number[]> = {
  sun: [5], moon: [4], mars: [1, 8], mercury: [3, 6], jupiter: [9, 12], venus: [2, 7], saturn: [10, 11], rahu: [], ketu: [],
};

/** Naisargika (natural) friendships. Planets not listed are neutral. Nodes are treated as neutral. */
export const FRIENDS: Record<PlanetKey, PlanetKey[]> = {
  sun: ["moon", "mars", "jupiter"], moon: ["sun", "mercury"], mars: ["sun", "moon", "jupiter"],
  mercury: ["sun", "venus"], jupiter: ["sun", "moon", "mars"], venus: ["mercury", "saturn"],
  saturn: ["mercury", "venus"], rahu: [], ketu: [],
};
export const ENEMIES: Record<PlanetKey, PlanetKey[]> = {
  sun: ["venus", "saturn"], moon: [], mars: ["mercury"], mercury: ["moon"], jupiter: ["mercury", "venus"],
  venus: ["sun", "moon"], saturn: ["sun", "moon", "mars"], rahu: [], ketu: [],
};

export const HOUSE_NAME: Record<number, Bi> = {
  1: { hi: "स्वभाव और शरीर", en: "self and body" }, 2: { hi: "धन और परिवार", en: "wealth and family" },
  3: { hi: "साहस और भाई-बहन", en: "courage and siblings" }, 4: { hi: "माता, घर और सुख", en: "mother, home and comfort" },
  5: { hi: "बुद्धि, संतान और रचनात्मकता", en: "intellect, children and creativity" }, 6: { hi: "रोग, ऋण और प्रतियोगिता", en: "health, debts and competition" },
  7: { hi: "विवाह और साझेदारी", en: "marriage and partnership" }, 8: { hi: "आयु, रहस्य और परिवर्तन", en: "longevity, the hidden and transformation" },
  9: { hi: "भाग्य, धर्म और गुरु", en: "fortune, dharma and teachers" }, 10: { hi: "कर्म और करियर", en: "career and karma" },
  11: { hi: "लाभ और मित्र", en: "gains and friends" }, 12: { hi: "व्यय, विदेश और मोक्ष", en: "expenses, foreign lands and liberation" },
};
