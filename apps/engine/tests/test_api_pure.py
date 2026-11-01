"""API and geo tests that run without swisseph."""
import importlib.util
from datetime import date, time

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.geo import timezone_at, utc_offset_hours

client = TestClient(app)
KEY = {"X-Engine-Key": "test-key"}
HAS_SWE = importlib.util.find_spec("swisseph") is not None


def test_timezone_lookup_india():
    assert timezone_at(19.076, 72.8777) == "Asia/Kolkata"


def test_historic_offset_world_war_ii_india():
    # India ran +06:30 war time from Sep 1942 to Oct 1945 (tzdata).
    assert utc_offset_hours("Asia/Kolkata", date(1943, 6, 1), time(10, 0)) == 6.5
    assert utc_offset_hours("Asia/Kolkata", date(1990, 6, 1), time(10, 0)) == 5.5


def test_health_is_public():
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] in ("ok", "degraded")


def test_api_requires_key():
    assert client.post("/api/v1/horoscope/compute", json={}).status_code == 401
    assert client.get("/api/v1/panchang").status_code == 401
    assert client.post("/api/v1/horoscope/rectify-scan", json={}).status_code == 401


def test_resolve_with_coordinates_needs_no_network():
    r = client.post("/api/v1/geo/resolve", headers=KEY,
                    json={"latitude": 26.8467, "longitude": 80.9462, "on_date": "1990-08-15"})
    assert r.status_code == 200
    assert r.json()["tz_name"] == "Asia/Kolkata" and r.json()["tz_offset_hours"] == 5.5


def test_panchang_rejects_bad_timezone():
    assert client.get("/api/v1/panchang?tz=Mars/Olympus", headers=KEY).status_code == 422


RECTIFY_BODY = {"dob": "1990-08-15", "window_start": "05:00", "window_end": "09:00",
                "tz_name": "Asia/Kolkata", "latitude": 26.8467, "longitude": 80.9462,
                "life_events": [{"type": "marriage", "date": "2016-02-10"}]}


def test_rectify_scan_validation():
    assert client.post("/api/v1/horoscope/rectify-scan", headers=KEY,
                       json={**RECTIFY_BODY, "life_events": []}).status_code == 422
    assert client.post("/api/v1/horoscope/rectify-scan", headers=KEY,
                       json={**RECTIFY_BODY, "tz_name": "Nowhere/City"}).status_code == 422


@pytest.mark.skipif(HAS_SWE, reason="checks the no-ephemeris fallback")
def test_endpoints_return_503_without_swisseph():
    body = {"name": "Test", "dob": "1990-08-15", "tob": "06:30:00", "latitude": 26.8467,
            "longitude": 80.9462, "tz_name": "Asia/Kolkata"}
    assert client.post("/api/v1/horoscope/compute", json=body, headers=KEY).status_code == 503
    assert client.get("/api/v1/panchang?date=2024-01-14", headers=KEY).status_code == 503
    assert client.post("/api/v1/horoscope/rectify-scan", json=RECTIFY_BODY, headers=KEY).status_code == 503


def test_celery_tasks_registered():
    from app.tasks import compute_horoscope_task, rectify_scan_task
    from app.worker import celery

    assert compute_horoscope_task.name in celery.tasks
    assert rectify_scan_task.name in celery.tasks
    assert compute_horoscope_task.max_retries == 3
