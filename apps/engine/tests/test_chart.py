from datetime import date, datetime, time, timezone

import pytest

pytest.importorskip("swisseph")

from app.services.chart import DASHA_ORDER, compute_chart, navamsa_sign, nakshatra, running_dasha

J2000 = dict(dob=date(2000, 1, 1), tob=time(12, 0), tz_name="UTC", latitude=28.6139, longitude=77.2090)


@pytest.fixture(scope="module")
def chart():
    return compute_chart(**J2000)


def test_lahiri_ayanamsa_at_j2000(chart):
    assert 23.80 < chart["meta"]["ayanamsa_deg"] < 23.90


def test_sun_sidereal_sagittarius_at_j2000(chart):
    sun = chart["planets"]["sun"]
    assert sun["sign_en"] == "Sagittarius"
    assert 256.0 < sun["longitude"] < 257.2  # tropical ~280.46° minus ayanamsa


def test_ketu_opposite_rahu(chart):
    diff = (chart["planets"]["ketu"]["longitude"] - chart["planets"]["rahu"]["longitude"]) % 360
    assert diff == pytest.approx(180, abs=1e-6)


def test_houses_are_whole_sign_from_lagna(chart):
    lagna = chart["ascendant"]["sign"]
    for p in chart["planets"].values():
        assert p["house"] == (p["sign"] - lagna) % 12 + 1


def test_vimshottari_starts_with_moon_nakshatra_lord(chart):
    moon_nak = chart["planets"]["moon"]["nakshatra"]
    dashas = chart["vimshottari"]
    assert dashas[0]["lord"] == moon_nak["lord"]
    assert sum(d["years"] for d in dashas[:9]) == 120
    assert dashas[0]["start"] <= "2000-01-01" < dashas[0]["end"]


def test_running_dasha_lookup(chart):
    d = running_dasha(chart["vimshottari"], datetime(2000, 1, 2, tzinfo=timezone.utc))
    assert d == chart["vimshottari"][0]


def test_local_time_converted_to_utc():
    ist = compute_chart(date(2000, 1, 1), time(17, 30), "Asia/Kolkata", 28.6139, 77.2090)
    assert ist["meta"]["birth_utc"].startswith("2000-01-01T12:00:00")


def test_mahadashas_carry_contiguous_antardashas(chart):
    for maha in chart["vimshottari"]:
        subs = maha["antardashas"]
        assert subs[0]["lord"] == maha["lord"] and subs[0]["start"] == maha["start"]
        assert subs[-1]["end"] == maha["end"]


def test_yogas_doshas_on_real_chart(chart):
    from app.services.analysis import yogas_doshas
    out = yogas_doshas(chart)
    assert [d["key"] for d in out["doshas"]][:2] == ["manglik", "kaal_sarp"]
    assert all("name_hi" in y for y in out["yogas"])
