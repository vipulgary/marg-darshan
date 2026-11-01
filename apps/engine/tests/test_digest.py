"""AMX-121 weekly digest: pure rules/rendering + swisseph-gated integration."""
from datetime import date

import pytest

from app.services.digest import (create_listmonk_draft, day_entry, listmonk_campaign_payload, lunar_month,
                                 observances, parse_list_ids, render_email_html)
from app.services.panchang import panchang_from_longitudes


def keys(t, m=None):
    return [o["key"] for o in observances(t, m)]


def test_observance_rules():
    assert keys(11) == ["ekadashi"] and keys(26) == ["ekadashi"]
    assert keys(13) == ["pradosh"] and keys(28) == ["pradosh"]
    assert keys(15) == ["purnima"] and keys(30) == ["amavasya"]
    assert keys(19) == ["sankashti"]
    assert keys(29, 3) == ["masik_shivratri"] and keys(29, 10) == ["maha_shivratri"]
    assert keys(1) == [] and keys(4) == []


def test_lunar_month_approx():
    # New moon with Sun at 345° (Meena) -> Chaitra; Sun at 15° (Mesha) -> Vaishakha.
    assert lunar_month(345.0, 345.0)["name_en"] == "Chaitra"
    assert lunar_month(15.0, 15.0)["name_en"] == "Vaishakha"
    # Ten days after a new moon in Makara (Sun ~289 -> 299 now): still Magha.
    assert lunar_month(299.0, (299.0 + 122.0) % 360)["name_en"] == "Magha"


def synthetic_digest():
    days = []
    for i, elong in enumerate([125.0, 130.0, 170.0, 185.0, 340.0, 350.0, 5.0]):
        p = panchang_from_longitudes(date(2026, 11, 1 + i), 200.0, (200.0 + elong) % 360)
        p.update(date=f"2026-11-0{1 + i}", sunrise="2026-11-01T06:35:00+05:30",
                 sunset="2026-11-01T17:35:00+05:30", sun_longitude=200.0, moon_longitude=(200.0 + elong) % 360)
        days.append(day_entry(p))
    return {"start_date": "2026-11-01", "end_date": "2026-11-07", "place": "New Delhi <b>", "days": days}


def test_day_entry_and_html():
    d = synthetic_digest()
    assert d["days"][0]["tithi"]["index"] == 11
    assert d["days"][0]["observances"][0]["key"] == "ekadashi"
    html = render_email_html(d)
    assert "एकादशी व्रत" in html and "Ekadashi Vrat" in html
    assert "06:35 / 17:35" in html
    assert "<b>" not in html and "&lt;b&gt;" in html


def test_listmonk_payload_is_draft(monkeypatch):
    assert parse_list_ids("1, 2,x,3") == [1, 2, 3]
    p = listmonk_campaign_payload(synthetic_digest(), [4])
    assert p["status"] == "draft" and p["content_type"] == "html" and p["lists"] == [4]
    monkeypatch.delenv("LISTMONK_URL", raising=False)
    assert create_listmonk_draft(synthetic_digest())["status"] == "skipped"


def test_week_digest_with_swisseph():
    pytest.importorskip("swisseph")
    from app.services.digest import week_digest

    d = week_digest(date(2026, 11, 1), 28.6139, 77.2090, "Asia/Kolkata")
    assert len(d["days"]) == 7 and d["days"][0]["sunrise"]
