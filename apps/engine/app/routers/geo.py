from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import GeoResolveRequest, GeoResolveResponse, Place
from app.services import geo

router = APIRouter(prefix="/geo", tags=["geo"])


@router.get("/search", response_model=list[Place])
def search(q: str = Query(min_length=2, max_length=120)):
    try:
        return geo.search(q.strip())
    except Exception as exc:  # geocoder outage should not 500 the form
        raise HTTPException(status_code=503, detail=f"geocoder unavailable: {exc}") from exc


@router.post("/resolve", response_model=GeoResolveResponse)
def resolve(body: GeoResolveRequest):
    hit = geo.resolve(body.place, body.latitude, body.longitude)
    if not hit:
        raise HTTPException(status_code=404, detail="place not found")
    offset = geo.utc_offset_hours(hit["tz_name"], body.on_date, body.at_time) if body.on_date else None
    return {**hit, "tz_offset_hours": offset}
