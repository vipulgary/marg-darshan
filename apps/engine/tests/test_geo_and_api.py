"""API tests that need swisseph; pure geo/API tests live in test_api_pure.py."""
import pytest

pytest.importorskip("swisseph")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)
KEY = {"X-Engine-Key": "test-key"}


def test_health_is_public():
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"


def test_compute_endpoint():
    body = {"name": "Test", "dob": "1990-08-15", "tob": "06:30:00", "latitude": 26.8467,
            "longitude": 80.9462, "tz_name": "Asia/Kolkata", "place_name": "Lucknow"}
    r = client.post("/api/v1/horoscope/compute", json=body, headers=KEY)
    assert r.status_code == 200, r.text
    data = r.json()
    assert set(data["planets"]) == {"sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"}
    assert data["planets"]["sun"]["sign_en"] == "Cancer"  # mid-August sidereal Sun
    assert "vargas" in data
    assert {"doshas", "yogas"} <= set(data["yogas_doshas"])
    assert "antardashas" in data["vimshottari"][0]


def test_panchang_endpoint():
    r = client.get("/api/v1/panchang?date=2024-01-14&lat=28.6139&lng=77.209&tz=Asia/Kolkata", headers=KEY)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["sunrise"].startswith("2024-01-14T07:")
    assert {"tithi", "nakshatra", "yoga", "karana", "vara"} <= set(data)


def test_rectify_scan_endpoint_returns_top3():
    body = {"dob": "1990-08-15", "window_start": "05:00", "window_end": "09:00", "tz_name": "Asia/Kolkata",
            "latitude": 26.8467, "longitude": 80.9462, "step_minutes": 5,
            "life_events": [{"type": "marriage", "date": "2016-02-10"},
                            {"type": "job_start", "date": "2013-07-01"},
                            {"type": "first_child", "date": "2018-11-20"}]}
    r = client.post("/api/v1/horoscope/rectify-scan", json=body, headers=KEY)
    assert r.status_code == 200, r.text
    data = r.json()
    assert 1 <= len(data["candidates"]) <= 3
    segs = data["segments"]
    assert segs[0]["from"].startswith("1990-08-15T05:00") and segs[-1]["to"].startswith("1990-08-15T09:00")
    assert all(a["to"] == b["from"] for a, b in zip(segs, segs[1:]))
