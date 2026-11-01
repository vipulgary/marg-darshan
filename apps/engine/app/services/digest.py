"""Weekly panchang digest + newsletter HTML (AMX-121).

Pure parts (observance rules, HTML rendering, Listmonk payload) need no swisseph;
week_digest() calls panchang_for() which imports swisseph lazily.

TODO(AMX-121): swap the small rule table below for adyatithi (full festival
calendar with kshaya/adhika tithi handling) once it is added to requirements.
"""
import base64
import json
import logging
import os
import urllib.request
from datetime import date, timedelta
from html import escape

log = logging.getLogger(__name__)

# Amanta lunar months, index 0 = Chaitra (begins at the new moon with the Sun in Meena).
MONTHS = [("Chaitra", "चैत्र"), ("Vaishakha", "वैशाख"), ("Jyeshtha", "ज्येष्ठ"),
          ("Ashadha", "आषाढ़"), ("Shravana", "श्रावण"), ("Bhadrapada", "भाद्रपद"),
          ("Ashwin", "आश्विन"), ("Kartika", "कार्तिक"), ("Margashirsha", "मार्गशीर्ष"),
          ("Pausha", "पौष"), ("Magha", "माघ"), ("Phalguna", "फाल्गुन")]


def lunar_month(sun_lon: float, moon_lon: float) -> dict:
    """Approximate amanta month: the Sun's sidereal sign at the preceding new moon.

    The Sun moves ~1/12.2 of the Moon-Sun elongation since that new moon.
    Adhika (leap) months are not detected.
    """
    elong = (moon_lon - sun_lon) % 360
    sun_at_nm = (sun_lon - elong / 12.19) % 360
    idx = (int(sun_at_nm // 30) + 1) % 12  # Meena (11) -> Chaitra (0)
    return {"index": idx, "name_en": MONTHS[idx][0], "name_hi": MONTHS[idx][1]}


def observances(tithi_index: int, month_index: int | None = None) -> list[dict]:
    """Recurring vrat/observances for the udaya tithi (1..30). Pure rule table."""
    out: list[dict] = []
    t = tithi_index
    if t in (11, 26):
        out.append({"key": "ekadashi", "name_en": "Ekadashi Vrat", "name_hi": "एकादशी व्रत"})
    if t in (13, 28):
        out.append({"key": "pradosh", "name_en": "Pradosh Vrat", "name_hi": "प्रदोष व्रत"})
    if t == 15:
        out.append({"key": "purnima", "name_en": "Purnima", "name_hi": "पूर्णिमा"})
    if t == 30:
        out.append({"key": "amavasya", "name_en": "Amavasya", "name_hi": "अमावस्या"})
    if t == 19:
        out.append({"key": "sankashti", "name_en": "Sankashti Chaturthi", "name_hi": "संकष्टी चतुर्थी"})
    if t == 29:
        if month_index == 10:  # Magha (amanta) Krishna Chaturdashi
            out.append({"key": "maha_shivratri", "name_en": "Maha Shivratri", "name_hi": "महाशिवरात्रि"})
        else:
            out.append({"key": "masik_shivratri", "name_en": "Masik Shivratri", "name_hi": "मासिक शिवरात्रि"})
    return out


def day_entry(p: dict) -> dict:
    """Trim a panchang_for() result to the digest shape and attach observances."""
    month = None
    if "sun_longitude" in p and "moon_longitude" in p:
        month = lunar_month(p["sun_longitude"], p["moon_longitude"])
    return {"date": p["date"], "vara": p["vara"], "tithi": p["tithi"], "nakshatra": p["nakshatra"],
            "yoga": p["yoga"], "sunrise": p.get("sunrise"), "sunset": p.get("sunset"),
            "month": month,
            "observances": observances(p["tithi"]["index"], month["index"] if month else None)}


def week_digest(start_date: date, lat: float, lng: float, tz: str, place: str = "New Delhi") -> dict:
    from app.services.panchang import panchang_for  # swisseph lazily

    days = [day_entry(panchang_for(start_date + timedelta(days=i), lat, lng, tz)) for i in range(7)]
    return {"start_date": start_date.isoformat(), "end_date": (start_date + timedelta(days=6)).isoformat(),
            "place": place, "latitude": lat, "longitude": lng, "tz_name": tz, "days": days}


# ---------------------------------------------------------------- HTML email

def _hhmm(iso: str | None) -> str:
    return iso[11:16] if iso and len(iso) >= 16 else "—"


def _name(obj: dict | None, lang: str) -> str:
    if not obj:
        return "—"
    return str(obj.get("name_hi" if lang == "hi" else "name_en") or obj.get("name_en") or "—")


LABELS = {
    "hi": {"title": "साप्ताहिक पंचांग", "date": "दिनांक", "vara": "वार", "tithi": "तिथि",
           "nakshatra": "नक्षत्र", "yoga": "योग", "sun": "सूर्योदय / सूर्यास्त", "obs": "व्रत / पर्व",
           "note": "समय {place} के अनुसार।"},
    "en": {"title": "Weekly Panchang", "date": "Date", "vara": "Day", "tithi": "Tithi",
           "nakshatra": "Nakshatra", "yoga": "Yoga", "sun": "Sunrise / Sunset", "obs": "Vrat / Festival",
           "note": "Timings for {place}."},
}


def _table(digest: dict, lang: str) -> str:
    L = LABELS[lang]
    paksha_key = "paksha_hi" if lang == "hi" else "paksha_en"
    head = "".join(f'<th style="text-align:left;padding:6px;border-bottom:1px solid #ccc">{escape(L[k])}</th>'
                   for k in ("date", "vara", "tithi", "nakshatra", "yoga", "sun", "obs"))
    rows = []
    for d in digest["days"]:
        obs = ", ".join(_name(o, lang) for o in d.get("observances", [])) or "—"
        cells = [d["date"], _name(d["vara"], lang),
                 f'{_name(d["tithi"], lang)} ({d["tithi"].get(paksha_key, "")})',
                 _name(d["nakshatra"], lang), _name(d["yoga"], lang),
                 f'{_hhmm(d.get("sunrise"))} / {_hhmm(d.get("sunset"))}', obs]
        rows.append("<tr>" + "".join(f'<td style="padding:6px;border-bottom:1px solid #eee">{escape(str(c))}</td>'
                                     for c in cells) + "</tr>")
    return (f'<h2 style="font-family:sans-serif">{escape(L["title"])} '
            f'({escape(digest["start_date"])} – {escape(digest["end_date"])})</h2>'
            f'<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">'
            f'<thead><tr>{head}</tr></thead><tbody>{"".join(rows)}</tbody></table>'
            f'<p style="font-family:sans-serif;font-size:12px;color:#666">'
            f'{escape(L["note"].format(place=digest.get("place", "")))}</p>')


def render_email_html(digest: dict) -> str:
    """Hindi first, then English, in one HTML email body. All values escaped."""
    return ('<!doctype html><html><head><meta charset="utf-8"></head><body>'
            f'<div lang="hi">{_table(digest, "hi")}</div><hr>'
            f'<div lang="en">{_table(digest, "en")}</div></body></html>')


# ---------------------------------------------------------------- Listmonk

def listmonk_campaign_payload(digest: dict, list_ids: list[int]) -> dict:
    return {"name": f"Weekly Panchang {digest['start_date']}",
            "subject": f"साप्ताहिक पंचांग / Weekly Panchang: {digest['start_date']} – {digest['end_date']}",
            "lists": list_ids, "type": "regular", "content_type": "html",
            "body": render_email_html(digest), "status": "draft"}


def parse_list_ids(raw: str | None) -> list[int]:
    return [int(x) for x in (raw or "").replace(" ", "").split(",") if x.isdigit()]


def create_listmonk_draft(digest: dict) -> dict:
    """Create a DRAFT campaign if LISTMONK_URL/USER/PASSWORD/LIST_IDS are set; never sends."""
    url = os.getenv("LISTMONK_URL")
    user, pwd = os.getenv("LISTMONK_USER"), os.getenv("LISTMONK_PASSWORD")
    lists = parse_list_ids(os.getenv("LISTMONK_LIST_IDS"))
    if not (url and user and pwd and lists):
        log.info("Listmonk not configured; weekly digest %s built but not uploaded", digest["start_date"])
        return {"status": "skipped", "reason": "listmonk_not_configured"}
    payload = listmonk_campaign_payload(digest, lists)
    token = base64.b64encode(f"{user}:{pwd}".encode()).decode()
    req = urllib.request.Request(url.rstrip("/") + "/api/campaigns", data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json", "Authorization": f"Basic {token}"},
                                 method="POST")
    with urllib.request.urlopen(req, timeout=20) as res:  # noqa: S310 (operator-configured URL)
        body = json.loads(res.read() or b"{}")
    return {"status": "draft_created", "campaign_id": (body.get("data") or {}).get("id")}
