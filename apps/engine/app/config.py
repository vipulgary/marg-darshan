import os
from pathlib import Path

ENGINE_KEY = os.getenv("ENGINE_KEY", "change-me-shared-hmac-secret")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
GEOCODER_USER_AGENT = os.getenv("GEOCODER_USER_AGENT", "astromax-geo/0.1")

# Swiss Ephemeris data files; filled by scripts/install_ephe.py. Without them
# pyswisseph falls back to the built-in Moshier ephemeris (~1 arcsec, still fine).
EPHE_PATH = Path(os.getenv("EPHE_PATH", Path(__file__).resolve().parent.parent / "ephe"))
