"""Birthplace → lat/long → IANA timezone → UTC offset at the birth moment (AMX-042)."""
from datetime import date, datetime, time
from functools import lru_cache
from zoneinfo import ZoneInfo

from geopy.extra.rate_limiter import RateLimiter
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder

from app.config import GEOCODER_USER_AGENT

_tf = TimezoneFinder()
_geocoder = Nominatim(user_agent=GEOCODER_USER_AGENT, timeout=10)
# Nominatim usage policy: max 1 request/second.
_geocode = RateLimiter(_geocoder.geocode, min_delay_seconds=1.0)


def timezone_at(lat: float, lng: float) -> str:
    return _tf.timezone_at(lat=lat, lng=lng) or "UTC"


def utc_offset_hours(tz_name: str, on: date, at: time | None = None) -> float:
    """Offset for that local wall-clock time, using tzdata history (e.g. pre-1955 Bombay Time)."""
    local = datetime.combine(on, at or time(12, 0), tzinfo=ZoneInfo(tz_name))
    return local.utcoffset().total_seconds() / 3600


@lru_cache(maxsize=2048)
def search(query: str, limit: int = 8) -> list[dict]:
    results = _geocode(query, exactly_one=False, limit=limit, addressdetails=True,
                       language="en", country_codes=None) or []
    out = []
    for r in results:
        out.append({
            "place_name": r.address,
            "latitude": round(r.latitude, 6),
            "longitude": round(r.longitude, 6),
            "tz_name": timezone_at(r.latitude, r.longitude),
        })
    return out


def resolve(place: str | None, lat: float | None, lng: float | None) -> dict | None:
    if lat is not None and lng is not None:
        return {"place_name": place or f"{lat:.4f}, {lng:.4f}", "latitude": lat,
                "longitude": lng, "tz_name": timezone_at(lat, lng)}
    if place:
        hits = search(place, limit=1)
        return hits[0] if hits else None
    return None
