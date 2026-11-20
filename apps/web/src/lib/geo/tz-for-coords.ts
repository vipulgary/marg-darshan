/**
 * Client helper: time zone where the coordinates are (via /api/geo/tz), falling back to the
 * browser's zone if the lookup fails. Never use the browser zone alone for a located point —
 * a laptop set to another zone would shift every sunrise-based timing.
 */
export async function tzForCoords(lat: number, lng: number, fallback = "Asia/Kolkata"): Promise<string> {
  try {
    const res = await fetch(`/api/geo/tz?lat=${lat}&lng=${lng}`, { signal: AbortSignal.timeout(8_000) });
    if (res.ok) {
      const { tzName } = (await res.json()) as { tzName?: string };
      if (tzName) return tzName;
    }
  } catch {
    // fall through
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
}
