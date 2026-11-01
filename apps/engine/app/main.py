from fastapi import Depends, FastAPI

from app.config import EPHE_PATH
from app.routers import geo, horoscope, panchang, match
from app.security import require_engine_key

app = FastAPI(title="Astromax Astro Engine", version="0.2.0",
              license_info={"name": "AGPL-3.0-or-later"})


@app.get("/health")
def health():
    try:
        import swisseph as swe  # lazy so the API (and pure tests) load without it
        version = swe.version
    except ImportError:
        version = None
    ephe_files = sorted(p.name for p in EPHE_PATH.glob("*.se1")) if EPHE_PATH.exists() else []
    return {
        "status": "ok" if version else "degraded",
        "swisseph": version,
        "ephemeris": ("swiss" if ephe_files else "moshier-fallback") if version else "unavailable",
        "ephe_files": len(ephe_files),
    }


api_deps = [Depends(require_engine_key)]
app.include_router(geo.router, prefix="/api/v1", dependencies=api_deps)
app.include_router(horoscope.router, prefix="/api/v1", dependencies=api_deps)
app.include_router(panchang.router, prefix="/api/v1", dependencies=api_deps)
app.include_router(match.router, prefix="/api/v1", dependencies=api_deps)
