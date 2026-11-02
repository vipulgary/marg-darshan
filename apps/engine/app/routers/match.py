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
    # AMX-206: when a birth time is unknown, tob is ignored and the whole day is considered.
    boy_time_known: bool = True
    girl_time_known: bool = True


def _moon_options(b: BirthData) -> list[dict]:
    """Every Moon nakshatra/sign the person could have had on that date (sampled every 30 min),
    with the share of the day each covers. One option means the time doesn't matter for gunas."""
    from datetime import datetime, time, timedelta
    from zoneinfo import ZoneInfo

    from app.services import chart as chart_mod
    from app.services.astro_constants import NAKSHATRAS_EN, NAKSHATRAS_HI, SIGNS_EN, SIGNS_HI, datetime_to_jd

    tz = ZoneInfo(b.tz_name)
    start = datetime.combine(b.dob, time(0, 0), tzinfo=tz)
    groups: dict[tuple[int, int], list[float]] = {}
    for i in range(48):
        lon, _ = chart_mod.sidereal_longitude(datetime_to_jd(start + timedelta(minutes=30 * i)), chart_mod.swe.MOON)
        nak = int(lon // (360 / 27)) + 1
        sign = int(lon // 30) + 1
        groups.setdefault((nak, sign), []).append(lon)
    out = []
    for (nak, sign), lons in groups.items():
        lon = sorted(lons)[len(lons) // 2]
        out.append({"nakshatra": nak, "sign": sign, "moon_lon": lon, "pada": int((lon % (360 / 27)) // (360 / 108)) + 1,
                    "share": len(lons) / 48,
                    "nakshatra_en": NAKSHATRAS_EN[nak - 1], "nakshatra_hi": NAKSHATRAS_HI[nak - 1],
                    "rashi_en": SIGNS_EN[sign - 1], "rashi_hi": SIGNS_HI[sign - 1]})
    return sorted(out, key=lambda o: -o["share"])


def _person(b: BirthData) -> dict:
    from app.services.analysis import compute_core

    chart = compute_core(b.dob, b.tob, b.tz_name, b.latitude, b.longitude, sade_sati=False)
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
    boy_opts = await asyncio.to_thread(_moon_options, body.boy) if not body.boy_time_known else None
    girl_opts = await asyncio.to_thread(_moon_options, body.girl) if not body.girl_time_known else None
    fields = ("nakshatra", "sign", "moon_lon", "pada", "nakshatra_en", "nakshatra_hi", "rashi_en", "rashi_hi")
    if boy_opts:
        boy.update({k: boy_opts[0][k] for k in fields}, time_known=False, manglik=None)
    if girl_opts:
        girl.update({k: girl_opts[0][k] for k in fields}, time_known=False, manglik=None)

    result = guna_milan(boy, girl)
    certainty = None
    if boy_opts or girl_opts:
        combos = []
        for bo in boy_opts or [{**boy, "share": 1.0}]:
            for go in girl_opts or [{**girl, "share": 1.0}]:
                r = guna_milan(bo, go)
                combos.append({"total": r["total"], "weight": round(bo["share"] * go["share"], 3), "koots": {k["key"]: k["score"] for k in r["koots"]},
                               "boy_nakshatra_en": bo["nakshatra_en"], "boy_nakshatra_hi": bo["nakshatra_hi"],
                               "girl_nakshatra_en": go["nakshatra_en"], "girl_nakshatra_hi": go["nakshatra_hi"]})
        totals = [c["total"] for c in combos]
        keys = combos[0]["koots"].keys()
        certainty = {
            "min": min(totals), "max": max(totals), "likely": result["total"],
            "exact": min(totals) == max(totals),
            "uncertain_koots": [k for k in keys if len({c["koots"][k] for c in combos}) > 1],
            "options": sorted(combos, key=lambda c: -c["weight"]),
        }
    # A workable match (18+ of 36) also gets the next marriage muhurats, at the bride's birthplace.
    muhurats = []
    if result["total"] >= 18:
        from app.services.vivah import find

        g = body.girl
        muhurats = await asyncio.to_thread(find, boy["sign"], girl["sign"], g.latitude, g.longitude, g.tz_name)
    manglik = manglik_match(bool(boy["manglik"]), bool(girl["manglik"])) if boy["manglik"] is not None and girl["manglik"] is not None else "unknown"
    return {**result, "boy": boy, "girl": girl, "manglik": manglik, "vivah_muhurats": muhurats, "certainty": certainty}
