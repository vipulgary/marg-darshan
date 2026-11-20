import tzlookup from "@photostructure/tz-lookup";

/**
 * IANA time zone for a coordinate, offline (no engine, no network). "Use my location" needs this:
 * the browser's own zone is the visitor's clock setting, not where they are standing.
 */
export function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return Response.json({ error: "invalid_coordinates" }, { status: 400 });
  }
  try {
    return Response.json({ tzName: tzlookup(lat, lng) }, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch {
    return Response.json({ error: "unknown_zone" }, { status: 404 });
  }
}
