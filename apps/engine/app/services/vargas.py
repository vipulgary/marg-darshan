"""Divisional charts D2–D60, Balas and Ashtakavarga via jyotishyamitra (AMX-043).

jyotishyamitra keeps its input and results in module-level globals, so each
call runs in a separate worker process that handles one request at a time.
"""
import asyncio
import json
from concurrent.futures import ProcessPoolExecutor
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from app.models.schemas import BirthData

VARGA_KEYS = ["D1", "D2", "D3", "D4", "D7", "D9", "D10", "D12", "D16", "D20",
              "D24", "D27", "D30", "D40", "D45", "D60"]

_pool: ProcessPoolExecutor | None = None


def _get_pool() -> ProcessPoolExecutor:
    global _pool
    if _pool is None:
        _pool = ProcessPoolExecutor(max_workers=2, max_tasks_per_child=200)
    return _pool


def local_input(b: BirthData) -> dict:
    """jyotishyamitra only accepts UTC offsets in 0.5h steps. For historic offsets such as
    Bombay Time (+5:21) we keep the same UTC moment and re-express it at the nearest 0.5h offset."""
    local = datetime.combine(b.dob, b.tob, tzinfo=ZoneInfo(b.tz_name))
    utc = local.astimezone(timezone.utc)
    offset = round(local.utcoffset().total_seconds() / 3600 * 2) / 2
    wall = utc + timedelta(hours=offset)
    return {
        "name": b.name, "gender": b.gender, "place": b.place_name or "unknown",
        "longitude": b.longitude, "lattitude": b.latitude, "timezone": offset,
        "year": wall.year, "month": wall.month, "day": wall.day,
        "hour": wall.hour, "min": wall.minute, "sec": wall.second,
    }


def _run(params: dict) -> dict:
    import jyotishyamitra as jm  # imported inside the worker process on purpose

    jm.input_birthdata(**{k: str(v) for k, v in params.items()})
    status = jm.validate_birthdata()
    if status != "SUCCESS":
        raise ValueError(status)
    data = jm.generate_astrologicalData(jm.get_birthdata(), returnval="ASTRODATA_DICTIONARY")
    # Deep copy into plain JSON types before the next request resets the globals.
    data = json.loads(json.dumps(data, default=str))
    return {
        "charts": {k: data[k] for k in VARGA_KEYS if k in data},
        "balas": data.get("Balas", {}),
        "ashtakavarga": data.get("AshtakaVarga", {}),
    }


async def compute(b: BirthData) -> dict:
    try:
        result = await asyncio.get_running_loop().run_in_executor(_get_pool(), _run, local_input(b))
        return {"status": "ok", **result}
    except Exception as exc:  # the core chart is still useful without vargas
        return {"status": "unavailable", "reason": f"{type(exc).__name__}: {exc}"}
