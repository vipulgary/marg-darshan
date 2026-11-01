from datetime import date, time
from typing import Literal

from pydantic import BaseModel, Field


class Place(BaseModel):
    place_name: str
    latitude: float
    longitude: float
    tz_name: str


class GeoResolveRequest(BaseModel):
    place: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    # When given, tz_offset is resolved for this local moment (handles historic offsets).
    on_date: date | None = None
    at_time: time | None = None


class GeoResolveResponse(Place):
    tz_offset_hours: float | None = None


class BirthData(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    gender: Literal["male", "female", "other"] = "other"
    dob: date
    tob: time
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    tz_name: str = Field(description="IANA timezone, e.g. Asia/Kolkata")
    place_name: str = ""
    lang: Literal["hi", "en"] = "hi"


class LifeEvent(BaseModel):
    type: str = Field(min_length=1, max_length=60)
    date: date
    note: str | None = Field(default=None, max_length=300)


class RectifyScanRequest(BaseModel):
    dob: date
    window_start: time
    window_end: time = Field(description="Not after window_start means the window crosses midnight")
    tz_name: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    life_events: list[LifeEvent] = Field(min_length=1, max_length=12)
    step_minutes: int = Field(default=1, ge=1, le=30)


class RectifyScanResponse(BaseModel):
    candidates: list[dict]
    segments: list[dict]
    step_minutes: int
    note_en: str
    note_hi: str
