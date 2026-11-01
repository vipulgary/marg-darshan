"""Pure tests (no swisseph): nakshatra/navamsa, vargas input, constants, dasha math."""
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from app.services.astro_constants import (
    DASHA_ORDER, DEBILITATION, aspects, datetime_to_jd, dignity, house_from, house_lord,
    jd_to_datetime, nakshatra, navamsa_sign,
)
from app.services.dasha import antardashas, running_dasha, running_periods, vimshottari


def test_nakshatra_boundaries():
    assert nakshatra(0.0)["name_en"] == "Ashwini" and nakshatra(0.0)["pada"] == 1
    assert nakshatra(13.34)["name_en"] == "Bharani"
    assert nakshatra(359.99)["name_en"] == "Revati" and nakshatra(359.99)["pada"] == 4
    assert [lord for lord, _ in DASHA_ORDER][0] == nakshatra(0.0)["lord"]


def test_navamsa():
    assert navamsa_sign(0.0) == 0        # Aries 0° -> Aries navamsa
    assert navamsa_sign(30.0) == 9       # Taurus 0° -> Capricorn navamsa
    assert navamsa_sign(359.99) == 11    # Pisces end -> Pisces navamsa


def test_vargas_input_rounds_historic_offset_but_keeps_utc_moment():
    from app.models.schemas import BirthData
    from app.services.vargas import local_input

    # 1900 Mumbai: tzdata gives Bombay Time +4:51 — not a 0.5h step.
    b = BirthData(name="T", dob=date(1900, 1, 1), tob=time(10, 0), latitude=19.07,
                  longitude=72.87, tz_name="Asia/Kolkata", place_name="Mumbai")
    p = local_input(b)
    assert p["timezone"] % 0.5 == 0
    utc = datetime.combine(b.dob, b.tob, tzinfo=ZoneInfo(b.tz_name)).astimezone(timezone.utc).replace(tzinfo=None)
    wall = datetime(p["year"], p["month"], p["day"], p["hour"], p["min"], p["sec"])
    assert wall - timedelta(hours=p["timezone"]) == utc


def test_houses_lords_and_aspects():
    assert house_from(1, 7) == 7 and house_from(10, 1) == 4 and house_from(5, 5) == 1
    assert house_lord(1, 7) == "venus"      # Aries lagna: 7th = Libra
    assert house_lord(2, 7) == "mars"       # Taurus lagna: 7th = Scorpio
    assert aspects("jupiter", 1, 5) and aspects("jupiter", 1, 9) and aspects("jupiter", 1, 7)
    assert not aspects("jupiter", 1, 4)
    assert aspects("mars", 1, 4) and aspects("mars", 1, 8) and aspects("saturn", 1, 3)
    assert aspects("saturn", 1, 10) and not aspects("sun", 1, 5)


def test_dignity():
    assert DEBILITATION["sun"] == 7 and DEBILITATION["saturn"] == 1
    assert dignity("sun", 1) == "exalted" and dignity("sun", 7) == "debilitated"
    assert dignity("sun", 5, 10) == "mooltrikona" and dignity("sun", 5, 25) == "own"
    assert dignity("mars", 9) == "friend" and dignity("mars", 3) == "enemy"


def test_julian_day_roundtrip():
    j2000 = datetime(2000, 1, 1, 12, tzinfo=timezone.utc)
    assert datetime_to_jd(j2000) == 2451545.0
    dt = datetime(1990, 8, 15, 1, 0, tzinfo=timezone.utc)
    assert abs((jd_to_datetime(datetime_to_jd(dt)) - dt).total_seconds()) < 0.01


def test_antardasha_proportions_and_contiguity():
    maha = {"lord": "venus", "years": 20, "start": "2000-01-01", "end": "2020-01-01"}
    subs = antardashas(maha)
    assert [s["lord"] for s in subs] == ["venus", "sun", "moon", "mars", "rahu", "jupiter",
                                         "saturn", "mercury", "ketu"]
    assert subs[0]["start"] == "2000-01-01" and subs[-1]["end"] == "2020-01-01"
    assert all(a["end"] == b["start"] for a, b in zip(subs, subs[1:]))
    # Venus/Venus = 20*20/120 = 3y4m
    d0 = date.fromisoformat(subs[0]["end"]) - date.fromisoformat(subs[0]["start"])
    assert abs(d0.days - 20 * 20 / 120 * 365.25) <= 1


def test_vimshottari_includes_antardashas_and_running_periods():
    birth = datetime(2000, 1, 1, tzinfo=timezone.utc)
    dashas = vimshottari(0.0, birth, cycles=2)  # Moon at 0° Aries: Ketu dasha starts at birth
    assert dashas[0]["lord"] == "ketu" and dashas[0]["start"] == "2000-01-01"
    assert sum(d["years"] for d in dashas[:9]) == 120
    for d in dashas:
        assert d["antardashas"][0]["lord"] == d["lord"] and d["antardashas"][-1]["end"] == d["end"]
    maha, antar = running_periods(dashas, "2000-02-01")
    assert maha["lord"] == "ketu" and antar["lord"] == "ketu"
    # Venus maha 2007–2027: Venus antar until ~2010-05, then Sun
    maha, antar = running_periods(dashas, date(2009, 6, 1))
    assert maha["lord"] == "venus" and antar["lord"] == "venus"
    maha, antar = running_periods(dashas, date(2010, 8, 1))
    assert maha["lord"] == "venus" and antar["lord"] == "sun"
    assert running_dasha(dashas, datetime(2000, 1, 2, tzinfo=timezone.utc)) == dashas[0]
    assert running_periods(dashas, "1990-01-01") == (None, None)
