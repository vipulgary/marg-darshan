import type { PlaceValue } from "@/lib/contracts";

/**
 * Fallback birthplace search straight from OpenStreetMap Nominatim, used when the astro
 * engine (geopy + timezonefinder) is not running. Respects the Nominatim usage policy:
 * identifying User-Agent, max 1 request/second, results cached.
 */

const ENDPOINT = "https://nominatim.openstreetmap.org/search";
const MIN_INTERVAL_MS = 1100;
const CACHE_TTL_MS = 24 * 3600 * 1000;

/** Countries with a single IANA zone (most clients are in India or common NRI destinations). */
const SINGLE_ZONE: Record<string, string> = {
  in: "Asia/Kolkata", np: "Asia/Kathmandu", lk: "Asia/Colombo", bd: "Asia/Dhaka", pk: "Asia/Karachi",
  bt: "Asia/Thimphu", ae: "Asia/Dubai", sa: "Asia/Riyadh", qa: "Asia/Qatar", om: "Asia/Muscat",
  kw: "Asia/Kuwait", bh: "Asia/Bahrain", sg: "Asia/Singapore", my: "Asia/Kuala_Lumpur", th: "Asia/Bangkok",
  hk: "Asia/Hong_Kong", jp: "Asia/Tokyo", kr: "Asia/Seoul", cn: "Asia/Shanghai", gb: "Europe/London",
  ie: "Europe/Dublin", de: "Europe/Berlin", fr: "Europe/Paris", it: "Europe/Rome", nl: "Europe/Amsterdam",
  ch: "Europe/Zurich", be: "Europe/Brussels", se: "Europe/Stockholm", no: "Europe/Oslo", za: "Africa/Johannesburg",
  ke: "Africa/Nairobi", ng: "Africa/Lagos", nz: "Pacific/Auckland", mu: "Indian/Mauritius", fj: "Pacific/Fiji",
};

/**
 * Best-effort IANA zone. Exact for single-zone countries; otherwise a fixed offset from
 * longitude (Etc/GMT sign is inverted by convention). The engine replaces this when available.
 */
export function guessTimeZone(countryCode: string | undefined, longitude: number): { tzName: string; approximate: boolean } {
  const cc = countryCode?.toLowerCase();
  if (cc && SINGLE_ZONE[cc]) return { tzName: SINGLE_ZONE[cc], approximate: false };
  const offset = Math.max(-12, Math.min(14, Math.round(longitude / 15)));
  return { tzName: offset === 0 ? "Etc/GMT" : `Etc/GMT${offset > 0 ? "-" : "+"}${Math.abs(offset)}`, approximate: true };
}

interface NominatimHit {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
}

export function toPlace(hit: NominatimHit): PlaceValue & { approximateTz: boolean } {
  const latitude = Number(Number(hit.lat).toFixed(6));
  const longitude = Number(Number(hit.lon).toFixed(6));
  const a = hit.address ?? {};
  const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? hit.display_name.split(",")[0];
  const placeName = [city, a.state ?? a.state_district, a.country].filter(Boolean).join(", ");
  const tz = guessTimeZone(a.country_code, longitude);
  return { placeName: placeName || hit.display_name, latitude, longitude, tzName: tz.tzName, approximateTz: tz.approximate };
}

const cache = new Map<string, { at: number; places: PlaceValue[] }>();
let lastCall = 0;
let queue: Promise<unknown> = Promise.resolve();

export async function searchNominatim(query: string, fetchImpl: typeof fetch = fetch): Promise<PlaceValue[]> {
  const key = query.trim().toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.places;

  // Serialise calls so this process never exceeds ~1 request/second.
  const run = queue.then(async () => {
    const wait = lastCall + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
    const url = `${ENDPOINT}?${new URLSearchParams({ q: query, format: "jsonv2", addressdetails: "1", limit: "8", "accept-language": "en" })}`;
    const res = await fetchImpl(url, {
      headers: { "User-Agent": process.env.GEOCODER_USER_AGENT ?? "astromax-geo/0.1 (dev)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`nominatim ${res.status}`);
    return ((await res.json()) as NominatimHit[]).map(toPlace);
  });
  queue = run.catch(() => undefined);
  const places = await run;
  cache.set(key, { at: Date.now(), places });
  return places;
}
