// DRAFT — gem rules to be reviewed and approved by the client's Jyotish before launch
/**
 * AMX-204 — Gem Finder. Pure: (Lagna, concerns, body weight) → safe gem suggestions.
 *
 * Safety first: a gem strengthens its planet, so it is only suggested when that planet is a
 * friend of this Lagna — lord of the 1st, 5th or 9th (or the 10th / 4th when that planet does
 * not also rule the 6th, 8th or 12th). Lords of 6/8/12 are never suggested.
 * Weight: the traditional rule of about 1 ratti per 10 kg body weight, kept inside each
 * stone's customary range.
 */
import type { PlanetKey } from "@/lib/contracts";
import { SIGN_LORD } from "@/lib/report/content/astro";
import type { Bi } from "@/lib/report/content/meta";
import { PLANET_LORE } from "@/lib/report/content/remedies";

export type Concern = "marriage" | "career" | "money" | "calm" | "health" | "study" | "confidence";
export const CONCERNS: { key: Concern; label: Bi; planets: PlanetKey[] }[] = [
  { key: "marriage", label: { hi: "विवाह में देरी / रिश्ते", en: "Marriage delay / relationships" }, planets: ["venus", "jupiter", "moon"] },
  { key: "career", label: { hi: "करियर और नौकरी", en: "Career & job" }, planets: ["sun", "saturn", "mercury", "jupiter"] },
  { key: "money", label: { hi: "धन और व्यापार", en: "Money & business" }, planets: ["jupiter", "mercury", "venus"] },
  { key: "calm", label: { hi: "गुस्सा, तनाव, बेचैनी", en: "Anger, stress, restlessness" }, planets: ["moon", "jupiter", "venus"] },
  { key: "health", label: { hi: "सेहत और ऊर्जा", en: "Health & energy" }, planets: ["sun", "mars", "moon"] },
  { key: "study", label: { hi: "पढ़ाई और एकाग्रता", en: "Studies & focus" }, planets: ["mercury", "jupiter"] },
  { key: "confidence", label: { hi: "आत्मविश्वास और सम्मान", en: "Confidence & respect" }, planets: ["sun", "mars", "jupiter"] },
];

/** Customary weight range per stone (ratti; diamond is quoted in carat). */
export const GEM_SPEC: Record<PlanetKey, { min: number; max: number; unit: "ratti" | "carat"; finger: Bi; note?: Bi }> = {
  sun: { min: 3, max: 6, unit: "ratti", finger: { hi: "अनामिका (रिंग फ़िंगर)", en: "Ring finger" } },
  moon: { min: 4, max: 7, unit: "ratti", finger: { hi: "कनिष्ठा (छोटी उँगली)", en: "Little finger" } },
  mars: { min: 5, max: 9, unit: "ratti", finger: { hi: "अनामिका", en: "Ring finger" } },
  mercury: { min: 3, max: 6, unit: "ratti", finger: { hi: "कनिष्ठा", en: "Little finger" } },
  jupiter: { min: 3, max: 6, unit: "ratti", finger: { hi: "तर्जनी (पहली उँगली)", en: "Index finger" } },
  venus: { min: 0.5, max: 1.5, unit: "carat", finger: { hi: "मध्यमा या कनिष्ठा", en: "Middle or little finger" } },
  saturn: { min: 3, max: 6, unit: "ratti", finger: { hi: "मध्यमा (बीच की उँगली)", en: "Middle finger" }, note: { hi: "नीलम तेज़ असर करता है — पहले 3 दिन परीक्षण के लिए पहनें।", en: "Blue sapphire acts fast — wear it on a 3-day trial first." } },
  rahu: { min: 5, max: 8, unit: "ratti", finger: { hi: "मध्यमा", en: "Middle finger" } },
  ketu: { min: 4, max: 7, unit: "ratti", finger: { hi: "कनिष्ठा", en: "Little finger" } },
};

const signFrom = (from: number, n: number) => ((from - 1 + n - 1) % 12) + 1;
const lordOf = (lagna: number, house: number) => SIGN_LORD[signFrom(lagna, house)];

/**
 * Lords of the 6th, 8th or 12th — except the Lagna lord, and a trikona (5th/9th) lord that
 * doesn't also rule the 8th (classically a trikona lord stays favourable, e.g. Venus for Gemini).
 */
function unsafeLords(lagna: number): Set<PlanetKey> {
  const bad = new Set([6, 8, 12].map((h) => lordOf(lagna, h)));
  bad.delete(lordOf(lagna, 1));
  const eighth = lordOf(lagna, 8);
  for (const h of [5, 9]) if (lordOf(lagna, h) !== eighth) bad.delete(lordOf(lagna, h));
  return bad;
}

/** Planets whose gem is safe for this Lagna, best first, with the houses that make them so. */
export function safePlanets(lagna: number): { planet: PlanetKey; houses: number[] }[] {
  const bad = unsafeLords(lagna);
  const out: { planet: PlanetKey; houses: number[] }[] = [];
  for (const h of [1, 9, 5, 10, 4]) {
    const p = lordOf(lagna, h);
    if (bad.has(p)) continue;
    const hit = out.find((x) => x.planet === p);
    if (hit) hit.houses.push(h);
    else out.push({ planet: p, houses: [h] });
  }
  return out;
}

/** Recommended weight: ~1 ratti per 10 kg, clamped to the stone's range; diamonds scale gently in carat. */
export function recommendedWeight(planet: PlanetKey, weightKg: number): number {
  const s = GEM_SPEC[planet];
  const raw = s.unit === "carat" ? 0.5 + Math.max(0, weightKg - 40) / 80 : weightKg / 10;
  const clamped = Math.min(s.max, Math.max(s.min, raw));
  return s.unit === "carat" ? Math.round(clamped * 4) / 4 : Math.round(clamped * 2) / 2;
}

const HOUSE_WHY: Record<number, Bi> = {
  1: { hi: "आपके लग्न का स्वामी — सबसे सुरक्षित, स्वास्थ्य और आत्मविश्वास देता है", en: "your Lagna lord — the safest, gives health and confidence" },
  9: { hi: "भाग्य भाव का स्वामी — किस्मत और आशीर्वाद बढ़ाता है", en: "lord of fortune (9th) — boosts luck and blessings" },
  5: { hi: "पंचम भाव का स्वामी — बुद्धि, प्रेम और संतान सुख", en: "lord of the 5th — intellect, romance and children" },
  10: { hi: "कर्म भाव का स्वामी — करियर और सम्मान", en: "lord of the 10th — career and status" },
  4: { hi: "सुख भाव का स्वामी — घर, मन की शांति", en: "lord of the 4th — home and peace of mind" },
};

export interface GemSuggestion {
  planet: PlanetKey;
  gem: string;
  weight: number;
  unit: "ratti" | "carat";
  why: string;
  helps: Concern[];
  finger: string;
  metal: string;
  day: string;
  mantra: string;
  note?: string;
}

/** Up to three safe gems ordered by how many chosen concerns they help, then by protective strength. */
export function findGems(lagna: number, concerns: Concern[], weightKg: number, l: "hi" | "en"): { gems: GemSuggestion[]; avoid: string[] } {
  const safe = safePlanets(lagna);
  const want = CONCERNS.filter((c) => concerns.includes(c.key));
  const scored = safe.map((s, rank) => {
    const helps = want.filter((c) => c.planets.includes(s.planet)).map((c) => c.key);
    return { ...s, helps, score: helps.length * 10 - rank };
  });
  scored.sort((a, b) => b.score - a.score);
  const picked = (want.length ? scored.filter((s) => s.helps.length) : scored).slice(0, 3);
  if (!picked.length) picked.push(scored[0]); // nothing matched: the Lagna lord's gem is the safe general choice

  const unsafe = unsafeLords(lagna);
  return {
    gems: picked.map((s) => {
      const lore = PLANET_LORE[s.planet];
      const spec = GEM_SPEC[s.planet];
      return {
        planet: s.planet,
        gem: lore.gem[l],
        weight: recommendedWeight(s.planet, weightKg),
        unit: spec.unit,
        why: s.houses.map((h) => HOUSE_WHY[h][l]).join("; "),
        helps: s.helps,
        finger: spec.finger[l],
        metal: lore.metal[l],
        day: lore.day[l],
        mantra: lore.mantra,
        note: spec.note?.[l],
      };
    }),
    avoid: [...unsafe].map((p) => PLANET_LORE[p].gem[l]),
  };
}
