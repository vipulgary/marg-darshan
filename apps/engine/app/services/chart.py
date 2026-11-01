"""Sidereal (Lahiri) natal chart core on Swiss Ephemeris (AMX-043).

Produces planets, ascendant, whole-sign houses, nakshatras, D9 and the
Vimshottari mahadasha sequence (each with its antardashas). Divisional charts
D2–D60, Balas and Ashtakavarga come from jyotishyamitra (see vargas.py).
Pure rules/constants live in astro_constants.py and dasha.py so they can be
used and tested without swisseph.
"""
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import swisseph as swe

from app.config import EPHE_PATH
from app.services.astro_constants import (  # noqa: F401 — re-exported for existing callers
    DASHA_ORDER, NAK_SPAN, NAKSHATRAS_EN, NAKSHATRAS_HI, SIGNS_EN, SIGNS_HI, YEAR_DAYS,
    nakshatra, navamsa_sign, sign_of,
)
from app.services.dasha import running_dasha, vimshottari  # noqa: F401

if EPHE_PATH.exists():
    swe.set_ephe_path(str(EPHE_PATH))
swe.set_sid_mode(swe.SIDM_LAHIRI)

FLAGS = swe.FLG_SWIEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED

PLANETS = [  # (key, swe id, en, hi)
    ("sun", swe.SUN, "Sun", "सूर्य"),
    ("moon", swe.MOON, "Moon", "चंद्र"),
    ("mars", swe.MARS, "Mars", "मंगल"),
    ("mercury", swe.MERCURY, "Mercury", "बुध"),
    ("jupiter", swe.JUPITER, "Jupiter", "गुरु"),
    ("venus", swe.VENUS, "Venus", "शुक्र"),
    ("saturn", swe.SATURN, "Saturn", "शनि"),
    ("rahu", swe.MEAN_NODE, "Rahu", "राहु"),
]
KETU = ("ketu", "Ketu", "केतु")


def to_utc(dob, tob, tz_name: str) -> datetime:
    return datetime.combine(dob, tob, tzinfo=ZoneInfo(tz_name)).astimezone(timezone.utc)


def julian_day(utc: datetime) -> float:
    hour = utc.hour + utc.minute / 60 + utc.second / 3600
    return swe.julday(utc.year, utc.month, utc.day, hour, swe.GREG_CAL)


def sidereal_longitude(jd: float, planet_id: int) -> tuple[float, float]:
    pos, _ = swe.calc_ut(jd, planet_id, FLAGS)
    return pos[0] % 360, pos[3]


def compute_chart(dob, tob, tz_name: str, latitude: float, longitude: float) -> dict:
    birth_utc = to_utc(dob, tob, tz_name)
    jd = julian_day(birth_utc)
    ayanamsa = swe.get_ayanamsa_ut(jd)

    _, ascmc = swe.houses_ex(jd, latitude, longitude, b"W", swe.FLG_SIDEREAL)
    asc_lon = ascmc[0] % 360
    lagna = sign_of(asc_lon)

    planets = {}
    for key, pid, en, hi in PLANETS:
        lon, speed = sidereal_longitude(jd, pid)
        planets[key] = {"name_en": en, "name_hi": hi, "longitude": round(lon, 6),
                        "retrograde": speed < 0 if key != "rahu" else True}
    rahu = planets["rahu"]["longitude"]
    planets["ketu"] = {"name_en": KETU[1], "name_hi": KETU[2],
                       "longitude": round((rahu + 180) % 360, 6), "retrograde": True}

    for p in planets.values():
        lon = p["longitude"]
        s = sign_of(lon)
        p.update({
            "sign": s + 1, "sign_en": SIGNS_EN[s], "sign_hi": SIGNS_HI[s],
            "degree_in_sign": round(lon % 30, 4),
            "house": (s - lagna) % 12 + 1,  # whole-sign houses from Lagna
            "nakshatra": nakshatra(lon),
            "d9_sign": navamsa_sign(lon) + 1,
        })

    dashas = vimshottari(planets["moon"]["longitude"], birth_utc, cycles=2)
    moon_sign = planets["moon"]["sign"] - 1
    return {
        "meta": {"ayanamsa": "LAHIRI", "ayanamsa_deg": round(ayanamsa, 6),
                 "birth_utc": birth_utc.isoformat(), "julian_day": jd,
                 "house_system": "whole_sign"},
        "ascendant": {"longitude": round(asc_lon, 6), "sign": lagna + 1,
                      "sign_en": SIGNS_EN[lagna], "sign_hi": SIGNS_HI[lagna],
                      "degree_in_sign": round(asc_lon % 30, 4), "nakshatra": nakshatra(asc_lon),
                      "d9_sign": navamsa_sign(asc_lon) + 1},
        "rashi": {"sign": moon_sign + 1, "sign_en": SIGNS_EN[moon_sign], "sign_hi": SIGNS_HI[moon_sign]},
        "planets": planets,
        "vimshottari": dashas,
        "running_mahadasha": running_dasha(dashas, datetime.now(timezone.utc)),
    }
