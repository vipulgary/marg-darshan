# Astromax Astro Engine (FastAPI)

Server-to-server only. Every request (except `/health`) must send `X-Engine-Key`.

```bash
python -m venv .venv && .venv/Scripts/activate   # Windows; use bin/activate on Linux/macOS
pip install -r requirements.txt -r requirements-dev.txt
python scripts/install_ephe.py      # Swiss Ephemeris data files (not shipped in PyPI wheels)
uvicorn app.main:app --reload --port 8000
pytest -q
```

| Endpoint | Returns | Ticket |
|---|---|---|
| `GET /health` | status (`ok` / `degraded` without swisseph), ephemeris info | AMX-040/041 |
| `GET /api/v1/geo/search?q=` · `POST /api/v1/geo/resolve` | places with IANA tz / historic offset | AMX-042 |
| `POST /api/v1/horoscope/compute` | chart JSON + `vimshottari[].antardashas` + `yogas_doshas: {doshas, yogas}` + `vargas` | AMX-043/044 |
| `POST /api/v1/horoscope/rectify-scan` | body `{dob, window_start, window_end, tz_name, latitude, longitude, life_events[{type, date}], step_minutes?}` → top-3 `candidates` + `segments` | AMX-048 |
| `GET /api/v1/panchang?date=&lat=&lng=&tz=` | sunrise/sunset, vara, tithi, nakshatra, yoga, karana at sunrise (default: today, New Delhi) | AMX-049 |

Endpoints that need the ephemeris return `503` when pyswisseph is not installed.

Celery (AMX-047): `celery -A app.worker.celery worker` runs `astromax.compute_horoscope` and
`astromax.rectify_scan` (`app/tasks.py`; 3 retries on transient errors; DB/PDF/email still TODO).

Layout: astrology rules are pure modules (`services/astro_constants.py`, `doshas.py`, `yogas.py`,
`dasha.py`, the scoring in `rectify.py`, the angle maths in `panchang.py`) tested with synthetic
charts (`tests/chartfactory.py`). Tests that need swisseph use `pytest.importorskip("swisseph")`.
