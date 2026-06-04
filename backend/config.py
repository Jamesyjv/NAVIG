"""
backend/config.py
Centralised configuration — reads from environment variables (.env file in dev).
All secret values are validated at startup so the server fails fast if misconfigured.
"""
import os
import secrets
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ── Core ───────────────────────────────────────────────────────────────────
ENV: str = os.getenv("ENV", "development")

# ── Database ──────────────────────────────────────────────────────────────
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./navig.db")

# ── Auth ──────────────────────────────────────────────────────────────────
_raw_secret = os.getenv("SECRET_KEY", "")
if not _raw_secret or _raw_secret.startswith("CHANGE_ME"):
    if ENV == "production":
        raise RuntimeError(
            "SECRET_KEY is not set or still using the placeholder. "
            "Generate one with: python3 -c \"import secrets; print(secrets.token_hex(64))\""
        )
    else:
        # Dev convenience: auto-generate an ephemeral secret (resets on restart)
        _raw_secret = secrets.token_hex(64)
        logger.warning("SECRET_KEY not set — using ephemeral secret for development. "
                       "Set SECRET_KEY in backend/.env for persistent sessions.")

SECRET_KEY: str = _raw_secret
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# ── AI ────────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

if not ANTHROPIC_API_KEY:
    logger.warning("ANTHROPIC_API_KEY not set — AI features will use mock fallbacks.")

# ── CORS ──────────────────────────────────────────────────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:19006,http://localhost:3000")
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]
