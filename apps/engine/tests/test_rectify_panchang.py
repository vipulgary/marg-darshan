"""Rectification scoring and panchang angle maths (no swisseph)."""
from datetime import date, datetime, timezone

from app.services.dasha import vimshottari
from app.services.panchang import karana, panchang_from_longitudes, tithi, vara, yoga
from app.services.rectify import normalize_event_type, score_segments

# Moon at 0° Aries at birth -> Ketu 2000–2007, Venus 2007–2027 (Venus/Venus to ~2010-05, then Venus/Sun).
DASHAS = vimshottari(0.0, datetime(2000, 1, 1, tzinfo=timezone.utc), cycles=1)


def seg(frm, to, lagna, d9=1, planet_signs=None):
    return {"from": frm, "to": to, "lagna_sign": lagna, "d9_sign": d9, "vimshottari": DASHAS,
            "planet_signs": planet_signs or {}}


def test_event_type_aliases():
    assert normalize_event_type("marriage") == "marriage"
    assert normalize_event_type("first_child") == "child"
    assert normalize_event_type("Job Change") == "job"
    assert normalize_event_type("business_start") == "business"
    assert normalize_event_type("major illness/surgery") == "illness"
    assert normalize_event_type("relocation_abroad") == "abroad"
    assert normalize_event_type("fathers_passing") == "father_death"
    assert normalize_event_type("mother-passing") == "mother_death"
    assert normalize_event_type("education_milestone") == "education"
    assert normalize_event_type("something else") is None


def test_scoring_prefers_lagna_whose_house_lords_run_at_events():
    segments = [
        seg("2000-01-01T05:00", "2000-01-01T07:00", lagna=2),   # Taurus: 7th lord Mars, 5th lord Mercury
        seg("2000-01-01T07:00", "2000-01-01T09:00", lagna=1),   # Aries: 7th lord Venus, 5th lord Sun
        seg("2000-01-01T09:00", "2000-01-01T11:00", lagna=3),
        seg("2000-01-01T11:00", "2000-01-01T12:00", lagna=4),
    ]
    events = [{"type": "marriage", "date": "2009-06-01"},     # Venus / Venus
              {"type": "first_child", "date": "2010-12-01"},  # Venus / Sun
              {"type": "unknown thing", "date": "2011-01-01"},
              {"type": "marriage", "date": "not a date"}]
    top = score_segments(segments, events)
    assert len(top) == 3
    best = top[0]
    assert best["lagna_sign"] == 1 and best["lagna_sign_en"] == "Aries"
    assert best["events_total"] == 2 and best["events_matched"] == 2
    assert best["score"] > top[1]["score"]
    assert best["reasons_en"] and len(best["reasons_en"]) == len(best["reasons_hi"])
    assert 0 < best["match_pct"] <= 100


def test_occupation_bonus_and_tie_break_by_length():
    events = [{"type": "marriage", "date": "2009-06-01"}]
    a = seg("2000-01-01T05:00", "2000-01-01T05:10", lagna=1)
    b = seg("2000-01-01T05:10", "2000-01-01T06:10", lagna=1)
    c = seg("2000-01-01T06:10", "2000-01-01T06:20", lagna=1, planet_signs={"venus": 7})
    top = score_segments([a, b, c], events)
    assert top[0]["from"] == c["from"]          # Venus occupying the 7th adds a point
    assert top[1]["from"] == b["from"]          # equal scores: longer segment first


def test_no_events_gives_zero_scores():
    top = score_segments([seg("2000-01-01T05:00", "2000-01-01T06:00", 1)], [])
    assert top[0]["score"] == 0 and top[0]["match_pct"] == 0.0


def test_tithi():
    t = tithi(0.0, 5.0)
    assert t["index"] == 1 and t["paksha"] == "shukla" and t["name_en"] == "Pratipada"
    assert tithi(0.0, 179.9)["name_en"] == "Purnima" and tithi(0.0, 179.9)["index"] == 15
    k = tithi(0.0, 181.0)
    assert k["index"] == 16 and k["paksha"] == "krishna" and k["name_hi"] == "प्रतिपदा"
    assert tithi(10.0, 5.0)["name_en"] == "Amavasya" and tithi(10.0, 5.0)["index"] == 30
    assert tithi(100.0, 100.0 + 12 * 10 + 6)["name_en"] == "Ekadashi"
    assert tithi(0.0, 6.0)["elapsed_pct"] == 50.0


def test_yoga():
    assert yoga(0.0, 0.0)["name_en"] == "Vishkambha"
    assert yoga(200.0, 160.0)["name_en"] == "Vishkambha"
    assert yoga(350.0, 9.9)["name_en"] == "Vaidhriti" and yoga(350.0, 9.9)["index"] == 27
    assert yoga(0.0, 13.34)["name_en"] == "Priti"


def test_karana():
    assert karana(0.0, 3.0)["name_en"] == "Kimstughna"
    assert karana(0.0, 6.0)["name_en"] == "Bava"
    assert karana(0.0, 6 * 7 + 1)["name_en"] == "Vishti"
    assert karana(0.0, 6 * 8 + 1)["name_en"] == "Bava"
    assert karana(0.0, 6 * 56 + 1)["name_en"] == "Vishti"
    assert karana(0.0, 6 * 57 + 1)["name_en"] == "Shakuni"
    assert karana(0.0, 6 * 58 + 1)["name_en"] == "Chatushpada"
    assert karana(0.0, 6 * 59 + 1)["name_en"] == "Naga"


def test_vara_and_bundle():
    assert vara(date(2024, 1, 14))["name_en"] == "Ravivara"   # Sunday
    assert vara(date(2024, 1, 15))["name_hi"] == "सोमवार"
    p = panchang_from_longitudes(date(2024, 1, 14), 270.0, 275.0)
    assert p["tithi"]["index"] == 1 and p["nakshatra"]["name_en"] == "Uttara Ashadha"
