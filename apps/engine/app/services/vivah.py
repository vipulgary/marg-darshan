"""Vivah (marriage) muhurat finder — DRAFT rules, to be reviewed by the client's Jyotish.

Scans forward day by day and keeps dates where, at that day's sunrise:
  * the Moon's nakshatra is one of the classical marriage nakshatras,
  * the tithi is not Rikta (4, 9, 14) nor the last days of Krishna paksha (13, 14, Amavasya),
  * the weekday is not Tuesday,
  * the Sun is not in Sagittarius/Pisces (Kharmas) nor Cancer–Libra (Chaturmas, approx.),
  * Jupiter and Venus are not combust (too close to the Sun),
  * the Moon is not 4th, 8th or 12th from either partner's natal Moon (Chandra bala).
The time window is the part of the day (sunrise → next sunrise) the nakshatra stays favourable;
days where that is under 2 hours are skipped.
"""
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

VIVAH_NAKSHATRAS = {4, 5, 10, 12, 13, 15, 17, 19, 21, 26, 27}  # Rohini … Revati
RIKTA = {4, 9, 14}
NAK_SPAN = 360 / 27


def _lon(jd: float, body: int) -> float:
    from app.services import chart as chart_mod

    return chart_mod.sidereal_longitude(jd, body)[0]


def _combust(sun: float, planet: float, orb: float) -> bool:
    d = abs((planet - sun + 180) % 360 - 180)
    return d < orb


def _nak(lon: float) -> int:
    return int(lon // NAK_SPAN) % 27 + 1


def find(boy_moon_sign: int, girl_moon_sign: int, lat: float, lng: float, tz_name: str,
         start: date | None = None, count: int = 4, horizon_days: int = 420) -> list[dict]:
    from app.services import chart as chart_mod
    from app.services.astro_constants import NAKSHATRAS_EN, NAKSHATRAS_HI
    from app.services.panchang import datetime_to_jd, jd_to_datetime, panchang_for

    swe = chart_mod.swe
    tz = ZoneInfo(tz_name)
    day = (start or datetime.now(tz).date()) + timedelta(days=1)
    out: list[dict] = []
    for _ in range(horizon_days):
        day_next = day + timedelta(days=1)
        # Quick screen at 06:00 local (weekday, season, nakshatra near sunrise) before the costly sunrise maths.
        jd6 = datetime_to_jd(datetime.combine(day, time(6, 0), tzinfo=tz))
        sun6 = _lon(jd6, swe.SUN)
        near = {_nak(_lon(jd6 + dh / 24, swe.MOON)) for dh in (-1.5, 0, 1.5)}
        if day.weekday() == 1 or int(sun6 // 30) + 1 in (9, 12, 4, 5, 6, 7) or not near & VIVAH_NAKSHATRAS:
            day = day_next
            continue
        p = panchang_for(day, lat, lng, tz_name)
        if not p["sunrise"]:
            day = day_next
            continue
        rise = datetime.fromisoformat(p["sunrise"])
        jd = datetime_to_jd(rise)
        sun = p["sun_longitude"]
        moon = p["moon_longitude"]
        sun_sign = int(sun // 30) + 1
        moon_sign = int(moon // 30) + 1
        ok = (
            p["nakshatra"]["index"] in VIVAH_NAKSHATRAS
            and p["tithi"]["number_in_paksha"] not in RIKTA
            and p["tithi"]["index"] < 28  # no Krishna 13, 14 or Amavasya
            and day.weekday() != 1  # Tuesday
            and sun_sign not in (9, 12, 4, 5, 6, 7)
            and not _combust(sun, _lon(jd, swe.JUPITER), 11)
            and not _combust(sun, _lon(jd, swe.VENUS), 10)
            and all((moon_sign - m) % 12 + 1 not in (4, 8, 12) for m in (boy_moon_sign, girl_moon_sign))
        )
        if ok:
            nak = p["nakshatra"]["index"]
            # Walk forward in 10-minute steps until the nakshatra changes (or the next sunrise).
            end = rise
            limit = datetime.combine(day_next, time(6, 0), tzinfo=tz) + timedelta(hours=1)
            while end < limit and _nak(_lon(datetime_to_jd(end + timedelta(minutes=10)), swe.MOON)) == nak:
                end += timedelta(minutes=10)
            if end - rise < timedelta(hours=2):
                day = day_next
                continue
            out.append({
                "date": day.isoformat(),
                "weekday_en": p["vara"]["name_en"], "weekday_hi": p["vara"]["name_hi"],
                "tithi_en": f'{p["tithi"]["paksha_en"]} {p["tithi"]["name_en"]}',
                "tithi_hi": f'{p["tithi"]["paksha_hi"]} {p["tithi"]["name_hi"]}',
                "nakshatra_en": NAKSHATRAS_EN[nak - 1], "nakshatra_hi": NAKSHATRAS_HI[nak - 1],
                "from": rise.isoformat(timespec="minutes"),
                "to": end.astimezone(tz).isoformat(timespec="minutes"),
            })
            if len(out) >= count:
                break
        day = day_next
    return out
