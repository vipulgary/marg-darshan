import asyncio
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.schemas import BirthData
from app.services.milan import guna_milan, manglik_match

router = APIRouter(prefix="/match", tags=["match"])


class MatchRequest(BaseModel):
    boy: BirthData
    girl: BirthData


def _person(b: BirthData) -> dict:
    from app.services.analysis import compute_core

    chart = compute_core(b.dob, b.tob, b.tz_name, b.latitude, b.longitude)
    moon = chart["planets"]["moon"]
    manglik = next((d for d in chart["yogas_doshas"]["doshas"] if d["key"] == "manglik"), None)
    return {
        "name": b.name,
        "nakshatra": moon["nakshatra"]["index"],
        "pada": moon["nakshatra"]["pada"],
        "sign": moon["sign"],
        "moon_lon": moon["longitude"],
        "nakshatra_en": moon["nakshatra"]["name_en"],
        "nakshatra_hi": moon["nakshatra"]["name_hi"],
        "rashi_en": chart["rashi"]["sign_en"],
        "rashi_hi": chart["rashi"]["sign_hi"],
        "lagna_en": chart["ascendant"]["sign_en"],
        "lagna_hi": chart["ascendant"]["sign_hi"],
        "manglik": bool(manglik and manglik["present"] and not manglik.get("cancelled")),
        "manglik_detail": manglik,
    }


@router.post("")
async def match(body: MatchRequest):
    for p in (body.boy, body.girl):
        try:
            ZoneInfo(p.tz_name)
        except (ZoneInfoNotFoundError, ValueError) as exc:
            raise HTTPException(status_code=422, detail=f"unknown timezone: {p.tz_name}") from exc
    try:
        boy, girl = await asyncio.gather(asyncio.to_thread(_person, body.boy), asyncio.to_thread(_person, body.girl))
    except ImportError as exc:
        raise HTTPException(status_code=503, detail=f"ephemeris unavailable: {exc}") from exc
    result = guna_milan(boy, girl)
    return {**result, "boy": boy, "girl": girl, "manglik": manglik_match(boy["manglik"], girl["manglik"])}
