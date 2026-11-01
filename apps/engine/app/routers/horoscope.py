import asyncio
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, HTTPException

from app.models.schemas import BirthData, RectifyScanRequest, RectifyScanResponse
from app.services import vargas

router = APIRouter(prefix="/horoscope", tags=["horoscope"])


def check_tz(tz_name: str) -> None:
    try:
        ZoneInfo(tz_name)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"unknown timezone: {tz_name}") from exc


@router.post("/compute")
async def compute(body: BirthData):
    """Synchronous chart compute incl. yogas_doshas. The queued flow is app.tasks (AMX-047)."""
    check_tz(body.tz_name)
    from app.services.analysis import compute_core

    try:
        chart = await asyncio.to_thread(
            compute_core, body.dob, body.tob, body.tz_name, body.latitude, body.longitude)
    except ImportError as exc:  # swisseph is loaded lazily
        raise HTTPException(status_code=503, detail=f"ephemeris unavailable: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    chart["vargas"] = await vargas.compute(body)
    return chart


@router.post("/rectify-scan", response_model=RectifyScanResponse)
async def rectify_scan(body: RectifyScanRequest):
    check_tz(body.tz_name)
    from app.services.rectify import rectify

    events = [{"type": e.type, "date": e.date.isoformat()} for e in body.life_events]
    try:
        return await asyncio.to_thread(
            rectify, body.dob, body.window_start, body.window_end, body.tz_name,
            body.latitude, body.longitude, events, body.step_minutes)
    except ImportError as exc:
        raise HTTPException(status_code=503, detail=f"ephemeris unavailable: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
