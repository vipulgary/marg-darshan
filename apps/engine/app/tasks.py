"""Celery tasks (AMX-047 skeleton). Results are returned as JSON only.

TODO(AMX-047): record status/results in the DB (Horoscope, RectificationScan),
render the PDF (AMX-046) and email it (AMX-064 kundali, AMX-131 dossier).
"""
import asyncio

from app.models.schemas import BirthData, RectifyScanRequest
from app.worker import celery

# Retry only transient infrastructure errors; bad input fails immediately.
RETRY = dict(autoretry_for=(ConnectionError, TimeoutError), retry_backoff=True,
             retry_kwargs={"max_retries": 3})


@celery.task(name="astromax.compute_horoscope", **RETRY)
def compute_horoscope_task(birth_dict: dict) -> dict:
    from app.services import vargas
    from app.services.analysis import compute_core

    birth = BirthData.model_validate(birth_dict)
    chart = compute_core(birth.dob, birth.tob, birth.tz_name, birth.latitude, birth.longitude)
    chart["vargas"] = asyncio.run(vargas.compute(birth))
    return chart


@celery.task(name="astromax.rectify_scan", **RETRY)
def rectify_scan_task(request_dict: dict) -> dict:
    from app.services.rectify import rectify

    req = RectifyScanRequest.model_validate(request_dict)
    events = [{"type": e.type, "date": e.date.isoformat()} for e in req.life_events]
    return rectify(req.dob, req.window_start, req.window_end, req.tz_name,
                   req.latitude, req.longitude, events, req.step_minutes)


@celery.task(name="astromax.weekly_panchang_digest", **RETRY)
def weekly_panchang_digest_task(lat: float = 28.6139, lng: float = 77.2090, tz: str = "Asia/Kolkata") -> dict:
    """AMX-121: build next 7 days' digest; create a Listmonk DRAFT (never sends)."""
    from datetime import datetime
    from zoneinfo import ZoneInfo

    from app.services.digest import create_listmonk_draft, week_digest

    digest = week_digest(datetime.now(ZoneInfo(tz)).date(), lat, lng, tz)
    return {"start_date": digest["start_date"], **create_listmonk_draft(digest)}
