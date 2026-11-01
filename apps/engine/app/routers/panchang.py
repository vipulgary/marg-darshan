import asyncio
from datetime import date, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(tags=["panchang"])


@router.get("/panchang")
async def panchang(
    date_: date | None = Query(default=None, alias="date"),
    lat: float = Query(default=28.6139, ge=-90, le=90),
    lng: float = Query(default=77.2090, ge=-180, le=180),
    tz: str = Query(default="Asia/Kolkata"),
):
    """Udaya panchang for a date and place (defaults: today, New Delhi)."""
    try:
        zone = ZoneInfo(tz)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"unknown timezone: {tz}") from exc
    day = date_ or datetime.now(zone).date()
    from app.services.panchang import panchang_for

    try:
        return await asyncio.to_thread(panchang_for, day, lat, lng, tz)
    except ImportError as exc:  # swisseph is loaded lazily
        raise HTTPException(status_code=503, detail=f"ephemeris unavailable: {exc}") from exc


@router.get("/panchang/week")
async def panchang_week(
    start: date | None = Query(default=None),
    lat: float = Query(default=28.6139, ge=-90, le=90),
    lng: float = Query(default=77.2090, ge=-180, le=180),
    tz: str = Query(default="Asia/Kolkata"),
):
    """7-day panchang digest with recurring vrat/observances (AMX-121)."""
    try:
        zone = ZoneInfo(tz)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"unknown timezone: {tz}") from exc
    day = start or datetime.now(zone).date()
    from app.services.digest import week_digest

    try:
        return await asyncio.to_thread(week_digest, day, lat, lng, tz)
    except ImportError as exc:
        raise HTTPException(status_code=503, detail=f"ephemeris unavailable: {exc}") from exc
