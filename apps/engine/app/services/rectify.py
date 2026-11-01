"""Birth-time rectification scan (AMX-048).

scan_window() needs swisseph (compute_chart is imported lazily); score_segments()
is pure. The result is a shortlist for the Jyotish — never a final answer for
the client.
"""
import re
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.services.astro_constants import (
    SIGN_LORDS, house_from, house_lord, planet_name, sign_names,
)
from app.services.dasha import running_periods

# event type -> (natural significator planets, relevant houses from Lagna)
SIGNIFICATORS: dict[str, tuple[tuple[str, ...], tuple[int, ...]]] = {
    "marriage": (("venus", "jupiter"), (7,)),
    "child": (("jupiter",), (5,)),
    "job": (("sun", "saturn", "mercury"), (10,)),
    "business": (("mercury",), (7, 10)),
    "illness": (("mars", "saturn"), (6, 8)),
    "accident": (("mars", "rahu"), (8,)),
    "abroad": (("rahu",), (12,)),
    "father_death": (("sun",), (9,)),
    "mother_death": (("moon",), (4,)),
    "education": (("mercury", "jupiter"), (4, 5)),
}
EVENT_NAMES = {
    "marriage": ("marriage", "विवाह"), "child": ("birth of a child", "संतान जन्म"),
    "job": ("job / career event", "नौकरी / करियर घटना"), "business": ("business start", "व्यवसाय आरंभ"),
    "illness": ("major illness / surgery", "गंभीर बीमारी / सर्जरी"), "accident": ("accident", "दुर्घटना"),
    "abroad": ("relocation abroad", "विदेश गमन"), "father_death": ("father's passing", "पिता का निधन"),
    "mother_death": ("mother's passing", "माता का निधन"), "education": ("education milestone", "शिक्षा उपलब्धि"),
}
# keyword fallbacks, checked in order, for free-form event type strings from the web form
_KEYWORDS = [("father", "father_death"), ("mother", "mother_death"), ("marri", "marriage"),
             ("wedding", "marriage"), ("child", "child"), ("baby", "child"), ("business", "business"),
             ("job", "job"), ("career", "job"), ("promot", "job"), ("ill", "illness"), ("surg", "illness"),
             ("health", "illness"), ("accident", "accident"), ("abroad", "abroad"), ("reloc", "abroad"),
             ("foreign", "abroad"), ("educ", "education"), ("degree", "education"), ("study", "education"),
             ("exam", "education")]

W_ANTAR_LORD, W_MAHA_LORD, W_ANTAR_KARAKA, W_MAHA_KARAKA, W_OCCUPIES = 3, 2, 1, 1, 1


def normalize_event_type(raw: str) -> str | None:
    key = re.sub(r"[^a-z]+", "_", (raw or "").lower()).strip("_")
    if key in SIGNIFICATORS:
        return key
    return next((canon for kw, canon in _KEYWORDS if kw in key), None)


def _parse_day(value) -> str | None:
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    try:
        return date.fromisoformat(str(value)[:10]).isoformat()
    except ValueError:
        return None


def scan_window(dob: date, start_time: time, end_time: time, tz_name: str, lat: float, lng: float,
                step_minutes: int = 1) -> list[dict]:
    """Charts every `step_minutes` across the local window and merges runs with the same
    Lagna and D9 Lagna. end_time <= start_time means the window crosses midnight into dob+1.
    Each segment carries the vimshottari (with antardashas) and planet signs at its midpoint."""
    from app.services.chart import compute_chart  # lazy: swisseph

    tz = ZoneInfo(tz_name)
    start = datetime.combine(dob, start_time)
    end = datetime.combine(dob, end_time)
    if end <= start:
        end += timedelta(days=1)
    step = timedelta(minutes=max(1, step_minutes))

    def chart_at(local: datetime) -> dict:
        aware = local.replace(tzinfo=tz)
        return compute_chart(aware.date(), aware.time(), tz_name, lat, lng)

    raw: list[dict] = []
    t = start
    while t <= end:
        c = chart_at(t)
        key = (c["ascendant"]["sign"], c["ascendant"]["d9_sign"])
        if raw and raw[-1]["_key"] == key:
            raw[-1]["_last"] = t
        else:
            raw.append({"_key": key, "_first": t, "_last": t})
        t += step

    segments = []
    for i, seg in enumerate(raw):
        seg_end = raw[i + 1]["_first"] if i + 1 < len(raw) else min(seg["_last"] + step, end)
        mid = seg["_first"] + (seg_end - seg["_first"]) / 2
        c = chart_at(mid.replace(second=0, microsecond=0))
        segments.append({
            "from": seg["_first"].isoformat(timespec="minutes"),
            "to": seg_end.isoformat(timespec="minutes"),
            "lagna_sign": seg["_key"][0], "d9_sign": seg["_key"][1],
            "vimshottari": c["vimshottari"],
            "planet_signs": {k: p["sign"] for k, p in c["planets"].items()},
        })
    return segments


def _minutes(seg: dict) -> float:
    try:
        return (datetime.fromisoformat(seg["to"]) - datetime.fromisoformat(seg["from"])).total_seconds() / 60
    except (KeyError, ValueError):
        return 0.0


def score_segments(segments: list[dict], life_events: list[dict], top: int = 3) -> list[dict]:
    """Score each candidate segment by how well the running maha/antardasha lord at every
    event date signifies that event for the candidate Lagna:
      antardasha lord rules a relevant house +3, mahadasha lord rules one +2,
      dasha lord is a natural significator +1 each, dasha lord occupies a relevant house +1.
    Returns the top candidates (score desc, then longer segment, then earlier)."""
    events = []
    for ev in life_events:
        kind = normalize_event_type(str(ev.get("type", "")))
        day = _parse_day(ev.get("date"))
        if kind and day:
            events.append((kind, day))
    per_event_max = W_ANTAR_LORD + W_MAHA_LORD + W_ANTAR_KARAKA + W_MAHA_KARAKA + 2 * W_OCCUPIES
    max_score = per_event_max * len(events)

    scored = []
    for seg in segments:
        lagna = seg["lagna_sign"]
        signs = seg.get("planet_signs") or {}
        score = 0
        reasons_en, reasons_hi = [], []
        matched = 0
        for kind, day in events:
            karakas, houses = SIGNIFICATORS[kind]
            lords = {house_lord(lagna, h) for h in houses}
            maha, antar = running_periods(seg.get("vimshottari") or [], day)
            if not maha:
                continue
            ev_en, ev_hi = EVENT_NAMES[kind]
            ev_score = 0
            for period, label_en, label_hi, w_lord, w_karaka in (
                    (maha, "mahadasha", "महादशा", W_MAHA_LORD, W_MAHA_KARAKA),
                    (antar, "antardasha", "अंतर्दशा", W_ANTAR_LORD, W_ANTAR_KARAKA)):
                if not period:
                    continue
                lord = period["lord"]
                p_en, p_hi = planet_name(lord, "en"), planet_name(lord, "hi")
                if lord in lords:
                    ev_score += w_lord
                    hs = "/".join(str(h) for h in houses if house_lord(lagna, h) == lord)
                    reasons_en.append(f"{ev_en} ({day}): {label_en} lord {p_en} rules house {hs}")
                    reasons_hi.append(f"{ev_hi} ({day}): {label_hi} स्वामी {p_hi} भाव {hs} का स्वामी")
                if lord in karakas:
                    ev_score += w_karaka
                    reasons_en.append(f"{ev_en} ({day}): {label_en} lord {p_en} is a natural significator")
                    reasons_hi.append(f"{ev_hi} ({day}): {label_hi} स्वामी {p_hi} नैसर्गिक कारक")
                if lord in signs and house_from(lagna, signs[lord]) in houses:
                    ev_score += W_OCCUPIES
                    reasons_en.append(f"{ev_en} ({day}): {p_en} occupies house {house_from(lagna, signs[lord])}")
                    reasons_hi.append(f"{ev_hi} ({day}): {p_hi} भाव {house_from(lagna, signs[lord])} में स्थित")
            if ev_score:
                matched += 1
            score += ev_score
        lagna_en, lagna_hi = sign_names(lagna)
        scored.append({
            "from": seg["from"], "to": seg["to"],
            "lagna_sign": lagna, "lagna_sign_en": lagna_en, "lagna_sign_hi": lagna_hi,
            "lagna_lord": SIGN_LORDS[lagna], "d9_sign": seg.get("d9_sign"),
            "score": score, "max_score": max_score,
            "match_pct": round(score / max_score * 100, 1) if max_score else 0.0,
            "events_matched": matched, "events_total": len(events),
            "reasons_en": reasons_en, "reasons_hi": reasons_hi,
        })
    scored.sort(key=lambda c: (-c["score"], -_minutes(c), c["from"]))
    return scored[:top]


def rectify(dob: date, start_time: time, end_time: time, tz_name: str, lat: float, lng: float,
            life_events: list[dict], step_minutes: int = 1) -> dict:
    segments = scan_window(dob, start_time, end_time, tz_name, lat, lng, step_minutes)
    return {
        "candidates": score_segments(segments, life_events),
        "segments": [{k: s[k] for k in ("from", "to", "lagna_sign", "d9_sign")} for s in segments],
        "step_minutes": step_minutes,
        "note_en": "Shortlist for the Jyotish's review — not a final birth time.",
        "note_hi": "यह ज्योतिषाचार्य की समीक्षा हेतु सूची है — अंतिम जन्म समय नहीं।",
    }
