"""Yoga detection on a computed chart dict (AMX-044). Pure — no swisseph.

detect(chart) returns only the yogas that are present, each matching the web
contract `Yoga`: key, name_hi, name_en, description_hi, description_en, planets.
One entry per yoga key (combinations are listed inside the description), so the
key is unique in the list.

"Association" of two planets = conjunction (same sign), mutual graha drishti, or
sign exchange (parivartana). Houses are whole-sign from Lagna unless noted.
"""
from app.services.astro_constants import (
    EXALTATION, KENDRAS, OWN_SIGNS, SEVEN_PLANETS, SIGN_LORDS, TRIKONAS,
    aspects, house_from, house_lord, is_debilitated, is_exalted, is_own_sign, planet_name,
)
from app.services.doshas import ordinal_en, ordinal_hi

MAHAPURUSHA = [  # planet, key, en, hi, quality en, quality hi
    ("mars", "ruchaka", "Ruchaka Yoga", "रुचक योग", "courage, leadership and physical strength",
     "साहस, नेतृत्व और शारीरिक बल"),
    ("mercury", "bhadra", "Bhadra Yoga", "भद्र योग", "intellect, eloquence and business sense",
     "बुद्धि, वाक्पटुता और व्यापारिक समझ"),
    ("jupiter", "hamsa", "Hamsa Yoga", "हंस योग", "wisdom, righteousness and respect",
     "ज्ञान, धर्मनिष्ठा और सम्मान"),
    ("venus", "malavya", "Malavya Yoga", "मालव्य योग", "comfort, charm, arts and a happy married life",
     "सुख-सुविधा, आकर्षण, कला और सुखी दांपत्य"),
    ("saturn", "shasha", "Shasha Yoga", "शश योग", "discipline, authority and endurance",
     "अनुशासन, अधिकार और धैर्य"),
]
VIPREET_NAMES = {6: ("Harsha", "हर्ष"), 8: ("Sarala", "सरल"), 12: ("Vimala", "विमल")}


def _sign(chart: dict, planet: str) -> int:
    return chart["planets"][planet]["sign"]


def _yoga(key: str, en: str, hi: str, desc_en: str, desc_hi: str, planets) -> dict:
    ordered = [p for p in ("sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu")
               if p in set(planets)]
    return {"key": key, "name_hi": hi, "name_en": en, "description_hi": desc_hi,
            "description_en": desc_en, "planets": ordered}


def association(chart: dict, a: str, b: str) -> str | None:
    """conjunction | mutual_aspect | exchange | None."""
    sa, sb = _sign(chart, a), _sign(chart, b)
    if sa == sb:
        return "conjunction"
    if aspects(a, sa, sb) and aspects(b, sb, sa):
        return "mutual_aspect"
    if sa in OWN_SIGNS.get(b, ()) and sb in OWN_SIGNS.get(a, ()):
        return "exchange"
    return None


_ASSOC_TEXT = {"conjunction": ("conjunct", "युति में"), "mutual_aspect": ("in mutual aspect", "परस्पर दृष्टि में"),
               "exchange": ("in sign exchange", "राशि परिवर्तन में")}


def _lord_pairs(chart: dict, houses_a, houses_b) -> list[tuple[str, list[int], str, list[int], str]]:
    """Distinct-planet associations between lords of houses_a and lords of houses_b."""
    lagna = chart["ascendant"]["sign"]
    lords_a: dict[str, list[int]] = {}
    lords_b: dict[str, list[int]] = {}
    for h in houses_a:
        lords_a.setdefault(house_lord(lagna, h), []).append(h)
    for h in houses_b:
        lords_b.setdefault(house_lord(lagna, h), []).append(h)
    out, seen = [], set()
    for pa, ha in lords_a.items():
        for pb, hb in lords_b.items():
            pair = frozenset((pa, pb))
            if pa == pb or pair in seen:
                continue
            rel = association(chart, pa, pb)
            if rel:
                seen.add(pair)
                out.append((pa, ha, pb, hb, rel))
    return out


def _pairs_text(pairs) -> tuple[str, str]:
    en = "; ".join(
        f"{planet_name(a, 'en')} (lord of {'/'.join(ordinal_en(h) for h in ha)}) {_ASSOC_TEXT[rel][0]} with "
        f"{planet_name(b, 'en')} (lord of {'/'.join(ordinal_en(h) for h in hb)})"
        for a, ha, b, hb, rel in pairs)
    hi = "; ".join(
        f"{planet_name(a, 'hi')} ({'/'.join(str(h) for h in ha)} भाव के स्वामी) और "
        f"{planet_name(b, 'hi')} ({'/'.join(str(h) for h in hb)} भाव के स्वामी) {_ASSOC_TEXT[rel][1]}"
        for a, ha, b, hb, rel in pairs)
    return en, hi


def gajakesari(chart: dict) -> dict | None:
    h = house_from(_sign(chart, "moon"), _sign(chart, "jupiter"))
    if h not in KENDRAS:
        return None
    return _yoga("gajakesari", "Gajakesari Yoga", "गजकेसरी योग",
                 f"Jupiter is in the {ordinal_en(h)} house from the Moon. Gives wisdom, good reputation "
                 "and the strength to overcome obstacles.",
                 f"गुरु चंद्र से {ordinal_hi(h)} भाव में है। यह योग बुद्धि, मान-सम्मान और बाधाओं पर विजय देता है।",
                 ["jupiter", "moon"])


def budhaditya(chart: dict) -> dict | None:
    if _sign(chart, "sun") != _sign(chart, "mercury"):
        return None
    sign_en = chart["planets"]["sun"]["sign_en"]
    sign_hi = chart["planets"]["sun"]["sign_hi"]
    return _yoga("budhaditya", "Budhaditya Yoga", "बुधादित्य योग",
                 f"Sun and Mercury are together in {sign_en}. Sharp intellect, communication skill "
                 "and success in education and administration.",
                 f"सूर्य और बुध {sign_hi} में एक साथ हैं। तीव्र बुद्धि, संवाद कौशल तथा शिक्षा और प्रशासन में सफलता।",
                 ["sun", "mercury"])


def chandra_mangal(chart: dict) -> dict | None:
    """Moon and Mars conjunct, or in mutual 7th aspect (opposite signs)."""
    h = house_from(_sign(chart, "moon"), _sign(chart, "mars"))
    if h not in (1, 7):
        return None
    how_en, how_hi = ("conjunct", "एक साथ") if h == 1 else ("in mutual aspect", "परस्पर दृष्टि में")
    return _yoga("chandra_mangal", "Chandra-Mangal Yoga", "चंद्र-मंगल योग",
                 f"Moon and Mars are {how_en}. Drive to earn, enterprise and financial gains through effort.",
                 f"चंद्र और मंगल {how_hi} हैं। धन कमाने की प्रबल इच्छा, उद्यमशीलता और परिश्रम से आर्थिक लाभ।",
                 ["moon", "mars"])


def panch_mahapurusha(chart: dict) -> list[dict]:
    lagna = chart["ascendant"]["sign"]
    out = []
    for planet, key, en, hi, q_en, q_hi in MAHAPURUSHA:
        sign = _sign(chart, planet)
        h = house_from(lagna, sign)
        if h in KENDRAS and (is_own_sign(planet, sign) or is_exalted(planet, sign)):
            state_en = "exalted" if is_exalted(planet, sign) else "in its own sign"
            state_hi = "उच्च का" if is_exalted(planet, sign) else "स्वराशि में"
            sign_en = chart["planets"][planet]["sign_en"]
            sign_hi = chart["planets"][planet]["sign_hi"]
            out.append(_yoga(
                key, en, hi,
                f"{planet_name(planet, 'en')} is {state_en} ({sign_en}) in the {ordinal_en(h)} house, a kendra. "
                f"One of the Panch Mahapurusha yogas: {q_en}.",
                f"{planet_name(planet, 'hi')} {state_hi} ({sign_hi}) होकर केंद्र के {ordinal_hi(h)} भाव में है। "
                f"पंच महापुरुष योगों में से एक: {q_hi}।",
                [planet]))
    return out


def raj_yoga(chart: dict) -> dict | None:
    """Lord of a kendra (1/4/7/10) associated with the lord of a trikona (1/5/9),
    distinct planets. A yogakaraka (one planet ruling a kendra other than the 1st and
    a trikona) placed in a kendra or trikona also counts."""
    lagna = chart["ascendant"]["sign"]
    pairs = _lord_pairs(chart, KENDRAS, TRIKONAS)
    karakas = []
    for planet in SEVEN_PLANETS:
        ruled = {house_from(lagna, s) for s in OWN_SIGNS[planet]}
        if ruled & {4, 7, 10} and ruled & {5, 9}:
            placed = house_from(lagna, _sign(chart, planet))
            if placed in KENDRAS or placed in TRIKONAS:
                karakas.append((planet, placed))
    if not pairs and not karakas:
        return None
    parts_en, parts_hi, planets = [], [], []
    if pairs:
        en, hi = _pairs_text(pairs)
        parts_en.append(en)
        parts_hi.append(hi)
        planets += [p for a, _, b, _, _ in pairs for p in (a, b)]
    for planet, placed in karakas:
        parts_en.append(f"{planet_name(planet, 'en')} is the yogakaraka and sits in the {ordinal_en(placed)} house")
        parts_hi.append(f"{planet_name(planet, 'hi')} योगकारक है और {ordinal_hi(placed)} भाव में स्थित है")
        planets.append(planet)
    return _yoga("raj_yoga", "Raj Yoga", "राज योग",
                 "; ".join(parts_en) + ". Raj Yoga supports status, authority and success, especially in "
                 "the dashas of these planets.",
                 "; ".join(parts_hi) + "। राज योग पद, प्रतिष्ठा और सफलता देता है, विशेषकर इन ग्रहों की दशा में।",
                 planets)


def dhana_yoga(chart: dict) -> dict | None:
    pairs = _lord_pairs(chart, (2, 11), (5, 9))
    if not pairs:
        return None
    en, hi = _pairs_text(pairs)
    return _yoga("dhana_yoga", "Dhana Yoga", "धन योग",
                 f"{en}. Wealth-house lords join the lords of fortune — good for savings and income.",
                 f"{hi}। धन भावों के स्वामी भाग्य भावों के स्वामियों से जुड़े हैं — आय और संचय के लिए शुभ।",
                 [p for a, _, b, _, _ in pairs for p in (a, b)])


def vipreet_raj(chart: dict) -> dict | None:
    """Lords of 6/8/12 placed in 6/8/12 (Harsha, Sarala, Vimala)."""
    lagna = chart["ascendant"]["sign"]
    found = []
    for h in (6, 8, 12):
        lord = house_lord(lagna, h)
        placed = house_from(lagna, _sign(chart, lord))
        if placed in (6, 8, 12):
            found.append((h, lord, placed))
    if not found:
        return None
    en = "; ".join(f"{VIPREET_NAMES[h][0]}: {planet_name(lord, 'en')}, lord of the {ordinal_en(h)}, "
                   f"is in the {ordinal_en(placed)}" for h, lord, placed in found)
    hi = "; ".join(f"{VIPREET_NAMES[h][1]}: {ordinal_hi(h)} भाव का स्वामी {planet_name(lord, 'hi')} "
                   f"{ordinal_hi(placed)} भाव में" for h, lord, placed in found)
    return _yoga("vipreet_raj", "Vipreet Raj Yoga", "विपरीत राज योग",
                 f"{en}. Success that rises out of difficulties and setbacks of rivals.",
                 f"{hi}। कठिनाइयों से उभरकर मिलने वाली सफलता, विरोधियों पर विजय।",
                 [lord for _, lord, _ in found])


def neecha_bhanga(chart: dict) -> dict | None:
    """Basic Neecha Bhanga: a debilitated planet whose dispositor or exaltation-sign lord
    is in a kendra from Lagna or from the Moon."""
    lagna = chart["ascendant"]["sign"]
    moon = _sign(chart, "moon")
    found = []
    for planet in SEVEN_PLANETS:
        sign = _sign(chart, planet)
        if not is_debilitated(planet, sign):
            continue
        helpers = {SIGN_LORDS[sign], SIGN_LORDS[EXALTATION[planet]]}
        rescuers = [h for h in helpers if h != planet and (
            house_from(lagna, _sign(chart, h)) in KENDRAS or house_from(moon, _sign(chart, h)) in KENDRAS)]
        if rescuers:
            found.append((planet, sorted(rescuers)))
    if not found:
        return None
    en = "; ".join(f"debilitated {planet_name(p, 'en')} is supported by "
                   f"{' and '.join(planet_name(r, 'en') for r in rs)} in a kendra" for p, rs in found)
    hi = "; ".join(f"नीच के {planet_name(p, 'hi')} को केंद्र में स्थित "
                   f"{' और '.join(planet_name(r, 'hi') for r in rs)} का सहारा" for p, rs in found)
    return _yoga("neecha_bhanga", "Neecha Bhanga Raj Yoga", "नीच भंग राज योग",
                 f"{en[0].upper()}{en[1:]}. The weakness of debilitation is cancelled and can turn into "
                 "rise after early struggle.",
                 f"{hi}। ग्रह की नीचता भंग होती है; आरंभिक संघर्ष के बाद उन्नति।",
                 [p for p, rs in found for p in [p, *rs]])


def adhi_yoga(chart: dict) -> dict | None:
    """At least two natural benefics (Jupiter, Venus, Mercury) in the 6th/7th/8th from the Moon."""
    moon = _sign(chart, "moon")
    placed = [(p, house_from(moon, _sign(chart, p))) for p in ("jupiter", "venus", "mercury")]
    hits = [(p, h) for p, h in placed if h in (6, 7, 8)]
    if len(hits) < 2:
        return None
    en = ", ".join(f"{planet_name(p, 'en')} in the {ordinal_en(h)}" for p, h in hits)
    hi = ", ".join(f"{planet_name(p, 'hi')} {ordinal_hi(h)} भाव में" for p, h in hits)
    return _yoga("adhi_yoga", "Adhi Yoga", "अधि योग",
                 f"From the Moon: {en}. Leadership, comfort, a long and prosperous life.",
                 f"चंद्र से: {hi}। नेतृत्व क्षमता, सुख-सुविधा और दीर्घ समृद्ध जीवन।",
                 ["moon", *(p for p, _ in hits)])


def kemadruma(chart: dict) -> dict | None:
    """No planet (Sun and nodes excluded) in the 2nd or 12th from the Moon."""
    moon = _sign(chart, "moon")
    flanking = [p for p in ("mars", "mercury", "jupiter", "venus", "saturn")
                if house_from(moon, _sign(chart, p)) in (2, 12)]
    if flanking:
        return None
    in_kendra = [p for p in ("mars", "mercury", "jupiter", "venus", "saturn")
                 if house_from(moon, _sign(chart, p)) in KENDRAS]
    note_en = note_hi = ""
    if in_kendra:
        note_en = (" Mitigated: " + ", ".join(planet_name(p, "en") for p in in_kendra)
                   + " in a kendra from the Moon.")
        note_hi = (" शमन: चंद्र से केंद्र में " + ", ".join(planet_name(p, "hi") for p in in_kendra) + "।")
    return _yoga("kemadruma", "Kemadruma Yoga", "केमद्रुम योग",
                 "No planet occupies the 2nd or 12th house from the Moon. Can bring phases of loneliness "
                 f"or financial ups and downs; remedies help.{note_en}",
                 "चंद्र से दूसरे और बारहवें भाव में कोई ग्रह नहीं है। अकेलेपन या आर्थिक उतार-चढ़ाव के दौर आ सकते "
                 f"हैं; उपाय सहायक होते हैं।{note_hi}",
                 ["moon"])


def detect(chart: dict) -> list[dict]:
    found = [gajakesari(chart), budhaditya(chart), chandra_mangal(chart)]
    found += panch_mahapurusha(chart)
    found += [raj_yoga(chart), dhana_yoga(chart), vipreet_raj(chart), neecha_bhanga(chart),
              adhi_yoga(chart), kemadruma(chart)]
    return [y for y in found if y]
