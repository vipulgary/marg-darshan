import hmac

from fastapi import Header, HTTPException

from app.config import ENGINE_KEY


async def require_engine_key(x_engine_key: str = Header(default="")) -> None:
    """Server-to-server auth: the web app sends the shared secret in X-Engine-Key."""
    if not hmac.compare_digest(x_engine_key, ENGINE_KEY):
        raise HTTPException(status_code=401, detail="invalid engine key")
