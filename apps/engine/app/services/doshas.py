"""Dosha evaluation on a computed chart dict (AMX-044). Pure except saturn_sign_on().

Input is the dict compute_chart() returns; only planets[*].sign / .longitude and
ascendant.sign are read. Output matches the web contract `Dosha`
(apps/web/src/lib/contracts.ts): key, name_hi, name_en, present, cancelled,
severity (only when present), details_hi, details_en. Every dosha is always
returned, with present true/false.

Conjunction means "same sidereal sign" (whole-sign), the usual Parashari reading.
"""
from datetime import date, datetime, timezone

from app.services.astro_constants import (
    DEBILITATION, SEVEN_PLANETS, aspects, house_from, planet_name, sign_names,
)

MANGLIK_HOUSES = (1, 2, 4, 7, 8, 12)
# House-specific Manglik exceptions: house of Mars -> signs that neutralise it there.
MANGLIK_HOUSE_SIGN_EXCEPTIONS = {2: (3, 6), 4: (1, 8), 7: (4, 10), 8: (9, 12), 12: (2, 7)}

KAAL_SARP_TYPES = [  # by Rahu's house from Lagna
    ("Anant", "अनंत"), ("Kulik", "कुलिक"), ("Vasuki", "वासुकि"), ("Shankhpal", "शंखपाल"),
    ("Padma", "पद्म"), ("Mahapadma", "महापद्म"), ("Takshak", "तक्षक"), ("Karkotak", "कर्कोटक"),
    ("Shankhachur", "शंखचूड़"), ("Ghatak", "घातक"), ("Vishdhar", "विषधर"), ("Sheshnag", "शेषनाग"),
]

NAMES = {
    "manglik": ("Manglik Dosha", "मांगलिक दोष"),
    "kaal_sarp": ("Kaal Sarp Dosha", "काल सर्प दोष"),
    "sade_sati": ("Sade Sati", "शनि की साढ़े साती"),
    "pitru": ("Pitru Dosha", "पितृ दोष"),
    "guru_chandal": ("Guru Chandal Dosha", "गुरु चांडाल दोष"),
    "shrapit": ("Shrapit Dosha", "श्रापित दोष"),
    "grahan": ("Grahan Dosha", "ग्रहण दोष"),
}

TIGHT_ORB = 10.0

_HI_ORDINAL = {1: "पहले", 2: "दूसरे", 3: "तीसरे", 4: "चौथे", 5: "पाँचवें", 6: "छठे", 7: "सातवें",
               8: "आठवें", 9: "नौवें", 10: "दसवें", 11: "ग्यारहवें", 12: "बारहवें"}


def ordinal_en(n: int) -> str:
    suffix = "th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def ordinal_hi(n: int) -> str:
    return _HI_ORDINAL.get(n, f"{n}वें")


def _sign(chart: dict, planet: str) -> int:
    return chart["planets"][planet]["sign"]


def _lon(chart: dict, planet: str) -> float:
    return chart["planets"][planet]["longitude"]


def _orb(a: float, b: float) -> float:
    d = abs(a - b) % 360
    return min(d, 360 - d)


def _dosha(key: str, present: bool, details_en: str, details_hi: str, *,
           cancelled: bool = False, severity: str | None = None) -> dict:
    en, hi = NAMES[key]
    out = {"key": key, "name_hi": hi, "name_en": en, "present": present,
           "cancelled": bool(present and cancelled)}
    if present and severity:
        out["severity"] = severity
    out["details_hi"] = details_hi
    out["details_en"] = details_en
    return out


def manglik(chart: dict) -> dict:
    """Manglik (Kuja) dosha.

    Present when Mars sits in house 1, 2, 4, 7, 8 or 12 counted from any of the
    three reference points: Lagna, Moon, Venus. Severity = number of reference
    points that trigger it (1 low, 2 medium, 3 high).

    Cancellation rules (any one sets cancelled=True; the dosha stays "present"
    so the Jyotish sees both facts):
      1. Mars in its own sign (Aries, Scorpio) or exalted (Capricorn).
      2. Mars in Leo or Aquarius.
      3. Jupiter conjunct Mars (same sign) or aspecting Mars (5th/7th/9th drishti).
      4. House-specific: Mars in the 2nd in Gemini/Virgo, 4th in Aries/Scorpio,
         7th in Cancer/Capricorn, 8th in Sagittarius/Pisces, 12th in Taurus/Libra —
         checked for every reference point that triggers the dosha.
    """
    mars = _sign(chart, "mars")
    refs = [("Lagna", "लग्न", chart["ascendant"]["sign"]),
            ("Moon", "चंद्र", _sign(chart, "moon")),
            ("Venus", "शुक्र", _sign(chart, "venus"))]
    triggered = [(en, hi, house_from(ref, mars)) for en, hi, ref in refs
                 if house_from(ref, mars) in MANGLIK_HOUSES]
    if not triggered:
        return _dosha("manglik", False,
                      "Mars is not in the 1st, 2nd, 4th, 7th, 8th or 12th house from Lagna, Moon or Venus.",
                      "मंगल लग्न, चंद्र और शुक्र — तीनों में से किसी से भी 1, 2, 4, 7, 8 या 12वें भाव में नहीं है।")
    # Mainstream practice (and what other calculators report): Manglik is judged from the
    # Lagna. Placement only from Moon/Venus is a minor influence, not a Manglik chart.
    if triggered[0][0] != "Lagna":
        where_en = ", ".join(f"{ordinal_en(h)} from {en}" for en, _, h in triggered)
        where_hi = ", ".join(f"{hi} से {ordinal_hi(h)}" for _, hi, h in triggered)
        return _dosha("manglik", False,
                      f"Not Manglik: Mars is not in a Manglik house from the Lagna. It is only in the {where_en}, "
                      "which is a minor influence and does not make the chart Manglik.",
                      f"मांगलिक नहीं: लग्न से मंगल मांगलिक भाव में नहीं है। केवल {where_hi} भाव में है, "
                      "जिसका असर बहुत हल्का है — इससे कुंडली मांगलिक नहीं मानी जाती।")

    mars_en, mars_hi = sign_names(mars)
    reasons: list[tuple[str, str]] = []
    if mars in (1, 8):
        reasons.append((f"Mars is in its own sign {mars_en}", f"मंगल अपनी स्वराशि {mars_hi} में है"))
    if mars == 10:
        reasons.append(("Mars is exalted in Capricorn", "मंगल मकर राशि में उच्च का है"))
    if mars in (5, 11):
        reasons.append((f"Mars is in {mars_en}", f"मंगल {mars_hi} राशि में है"))
    jup = _sign(chart, "jupiter")
    if jup == mars:
        reasons.append(("Jupiter is conjunct Mars", "गुरु मंगल के साथ युति में है"))
    elif aspects("jupiter", jup, mars):
        reasons.append(("Jupiter aspects Mars", "गुरु की दृष्टि मंगल पर है"))
    for en, hi, house in triggered:
        if mars in MANGLIK_HOUSE_SIGN_EXCEPTIONS.get(house, ()):
            reasons.append((f"Mars in the {ordinal_en(house)} from {en} falls in {mars_en}",
                            f"{hi} से {ordinal_hi(house)} भाव का मंगल {mars_hi} राशि में है"))

    severity = {1: "low", 2: "medium", 3: "high"}[len(triggered)]
    where_en = ", ".join(f"{ordinal_en(h)} house from {en}" for en, _, h in triggered)
    where_hi = ", ".join(f"{hi} से {ordinal_hi(h)} भाव" for _, hi, h in triggered)
    details_en = f"Mars is in the {where_en} ({len(triggered)} of 3 reference points)."
    details_hi = f"मंगल {where_hi} में है (3 में से {len(triggered)} संदर्भ बिंदु)।"
    if reasons:
        details_en += " Cancelled: " + "; ".join(r[0] for r in reasons) + "."
        details_hi += " दोष भंग: " + "; ".join(r[1] for r in reasons) + "।"
    return _dosha("manglik", True, details_en, details_hi, cancelled=bool(reasons), severity=severity)


def kaal_sarp(chart: dict) -> dict:
    """Kaal Sarp: all seven planets (Sun..Saturn) on one side of the Rahu–Ketu axis by
    longitude. Partial when exactly one planet is on the other side. The type is
    named by Rahu's whole-sign house from Lagna (1 Anant .. 12 Sheshnag)."""
    rahu = _lon(chart, "rahu")
    rahu_to_ketu = [p for p in SEVEN_PLANETS if (_lon(chart, p) - rahu) % 360 < 180]
    other = [p for p in SEVEN_PLANETS if p not in rahu_to_ketu]
    outside = min(rahu_to_ketu, other, key=len)
    rahu_house = house_from(chart["ascendant"]["sign"], _sign(chart, "rahu"))
    type_en, type_hi = KAAL_SARP_TYPES[rahu_house - 1]

    if len(outside) == 0:
        return _dosha("kaal_sarp", True,
                      f"All seven planets lie on one side of the Rahu–Ketu axis. Type: {type_en} "
                      f"(Rahu in the {ordinal_en(rahu_house)} house).",
                      f"सातों ग्रह राहु–केतु अक्ष के एक ही ओर हैं। प्रकार: {type_hi} "
                      f"(राहु {ordinal_hi(rahu_house)} भाव में)।",
                      severity="high")
    if len(outside) == 1:
        p = outside[0]
        return _dosha("kaal_sarp", True,
                      f"Partial Kaal Sarp: six planets lie on one side of the Rahu–Ketu axis; "
                      f"{planet_name(p, 'en')} is outside. Type: {type_en} "
                      f"(Rahu in the {ordinal_en(rahu_house)} house).",
                      f"आंशिक काल सर्प: छह ग्रह राहु–केतु अक्ष के एक ओर हैं, केवल "
                      f"{planet_name(p, 'hi')} बाहर है। प्रकार: {type_hi} (राहु {ordinal_hi(rahu_house)} भाव में)।",
                      severity="low")
    return _dosha("kaal_sarp", False,
                  "Planets are spread on both sides of the Rahu–Ketu axis.",
                  "ग्रह राहु–केतु अक्ष के दोनों ओर फैले हुए हैं।")


def sade_sati(moon_sign: int, saturn_sign: int) -> str | None:
    """Phase of Sade Sati for transit Saturn relative to the natal Moon sign:
    12th from Moon = rising, over the Moon = peak, 2nd from Moon = setting."""
    return {12: "rising", 1: "peak", 2: "setting"}.get(house_from(moon_sign, saturn_sign))


_PHASE_TEXT = {
    "rising": ("rising phase (Saturn in the 12th from the Moon)", "आरंभिक चरण (शनि चंद्र से बारहवें)"),
    "peak": ("peak phase (Saturn over the natal Moon sign)", "मध्य/चरम चरण (शनि जन्म राशि पर)"),
    "setting": ("setting phase (Saturn in the 2nd from the Moon)", "अंतिम चरण (शनि चंद्र से दूसरे)"),
}


def saturn_sign_on(on_date: date | None = None) -> int:
    """Sidereal (Lahiri) sign of transit Saturn at 12:00 UTC on the date. Needs swisseph."""
    from app.services import chart as chart_mod  # lazy: swisseph only when actually needed

    day = on_date or datetime.now(timezone.utc).date()
    jd = chart_mod.julian_day(datetime(day.year, day.month, day.day, 12, tzinfo=timezone.utc))
    lon, _ = chart_mod.sidereal_longitude(jd, chart_mod.swe.SATURN)
    return int(lon // 30) + 1


def sade_sati_dosha(chart: dict, transit_saturn_sign: int | None, on_date: date) -> dict:
    moon = _sign(chart, "moon")
    if transit_saturn_sign is None:
        return _dosha("sade_sati", False,
                      "Saturn's current transit could not be calculated, so Sade Sati was not checked.",
                      "शनि का वर्तमान गोचर निकाला नहीं जा सका, इसलिए साढ़े साती की जाँच नहीं हुई।")
    sat_en, sat_hi = sign_names(transit_saturn_sign)
    phase = sade_sati(moon, transit_saturn_sign)
    when = on_date.isoformat()
    if phase:
        p_en, p_hi = _PHASE_TEXT[phase]
        return _dosha("sade_sati", True,
                      f"On {when} transit Saturn is in {sat_en}: Sade Sati, {p_en}.",
                      f"{when} को गोचर शनि {sat_hi} में है: साढ़े साती का {p_hi}।",
                      severity="high" if phase == "peak" else "medium")
    house = house_from(moon, transit_saturn_sign)
    note_en = note_hi = ""
    if house in (4, 8):
        note_en = f" Saturn is in the {ordinal_en(house)} from the Moon (Dhaiya / small Panoti)."
        note_hi = f" शनि चंद्र से {ordinal_hi(house)} भाव में है (ढैय्या)।"
    return _dosha("sade_sati", False,
                  f"On {when} transit Saturn is in {sat_en}, not in the 12th, 1st or 2nd from the Moon.{note_en}",
                  f"{when} को गोचर शनि {sat_hi} में है — चंद्र से 12वें, पहले या दूसरे भाव में नहीं।{note_hi}")


def pitru(chart: dict) -> dict:
    """Pitru dosha — simplified rule:
      a) Sun conjunct Rahu or Saturn (same sign), or
      b) Rahu or Saturn in the 9th house from Lagna while the Sun is afflicted:
         Sun conjunct Saturn/Rahu/Ketu/Mars, aspected by Saturn or Mars, or debilitated (Libra).
    Severity: two or more factors high; a conjunction alone medium; only (b) low."""
    sun = _sign(chart, "sun")
    lagna = chart["ascendant"]["sign"]
    conj = [p for p in ("rahu", "saturn") if _sign(chart, p) == sun]
    ninth = [p for p in ("rahu", "saturn") if house_from(lagna, _sign(chart, p)) == 9]
    afflicted = (any(_sign(chart, p) == sun for p in ("saturn", "rahu", "ketu", "mars"))
                 or any(aspects(p, _sign(chart, p), sun) for p in ("saturn", "mars"))
                 or DEBILITATION["sun"] == sun)
    reasons: list[tuple[str, str]] = [
        (f"Sun is conjunct {planet_name(p, 'en')}", f"सूर्य {planet_name(p, 'hi')} के साथ युति में है")
        for p in conj
    ]
    if ninth and afflicted:
        names_en = " and ".join(planet_name(p, "en") for p in ninth)
        names_hi = " और ".join(planet_name(p, "hi") for p in ninth)
        reasons.append((f"{names_en} in the 9th house with an afflicted Sun",
                        f"नवम भाव में {names_hi} और सूर्य पीड़ित"))
    if not reasons:
        return _dosha("pitru", False,
                      "The Sun is free of Rahu/Saturn conjunction and the 9th house is not afflicted by them.",
                      "सूर्य राहु/शनि की युति से मुक्त है और नवम भाव इनसे पीड़ित नहीं है।")
    severity = "high" if len(reasons) >= 2 else ("medium" if conj else "low")
    return _dosha("pitru", True, "; ".join(r[0] for r in reasons) + ".",
                  "; ".join(r[1] for r in reasons) + "।", severity=severity)


def _node_conjunction(chart: dict, key: str, planets: tuple[str, ...], nodes: tuple[str, ...],
                      tight: str, wide: str) -> dict:
    pairs = [(p, n) for p in planets for n in nodes if _sign(chart, p) == _sign(chart, n)]
    if not pairs:
        names_en = " / ".join(planet_name(p, "en") for p in planets)
        names_hi = " / ".join(planet_name(p, "hi") for p in planets)
        nodes_en = " or ".join(planet_name(n, "en") for n in nodes)
        nodes_hi = " या ".join(planet_name(n, "hi") for n in nodes)
        return _dosha(key, False, f"No conjunction of {names_en} with {nodes_en}.",
                      f"{names_hi} की {nodes_hi} से युति नहीं है।")
    orb = min(_orb(_lon(chart, p), _lon(chart, n)) for p, n in pairs)
    en = "; ".join(f"{planet_name(p, 'en')} with {planet_name(n, 'en')} in {chart['planets'][p]['sign_en']}"
                   for p, n in pairs)
    hi = "; ".join(f"{planet_name(p, 'hi')} {planet_name(n, 'hi')} के साथ {chart['planets'][p]['sign_hi']} में"
                   for p, n in pairs)
    return _dosha(key, True, f"{en} (closest {orb:.1f}°).", f"{hi} (निकटतम {orb:.1f}°)।",
                  severity=tight if orb <= TIGHT_ORB else wide)


def evaluate(chart: dict, on_date: date | None = None, transit_saturn_sign: int | None = None) -> list[dict]:
    """All doshas for a chart. Sade Sati uses `transit_saturn_sign` when given, otherwise
    Saturn's transit on `on_date` (default today) via swisseph; if that is unavailable it
    is reported as not checked."""
    day = on_date or datetime.now(timezone.utc).date()
    if transit_saturn_sign is not None and not 1 <= transit_saturn_sign <= 12:
        raise ValueError("transit_saturn_sign must be 1..12")
    if transit_saturn_sign is None:
        try:
            transit_saturn_sign = saturn_sign_on(day)
        except Exception:  # swisseph missing or ephemeris failure — keep the other doshas
            transit_saturn_sign = None
    return [
        manglik(chart),
        kaal_sarp(chart),
        sade_sati_dosha(chart, transit_saturn_sign, day),
        pitru(chart),
        _node_conjunction(chart, "guru_chandal", ("jupiter",), ("rahu", "ketu"), "medium", "low"),
        _node_conjunction(chart, "shrapit", ("saturn",), ("rahu",), "medium", "low"),
        _node_conjunction(chart, "grahan", ("sun", "moon"), ("rahu", "ketu"), "high", "medium"),
    ]
