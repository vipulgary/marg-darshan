/**
 * Phalit (interpretive) kundali report (AMX-180/181). Pure: ChartData → structured report in one
 * locale. All text comes from ./content (DRAFT until the client's Jyotish approves it).
 */
import { withGlyph } from "@/lib/zodiac";
import { type ChartData, type DashaPeriod, PLANET_ORDER, type PlanetKey } from "@/lib/contracts";
import { ENEMIES, EXALTATION, FRIENDS, HOUSE_NAME, OWN_SIGNS, PLANET_NAME, SIGN_LORD, SIGN_NAMES } from "./content/astro";
import { DASHA } from "./content/dasha";
import { EDUCATION } from "./content/education";
import { LAGNA } from "./content/lagna";
import { type Bi, DISCLAIMER, GEM_NOTE, REPORT_REVIEWED } from "./content/meta";
import { NAKSHATRA } from "./content/nakshatra";
import { DIGNITY_NOTE, PLANET_IN_HOUSE } from "./content/planets";
import { RASHI } from "./content/rashi";
import { type AreaKey, predictArea } from "./predict";
import { DOSHA_GENERIC_REMEDY, DOSHA_REMEDIES, PLANET_LORE } from "./content/remedies";

export type Locale = "hi" | "en";
export type Dignity = "exalted" | "debilitated" | "own" | "friend" | "enemy" | "neutral";

const pick = (b: Bi, l: Locale) => b[l];
const signName = (sign: number, l: Locale) => withGlyph(sign, SIGN_NAMES[(sign - 1 + 12) % 12][l]);
/** Sign index (1..12) counted `n` houses from `from` (1 = same sign). */
export const signFrom = (from: number, n: number) => ((from - 1 + n - 1) % 12) + 1;

export function dignity(planet: PlanetKey, sign: number): Dignity {
  const ex = EXALTATION[planet];
  if (sign === ex) return "exalted";
  if (sign === ((ex + 5) % 12) + 1) return "debilitated";
  if (OWN_SIGNS[planet].includes(sign)) return "own";
  if (planet === "rahu" || planet === "ketu") return "neutral";
  const lord = SIGN_LORD[sign];
  if (FRIENDS[planet].includes(lord)) return "friend";
  if (ENEMIES[planet].includes(lord)) return "enemy";
  return "neutral";
}

/**
 * Lucky gemstone rule (documented for the Jyotish's review): primary = Lagna lord's gem;
 * alternate = 9th lord's gem, else 5th lord's — only when that trikona lord is a different planet
 * and not a natural enemy of the Lagna lord. Rahu/Ketu gems are never suggested automatically.
 */
export function luckyGems(lagnaSign: number): { primary: PlanetKey; alternate: PlanetKey | null } {
  const primary = SIGN_LORD[lagnaSign];
  for (const house of [9, 5]) {
    const lord = SIGN_LORD[signFrom(lagnaSign, house)];
    if (lord !== primary && !ENEMIES[primary].includes(lord) && !ENEMIES[lord].includes(primary)) return { primary, alternate: lord };
  }
  return { primary, alternate: null };
}

const fmtDate = (iso: string, l: Locale) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(l === "hi" ? "hi-IN" : "en-IN", { year: "numeric", month: "short", timeZone: "UTC" });

export function buildReport(chart: ChartData, locale: Locale, now = new Date()) {
  const l = locale;
  const lagnaSign = chart.ascendant.sign;
  const moonSign = chart.rashi.sign;
  const moonNak = chart.planets.moon.nakshatra;
  const lagnaLord = SIGN_LORD[lagnaSign];
  const lagnaText = LAGNA[lagnaSign];
  const rashiText = RASHI[moonSign];
  const nak = NAKSHATRA[moonNak.index];

  const planets = PLANET_ORDER.map((key) => {
    const p = chart.planets[key];
    const d = dignity(key, p.sign);
    return {
      key,
      name: pick(PLANET_NAME[key], l),
      sign: signName(p.sign, l),
      house: p.house,
      houseTopic: pick(HOUSE_NAME[p.house], l),
      retrograde: p.retrograde && key !== "rahu" && key !== "ketu",
      dignity: d,
      result: pick(PLANET_IN_HOUSE[key][p.house - 1], l),
      dignityNote: pick(DIGNITY_NOTE[d], l),
    };
  });

  const today = now.toISOString().slice(0, 10);
  const maha = chart.vimshottari.find((d) => d.start <= today && today < d.end) ?? chart.running_mahadasha ?? null;
  const antar = maha?.antardashas?.find((d) => d.start <= today && today < d.end) ?? null;
  const period = (d: DashaPeriod) => ({ lord: d.lord, name: pick(PLANET_NAME[d.lord], l), from: fmtDate(d.start, l), to: fmtDate(d.end, l) });
  const upcoming = chart.vimshottari.filter((d) => d.start > today).slice(0, 3).map((d) => ({ ...period(d), theme: pick(DASHA[d.lord].theme, l) }));

  const doshas = (chart.yogas_doshas?.doshas ?? []).map((d) => ({
    key: d.key,
    name: l === "hi" ? d.name_hi : d.name_en,
    present: d.present,
    cancelled: !!d.cancelled,
    severity: d.severity ?? null,
    details: l === "hi" ? d.details_hi : d.details_en,
    remedies: d.present && !d.cancelled ? (DOSHA_REMEDIES[d.key] ?? DOSHA_GENERIC_REMEDY).map((r) => pick(r, l)) : [],
  }));
  const yogas = (chart.yogas_doshas?.yogas ?? []).map((y) => ({
    key: y.key,
    name: l === "hi" ? y.name_hi : y.name_en,
    description: l === "hi" ? y.description_hi : y.description_en,
  }));

  // Life areas: plain-language paragraphs composed from this chart's own factors (see ./predict).
  const manglik = (chart.yogas_doshas?.doshas ?? []).find((d) => d.key === "manglik");
  const dashaLords = [maha?.lord, antar?.lord].filter(Boolean) as PlanetKey[];
  const dashaUntil = maha ? fmtDate(maha.end, l) : null;
  const predict = (area: AreaKey, fieldText: string) => predictArea(area, { lagnaSign, planets, dashaLords, dashaUntil, fieldText }, l);
  const life = {
    career: predict("career", `${l === "hi" ? "आपके लिए अनुकूल क्षेत्र" : "Fields that suit you"}: ${pick(lagnaText.career, l)}`),
    love: { ...predict("love", pick(lagnaText.relationships, l)), manglik: manglik ? { present: manglik.present, cancelled: !!manglik.cancelled } : null },
    health: predict("health", pick(lagnaText.health, l)),
    education: predict("education", pick(EDUCATION[lagnaSign], l)),
  };

  const gems = luckyGems(lagnaSign);
  const lore = PLANET_LORE[lagnaLord];

  return {
    reviewed: REPORT_REVIEWED,
    summary: {
      lagna: signName(lagnaSign, l),
      lagnaLord: pick(PLANET_NAME[lagnaLord], l),
      rashi: signName(moonSign, l),
      nakshatra: `${l === "hi" ? moonNak.name_hi : moonNak.name_en} (${moonNak.pada})`,
      currentDasha: maha ? `${pick(PLANET_NAME[maha.lord], l)}${antar ? ` / ${pick(PLANET_NAME[antar.lord], l)}` : ""}` : null,
    },
    lagna: {
      sign: signName(lagnaSign, l),
      personality: pick(lagnaText.personality, l),
      strengths: pick(lagnaText.strengths, l),
      challenges: pick(lagnaText.challenges, l),
      career: pick(lagnaText.career, l),
      relationships: pick(lagnaText.relationships, l),
      health: pick(lagnaText.health, l),
    },
    rashi: { sign: signName(moonSign, l), mind: pick(rashiText.mind, l), tip: pick(rashiText.tip, l) },
    nakshatra: { name: l === "hi" ? moonNak.name_hi : moonNak.name_en, pada: moonNak.pada, deity: pick(nak.deity, l), traits: pick(nak.traits, l) },
    planets,
    life,
    currentDasha: maha
      ? {
          maha: period(maha),
          antar: antar ? period(antar) : null,
          theme: pick(DASHA[maha.lord].theme, l),
          focus: pick(DASHA[maha.lord].focus, l),
          antarNote: antar ? pick(DASHA[antar.lord].antar, l) : null,
        }
      : null,
    upcomingDashas: upcoming,
    doshas,
    yogas,
    lucky: {
      gem: pick(PLANET_LORE[gems.primary].gem, l),
      alternateGem: gems.alternate ? pick(PLANET_LORE[gems.alternate].gem, l) : null,
      gemNote: pick(GEM_NOTE, l),
      day: pick(lore.day, l),
      colour: pick(lore.colour, l),
      number: lore.number,
      metal: pick(lore.metal, l),
      deity: pick(lore.deity, l),
      mantra: lore.mantra,
      daan: pick(lore.daan, l),
    },
    disclaimer: pick(DISCLAIMER, l),
  };
}

export type KundaliReport = ReturnType<typeof buildReport>;
