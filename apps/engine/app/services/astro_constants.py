"""Pure Jyotish reference data and helpers (no swisseph import).

Sign numbers are 1-based (1 = Aries .. 12 = Pisces) to match the chart JSON,
except sign_of()/navamsa_sign(), which keep chart.py's historic 0-based return.

Documented choices for Rahu/Ketu (sources disagree):
- They own no sign, so they are never a "house lord" in lordship-based rules.
- Exaltation Rahu = Taurus, Ketu = Scorpio (BPHS reading); debilitation opposite.
- Graha drishti: 5th, 7th and 9th (the Jupiter-like view common in North India).
- Natural relationships: Rahu behaves like Saturn, Ketu like Mars.
"""
from datetime import datetime, timedelta, timezone

SIGNS_EN = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
            "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
SIGNS_HI = ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या",
            "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"]

PLANET_KEYS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"]
SEVEN_PLANETS = PLANET_KEYS[:7]
PLANET_NAMES = {  # key -> (en, hi)
    "sun": ("Sun", "सूर्य"), "moon": ("Moon", "चंद्र"), "mars": ("Mars", "मंगल"),
    "mercury": ("Mercury", "बुध"), "jupiter": ("Jupiter", "गुरु"), "venus": ("Venus", "शुक्र"),
    "saturn": ("Saturn", "शनि"), "rahu": ("Rahu", "राहु"), "ketu": ("Ketu", "केतु"),
}

NAKSHATRAS_EN = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu",
                 "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta",
                 "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
                 "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
                 "Uttara Bhadrapada", "Revati"]
NAKSHATRAS_HI = ["अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा", "आर्द्रा", "पुनर्वसु",
                 "पुष्य", "आश्लेषा", "मघा", "पूर्व फाल्गुनी", "उत्तर फाल्गुनी", "हस्त",
                 "चित्रा", "स्वाति", "विशाखा", "अनुराधा", "ज्येष्ठा", "मूल", "पूर्वाषाढ़ा",
                 "उत्तराषाढ़ा", "श्रवण", "धनिष्ठा", "शतभिषा", "पूर्व भाद्रपद",
                 "उत्तर भाद्रपद", "रेवती"]
NAK_SPAN = 360 / 27

# Vimshottari order starting from Ashwini's lord, with mahadasha years.
DASHA_ORDER = [("ketu", 7), ("venus", 20), ("sun", 6), ("moon", 10), ("mars", 7),
               ("rahu", 18), ("jupiter", 16), ("saturn", 19), ("mercury", 17)]
DASHA_YEARS = dict(DASHA_ORDER)
DASHA_TOTAL_YEARS = 120
YEAR_DAYS = 365.25

SIGN_LORDS = {1: "mars", 2: "venus", 3: "mercury", 4: "moon", 5: "sun", 6: "mercury",
              7: "venus", 8: "mars", 9: "jupiter", 10: "saturn", 11: "saturn", 12: "jupiter"}
OWN_SIGNS = {"sun": (5,), "moon": (4,), "mars": (1, 8), "mercury": (3, 6),
             "jupiter": (9, 12), "venus": (2, 7), "saturn": (10, 11), "rahu": (), "ketu": ()}
EXALTATION = {"sun": 1, "moon": 2, "mars": 10, "mercury": 6, "jupiter": 4, "venus": 12,
              "saturn": 7, "rahu": 2, "ketu": 8}
EXALTATION_DEGREE = {"sun": 10, "moon": 3, "mars": 28, "mercury": 15, "jupiter": 5,
                     "venus": 27, "saturn": 20}
DEBILITATION = {p: (s + 5) % 12 + 1 for p, s in EXALTATION.items()}
# Mooltrikona sign with its degree range inside the sign.
MOOLTRIKONA = {"sun": (5, 0, 20), "moon": (2, 4, 30), "mars": (1, 0, 12), "mercury": (6, 16, 20),
               "jupiter": (9, 0, 10), "venus": (7, 0, 15), "saturn": (11, 0, 20)}

# Naisargika maitri (BPHS). Planets not listed as friend or enemy are neutral.
NATURAL_FRIENDS = {
    "sun": {"moon", "mars", "jupiter"},
    "moon": {"sun", "mercury"},
    "mars": {"sun", "moon", "jupiter"},
    "mercury": {"sun", "venus"},
    "jupiter": {"sun", "moon", "mars"},
    "venus": {"mercury", "saturn"},
    "saturn": {"mercury", "venus"},
    "rahu": {"mercury", "venus", "saturn"},
    "ketu": {"sun", "moon", "jupiter"},
}
NATURAL_ENEMIES = {
    "sun": {"venus", "saturn"},
    "moon": set(),
    "mars": {"mercury"},
    "mercury": {"moon"},
    "jupiter": {"mercury", "venus"},
    "venus": {"sun", "moon"},
    "saturn": {"sun", "moon", "mars"},
    "rahu": {"sun", "moon", "mars"},
    "ketu": {"mercury"},
}

# Houses aspected counted from the planet's own house (1 = itself).
SPECIAL_ASPECTS = {"mars": (4, 7, 8), "jupiter": (5, 7, 9), "saturn": (3, 7, 10),
                   "rahu": (5, 7, 9), "ketu": (5, 7, 9)}
DEFAULT_ASPECTS = (7,)

KENDRAS = (1, 4, 7, 10)
TRIKONAS = (1, 5, 9)
DUSTHANAS = (6, 8, 12)
NATURAL_BENEFICS = ("jupiter", "venus", "mercury", "moon")
NATURAL_MALEFICS = ("sun", "mars", "saturn", "rahu", "ketu")

_J2000 = datetime(2000, 1, 1, 12, tzinfo=timezone.utc)
_J2000_JD = 2451545.0


def sign_of(lon: float) -> int:
    return int(lon // 30)  # 0 = Aries


def navamsa_sign(lon: float) -> int:
    return int(lon * 9 // 30) % 12


def nakshatra(lon: float) -> dict:
    idx = int(lon // NAK_SPAN) % 27
    pada = int((lon % NAK_SPAN) // (NAK_SPAN / 4)) + 1
    return {"index": idx + 1, "name_en": NAKSHATRAS_EN[idx], "name_hi": NAKSHATRAS_HI[idx],
            "pada": pada, "lord": DASHA_ORDER[idx % 9][0]}


def sign_names(sign: int) -> tuple[str, str]:
    return SIGNS_EN[sign - 1], SIGNS_HI[sign - 1]


def planet_name(key: str, lang: str) -> str:
    en, hi = PLANET_NAMES[key]
    return hi if lang == "hi" else en


def house_from(ref_sign: int, sign: int) -> int:
    """Whole-sign house of `sign` counted from `ref_sign` (both 1-based)."""
    return (sign - ref_sign) % 12 + 1


def sign_at_house(ref_sign: int, house: int) -> int:
    return (ref_sign + house - 2) % 12 + 1


def house_lord(lagna_sign: int, house: int) -> str:
    return SIGN_LORDS[sign_at_house(lagna_sign, house)]


def houses_ruled(planet: str, lagna_sign: int) -> list[int]:
    return sorted(house_from(lagna_sign, s) for s in OWN_SIGNS.get(planet, ()))


def aspected_houses(planet: str) -> tuple[int, ...]:
    return SPECIAL_ASPECTS.get(planet, DEFAULT_ASPECTS)


def aspects(planet: str, from_sign: int, to_sign: int) -> bool:
    """Graha drishti by whole sign: does `planet` in `from_sign` aspect `to_sign`?"""
    return house_from(from_sign, to_sign) in aspected_houses(planet)


def is_exalted(planet: str, sign: int) -> bool:
    return EXALTATION.get(planet) == sign


def is_debilitated(planet: str, sign: int) -> bool:
    return DEBILITATION.get(planet) == sign


def is_own_sign(planet: str, sign: int) -> bool:
    return sign in OWN_SIGNS.get(planet, ())


def relationship(planet: str, other: str) -> str:
    if other in NATURAL_FRIENDS.get(planet, set()):
        return "friend"
    if other in NATURAL_ENEMIES.get(planet, set()):
        return "enemy"
    return "neutral"


def dignity(planet: str, sign: int, degree: float | None = None) -> str:
    """exalted | debilitated | mooltrikona | own | friend | neutral | enemy."""
    if is_exalted(planet, sign):
        return "exalted"
    if is_debilitated(planet, sign):
        return "debilitated"
    mt = MOOLTRIKONA.get(planet)
    if mt and mt[0] == sign and (degree is None or mt[1] <= degree < mt[2]):
        return "mooltrikona"
    if is_own_sign(planet, sign):
        return "own"
    if planet in ("rahu", "ketu"):
        return "neutral"
    return relationship(planet, SIGN_LORDS[sign])


def datetime_to_jd(utc: datetime) -> float:
    """Julian Day (UT) from an aware datetime, without swisseph."""
    return _J2000_JD + (utc.astimezone(timezone.utc) - _J2000).total_seconds() / 86400


def jd_to_datetime(jd: float) -> datetime:
    return _J2000 + timedelta(days=jd - _J2000_JD)
