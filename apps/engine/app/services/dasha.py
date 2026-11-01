"""Vimshottari mahadasha / antardasha math (pure, no swisseph)."""
from datetime import date, datetime, timedelta

from app.services.astro_constants import (
    DASHA_ORDER, DASHA_TOTAL_YEARS, DASHA_YEARS, NAK_SPAN, YEAR_DAYS,
)

_LORDS = [lord for lord, _ in DASHA_ORDER]


def vimshottari(moon_lon: float, birth_utc: datetime, cycles: int = 1) -> list[dict]:
    idx = int(moon_lon // NAK_SPAN)
    elapsed = (moon_lon % NAK_SPAN) / NAK_SPAN
    start_i = idx % 9
    first_years = DASHA_ORDER[start_i][1]
    # The first mahadasha began before birth by the elapsed fraction of its length.
    start = birth_utc - timedelta(days=elapsed * first_years * YEAR_DAYS)
    out = []
    for n in range(9 * cycles):
        lord, years = DASHA_ORDER[(start_i + n) % 9]
        end = start + timedelta(days=years * YEAR_DAYS)
        end_iso = end.date().isoformat()
        out.append({"lord": lord, "years": years, "start": start.date().isoformat(),
                    "end": end_iso, "antardashas": _sub_periods(lord, years, start, end_iso)})
        start = end
    return out


def _sub_periods(maha_lord: str, maha_years: float, start: datetime | date, end_iso: str) -> list[dict]:
    """Antardashas in Vimshottari order beginning with the mahadasha lord itself:
    sub_years = maha_years * lord_years / 120."""
    if not isinstance(start, datetime):
        start = datetime.combine(start, datetime.min.time())
    first = _LORDS.index(maha_lord)
    out = []
    cursor = start
    for n in range(9):
        lord = _LORDS[(first + n) % 9]
        sub_years = maha_years * DASHA_YEARS[lord] / DASHA_TOTAL_YEARS
        nxt = cursor + timedelta(days=sub_years * YEAR_DAYS)
        out.append({"lord": lord, "start": cursor.date().isoformat(), "end": nxt.date().isoformat()})
        cursor = nxt
    # Pin the last end to the mahadasha's own end so the sequence stays contiguous after rounding.
    out[-1]["end"] = end_iso
    return out


def antardashas(mahadasha: dict) -> list[dict]:
    """Antardashas ({lord, start, end}) for a mahadasha dict ({lord, start, end, years?})."""
    lord = mahadasha["lord"]
    years = mahadasha.get("years") or DASHA_YEARS[lord]
    start = date.fromisoformat(mahadasha["start"])
    return _sub_periods(lord, years, start, mahadasha["end"])


def _day(on) -> str:
    if isinstance(on, datetime):
        return on.date().isoformat()
    if isinstance(on, date):
        return on.isoformat()
    return str(on)[:10]


def running_dasha(dashas: list[dict], on) -> dict | None:
    day = _day(on)
    return next((d for d in dashas if d["start"] <= day < d["end"]), None)


def running_periods(dashas: list[dict], on) -> tuple[dict | None, dict | None]:
    """(mahadasha, antardasha) running on a date; antardashas are derived when missing."""
    maha = running_dasha(dashas, on)
    if maha is None:
        return None, None
    subs = maha.get("antardashas") or antardashas(maha)
    return maha, running_dasha(subs, on)
