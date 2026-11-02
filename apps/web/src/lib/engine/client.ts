/**
 * Server-side client for the Python astro engine (apps/engine). Never import this
 * from a client component: it reads ENGINE_KEY.
 */
import type { BirthInput, ChartData, PlaceValue } from "@/lib/contracts";

export class EngineError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "EngineError";
  }
}

const SEARCH_TIMEOUT_MS = 8_000;
const COMPUTE_TIMEOUT_MS = 30_000;

export function isEngineConfigured(): boolean {
  return Boolean(process.env.ENGINE_URL);
}

function config() {
  const base = process.env.ENGINE_URL;
  if (!base) throw new EngineError(503, "ENGINE_URL is not configured");
  return { base: base.replace(/\/+$/, ""), key: process.env.ENGINE_KEY ?? "" };
}

async function call<T>(path: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const { base, key } = config();
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-Engine-Key": key, ...init.headers },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    const name = (err as Error)?.name;
    if (name === "TimeoutError" || name === "AbortError") throw new EngineError(504, `engine timed out after ${timeoutMs}ms`);
    throw new EngineError(502, `engine unreachable: ${(err as Error)?.message ?? err}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let detail = body.slice(0, 500);
    try {
      const parsed = JSON.parse(body) as { detail?: unknown };
      if (typeof parsed.detail === "string") detail = parsed.detail;
    } catch {
      // non-JSON error body: keep the raw text
    }
    // 4xx from the engine means our input was rejected; anything else is an upstream failure.
    const status = res.status >= 400 && res.status < 500 && res.status !== 401 && res.status !== 403 ? res.status : 502;
    throw new EngineError(status, `engine ${res.status}: ${detail}`);
  }
  return (await res.json()) as T;
}

interface EnginePlace {
  place_name?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  tz_name?: unknown;
}

/** Maps the engine's snake_case place to PlaceValue; drops malformed rows. */
export function toPlaceValue(p: EnginePlace): PlaceValue | null {
  const latitude = Number(p.latitude);
  const longitude = Number(p.longitude);
  if (typeof p.place_name !== "string" || !p.place_name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    placeName: p.place_name,
    latitude,
    longitude,
    tzName: typeof p.tz_name === "string" && p.tz_name ? p.tz_name : "UTC",
  };
}

export async function searchPlaces(q: string): Promise<PlaceValue[]> {
  const rows = await call<unknown>(`/api/v1/geo/search?q=${encodeURIComponent(q)}`, { method: "GET" }, SEARCH_TIMEOUT_MS);
  if (!Array.isArray(rows)) throw new EngineError(502, "engine returned a non-list for geo search");
  return rows.map((r) => toPlaceValue(r as EnginePlace)).filter((p): p is PlaceValue => p !== null);
}

export async function computeHoroscope(input: BirthInput): Promise<ChartData> {
  const tob = input.tob.length === 5 ? `${input.tob}:00` : input.tob;
  const chart = await call<ChartData>(
    "/api/v1/horoscope/compute",
    {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        gender: input.gender,
        dob: input.dob,
        tob,
        latitude: input.place.latitude,
        longitude: input.place.longitude,
        tz_name: input.place.tzName,
        place_name: input.place.placeName,
        lang: input.lang,
      }),
    },
    COMPUTE_TIMEOUT_MS,
  );
  if (!chart || typeof chart !== "object" || !chart.ascendant || !chart.planets) {
    throw new EngineError(502, "engine returned an unexpected chart shape");
  }
  return chart;
}

export interface PanchangName {
  name_en: string;
  name_hi: string;
}

export interface PanchangData {
  date: string;
  tz_name: string;
  sunrise: string | null;
  sunset: string | null;
  vara: PanchangName;
  tithi: PanchangName & { paksha: "shukla" | "krishna"; paksha_en: string; paksha_hi: string };
  nakshatra: PanchangName;
  yoga: PanchangName;
}

/** AMX-122: udaya panchang for a date/place (engine 503 when swisseph is missing). */
export async function getPanchang(params: { date?: string; lat: number; lng: number; tz: string }): Promise<PanchangData> {
  const qs = new URLSearchParams({ lat: String(params.lat), lng: String(params.lng), tz: params.tz });
  if (params.date) qs.set("date", params.date);
  const data = await call<PanchangData>(`/api/v1/panchang?${qs}`, { method: "GET" }, SEARCH_TIMEOUT_MS);
  if (!data || typeof data !== "object" || !data.tithi || !data.vara) throw new EngineError(502, "engine returned an unexpected panchang shape");
  return data;
}

export interface MatchPerson {
  name: string;
  nakshatra_en: string;
  nakshatra_hi: string;
  rashi_en: string;
  rashi_hi: string;
  lagna_en: string;
  lagna_hi: string;
  manglik: boolean;
}

export interface MatchResult {
  koots: { key: "varna" | "vashya" | "tara" | "yoni" | "maitri" | "gana" | "bhakoot" | "nadi"; score: number; max: number }[];
  total: number;
  max: 36;
  verdict: "excellent" | "good" | "average" | "low";
  nadi_dosha: { present: boolean; cancelled: boolean };
  bhakoot_dosha: { present: boolean; cancelled: boolean; distance: number };
  manglik: "none" | "one" | "both" | "unknown";
  boy: MatchPerson;
  girl: MatchPerson;
  /** Both full charts (web API adds them) for the side-by-side comparison. */
  charts?: { boy: ChartData; girl: ChartData };
  /** Set when a birth time is unknown: the score range over the possible Moon nakshatras that day. */
  certainty?: {
    min: number;
    max: number;
    likely: number;
    exact: boolean;
    uncertain_koots: string[];
    options: { total: number; weight: number; boy_nakshatra_en: string; boy_nakshatra_hi: string; girl_nakshatra_en: string; girl_nakshatra_hi: string }[];
  } | null;
  /** Next marriage muhurats (only for a workable match). */
  vivah_muhurats?: { date: string; weekday_en: string; weekday_hi: string; tithi_en: string; tithi_hi: string; nakshatra_en: string; nakshatra_hi: string; from: string; to: string }[];
}

/** Ashtakoot Guna Milan for two birth inputs (engine computes both charts). */
export async function matchCharts(boy: BirthInput, girl: BirthInput, known: { boy: boolean; girl: boolean } = { boy: true, girl: true }): Promise<MatchResult> {
  const body = (p: BirthInput) => ({
    name: p.name,
    gender: p.gender,
    dob: p.dob,
    tob: p.tob.length === 5 ? `${p.tob}:00` : p.tob,
    latitude: p.place.latitude,
    longitude: p.place.longitude,
    tz_name: p.place.tzName,
    place_name: p.place.placeName,
    lang: p.lang,
  });
  return call<MatchResult>(
    "/api/v1/match",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ boy: body(boy), girl: body(girl), boy_time_known: known.boy, girl_time_known: known.girl }) },
    60_000,
  );
}
