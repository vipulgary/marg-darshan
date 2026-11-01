"""Panchang (AMX-049): pure angle functions + a swisseph-backed panchang_for().

Convention: the day's tithi/nakshatra/yoga/karana are those running at local
sunrise (udaya), as printed by most Indian panchangs.
"""
from datetime import date, datetime, time
from zoneinfo import ZoneInfo

from app.services.astro_constants import NAK_SPAN, datetime_to_jd, jd_to_datetime, nakshatra

TITHI_EN = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami",
            "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi"]
TITHI_HI = ["प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पंचमी", "षष्ठी", "सप्तमी",
            "अष्टमी", "नवमी", "दशमी", "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी"]

YOGAS_EN = ["Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma",
            "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra",
            "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha",
            "Shukla", "Brahma", "Indra", "Vaidhriti"]
YOGAS_HI = ["विष्कुम्भ", "प्रीति", "आयुष्मान", "सौभाग्य", "शोभन", "अतिगण्ड", "सुकर्मा",
            "धृति", "शूल", "गण्ड", "वृद्धि", "ध्रुव", "व्याघात", "हर्षण", "वज्र",
            "सिद्धि", "व्यतीपात", "वरीयान", "परिघ", "शिव", "सिद्ध", "साध्य", "शुभ",
            "शुक्ल", "ब्रह्म", "इन्द्र", "वैधृति"]

MOVABLE_KARANAS = [("Bava", "बव"), ("Balava", "बालव"), ("Kaulava", "कौलव"), ("Taitila", "तैतिल"),
                   ("Gara", "गर"), ("Vanija", "वणिज"), ("Vishti", "विष्टि (भद्रा)")]
FIXED_KARANAS = {0: ("Kimstughna", "किंस्तुघ्न"), 57: ("Shakuni", "शकुनि"),
                 58: ("Chatushpada", "चतुष्पद"), 59: ("Naga", "नाग")}

VARAS = [  # Python weekday() order: Monday first
    ("Somavara", "सोमवार", "moon"), ("Mangalavara", "मंगलवार", "mars"),
    ("Budhavara", "बुधवार", "mercury"), ("Guruvara", "गुरुवार", "jupiter"),
    ("Shukravara", "शुक्रवार", "venus"), ("Shanivara", "शनिवार", "saturn"),
    ("Ravivara", "रविवार", "sun"),
]


def tithi(sun_lon: float, moon_lon: float) -> dict:
    diff = (moon_lon - sun_lon) % 360
    idx = int(diff // 12)  # 0..29
    number = idx + 1
    shukla = number <= 15
    n = number if shukla else number - 15
    if number == 15:
        en, hi = "Purnima", "पूर्णिमा"
    elif number == 30:
        en, hi = "Amavasya", "अमावस्या"
    else:
        en, hi = TITHI_EN[n - 1], TITHI_HI[n - 1]
    return {"index": number, "number_in_paksha": n,
            "paksha": "shukla" if shukla else "krishna",
            "paksha_en": "Shukla Paksha" if shukla else "Krishna Paksha",
            "paksha_hi": "शुक्ल पक्ष" if shukla else "कृष्ण पक्ष",
            "name_en": en, "name_hi": hi,
            "elapsed_pct": round((diff % 12) / 12 * 100, 2)}


def yoga(sun_lon: float, moon_lon: float) -> dict:
    total = (sun_lon + moon_lon) % 360
    idx = int(total // NAK_SPAN) % 27
    return {"index": idx + 1, "name_en": YOGAS_EN[idx], "name_hi": YOGAS_HI[idx]}


def karana(sun_lon: float, moon_lon: float) -> dict:
    half = int(((moon_lon - sun_lon) % 360) // 6)  # 0..59
    if half in FIXED_KARANAS:
        en, hi = FIXED_KARANAS[half]
    else:
        en, hi = MOVABLE_KARANAS[(half - 1) % 7]
    return {"index": half + 1, "name_en": en, "name_hi": hi}


def vara(day: date) -> dict:
    en, hi, lord = VARAS[day.weekday()]
    return {"name_en": en, "name_hi": hi, "lord": lord}


def panchang_from_longitudes(day: date, sun_lon: float, moon_lon: float) -> dict:
    return {"vara": vara(day), "tithi": tithi(sun_lon, moon_lon), "nakshatra": nakshatra(moon_lon),
            "yoga": yoga(sun_lon, moon_lon), "karana": karana(sun_lon, moon_lon)}


def _rise_trans(swe, jd: float, rsmi: int, lat: float, lng: float) -> float | None:
    geopos = (lng, lat, 0.0)
    try:
        res, tret = swe.rise_trans(jd, swe.SUN, rsmi, geopos)  # pyswisseph >= 2.10 signature
    except TypeError:
        res, tret = swe.rise_trans(jd, swe.SUN, "", swe.FLG_SWIEPH, rsmi, geopos, 0.0, 0.0)
    return tret[0] if res == 0 else None


def panchang_for(day: date, lat: float, lng: float, tz_name: str) -> dict:
    """Panchang at local sunrise. Needs swisseph (imported lazily via chart.py)."""
    from app.services import chart as chart_mod

    swe = chart_mod.swe
    tz = ZoneInfo(tz_name)
    midnight_jd = datetime_to_jd(datetime.combine(day, time(0, 0), tzinfo=tz))
    rise_jd = _rise_trans(swe, midnight_jd, swe.CALC_RISE, lat, lng)
    set_jd = _rise_trans(swe, midnight_jd, swe.CALC_SET, lat, lng)
    # Polar day/night: fall back to local 06:00 for the angle snapshot.
    ref_jd = rise_jd if rise_jd is not None else datetime_to_jd(datetime.combine(day, time(6, 0), tzinfo=tz))
    sun_lon, _ = chart_mod.sidereal_longitude(ref_jd, swe.SUN)
    moon_lon, _ = chart_mod.sidereal_longitude(ref_jd, swe.MOON)

    def local(jd):
        return jd_to_datetime(jd).astimezone(tz).isoformat(timespec="seconds") if jd is not None else None

    return {"date": day.isoformat(), "tz_name": tz_name, "latitude": lat, "longitude": lng,
            "sunrise": local(rise_jd), "sunset": local(set_jd),
            "ayanamsa": "LAHIRI", "ayanamsa_deg": round(swe.get_ayanamsa_ut(ref_jd), 6),
            "sun_longitude": round(sun_lon, 6), "moon_longitude": round(moon_lon, 6),
            **panchang_from_longitudes(day, sun_lon, moon_lon)}


