"""Synthetic chart dicts with the same shape compute_chart() returns (no swisseph)."""
from datetime import datetime, timezone

from app.services.astro_constants import (
    PLANET_NAMES, SIGNS_EN, SIGNS_HI, nakshatra, navamsa_sign, sign_of,
)
from app.services.dasha import running_dasha, vimshottari

DEFAULT_LONS = {  # spread out so nothing forms by accident unless a test says so
    "sun": 15.0, "moon": 75.0, "mars": 135.0, "mercury": 45.0, "jupiter": 255.0,
    "venus": 345.0, "saturn": 195.0, "rahu": 100.0,
}


def make_chart(asc_lon: float, birth_utc: datetime | None = None, **lons: float) -> dict:
    """make_chart(asc_lon, sun=.., moon=..). Signs may also be given as `<planet>_sign=N`
    (planet placed at 15° of that sign)."""
    birth_utc = birth_utc or datetime(1990, 1, 1, tzinfo=timezone.utc)
    pos = dict(DEFAULT_LONS)
    for k, v in lons.items():
        if k.endswith("_sign"):
            pos[k[:-5]] = (v - 1) * 30 + 15.0
        else:
            pos[k] = v
    pos["ketu"] = (pos["rahu"] + 180) % 360
    lagna = sign_of(asc_lon)
    planets = {}
    for key, lon in pos.items():
        s = sign_of(lon)
        en, hi = PLANET_NAMES[key]
        planets[key] = {"name_en": en, "name_hi": hi, "longitude": lon,
                        "retrograde": key in ("rahu", "ketu"), "sign": s + 1,
                        "sign_en": SIGNS_EN[s], "sign_hi": SIGNS_HI[s],
                        "degree_in_sign": round(lon % 30, 4), "house": (s - lagna) % 12 + 1,
                        "nakshatra": nakshatra(lon), "d9_sign": navamsa_sign(lon) + 1}
    dashas = vimshottari(pos["moon"], birth_utc, cycles=2)
    moon = planets["moon"]["sign"] - 1
    return {
        "meta": {"ayanamsa": "LAHIRI", "ayanamsa_deg": 23.7, "birth_utc": birth_utc.isoformat(),
                 "julian_day": 0.0, "house_system": "whole_sign"},
        "ascendant": {"longitude": asc_lon, "sign": lagna + 1, "sign_en": SIGNS_EN[lagna],
                      "sign_hi": SIGNS_HI[lagna], "degree_in_sign": asc_lon % 30,
                      "nakshatra": nakshatra(asc_lon), "d9_sign": navamsa_sign(asc_lon) + 1},
        "rashi": {"sign": moon + 1, "sign_en": SIGNS_EN[moon], "sign_hi": SIGNS_HI[moon]},
        "planets": planets,
        "vimshottari": dashas,
        "running_mahadasha": running_dasha(dashas, birth_utc),
    }


def sign_lon(sign: int, deg: float = 15.0) -> float:
    return (sign - 1) * 30 + deg
