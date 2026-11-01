/**
 * Cross-module contracts. Shapes here mirror the Python engine's JSON
 * (apps/engine/app/services/chart.py, doshas.py, yogas.py) — keep them in sync.
 */

/** A resolved birthplace / property location. */
export interface PlaceValue {
  placeName: string;
  latitude: number;
  longitude: number;
  tzName: string; // IANA, e.g. Asia/Kolkata
}

export type PlanetKey = "sun" | "moon" | "mars" | "mercury" | "jupiter" | "venus" | "saturn" | "rahu" | "ketu";

export const PLANET_ORDER: PlanetKey[] = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];

export interface Nakshatra {
  index: number; // 1..27
  name_en: string;
  name_hi: string;
  pada: number; // 1..4
  lord: PlanetKey;
}

export interface PlanetPosition {
  name_en: string;
  name_hi: string;
  longitude: number; // sidereal 0..360
  retrograde: boolean;
  sign: number; // 1 = Aries .. 12 = Pisces
  sign_en: string;
  sign_hi: string;
  degree_in_sign: number;
  house: number; // whole-sign house from Lagna, 1..12
  nakshatra: Nakshatra;
  d9_sign: number; // 1..12
}

export interface DashaPeriod {
  lord: PlanetKey;
  years?: number;
  start: string; // ISO date
  end: string; // ISO date
  antardashas?: DashaPeriod[];
}

export interface Dosha {
  key: string; // manglik | kaal_sarp | sade_sati | pitru | guru_chandal | shrapit | grahan ...
  name_hi: string;
  name_en: string;
  present: boolean;
  cancelled?: boolean;
  severity?: "low" | "medium" | "high";
  details_hi: string;
  details_en: string;
}

export interface Yoga {
  key: string;
  name_hi: string;
  name_en: string;
  description_hi: string;
  description_en: string;
  planets: PlanetKey[];
}

export interface ChartData {
  meta: { ayanamsa: string; ayanamsa_deg: number; birth_utc: string; julian_day: number; house_system: string };
  ascendant: {
    longitude: number;
    sign: number;
    sign_en: string;
    sign_hi: string;
    degree_in_sign: number;
    nakshatra: Nakshatra;
    d9_sign: number;
  };
  rashi: { sign: number; sign_en: string; sign_hi: string };
  planets: Record<PlanetKey, PlanetPosition>;
  vimshottari: DashaPeriod[];
  running_mahadasha: DashaPeriod | null;
  vargas?: { status: "ok" | "unavailable"; reason?: string; charts?: Record<string, unknown> };
  yogas_doshas?: { doshas: Dosha[]; yogas: Yoga[] };
}

export interface BirthInput {
  name: string;
  gender: "male" | "female" | "other";
  dob: string; // YYYY-MM-DD
  tob: string; // HH:mm (24h)
  place: PlaceValue;
  lang: "hi" | "en";
}
