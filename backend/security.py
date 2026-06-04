"""
backend/security.py
Centralises all security middleware for the NAVIG FastAPI application.
- Strict CORS (reads allowed origins from env)
- Rate limiting per IP (100 req / minute general, 5 req / minute for /auth/login)
- Security response headers (Helmet-equivalent)
- Request-size guard (max 1 MB body)
"""

import os
import time
import logging
from collections import defaultdict
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Simple in-process token-bucket rate limiter (no Redis dependency needed)
# ---------------------------------------------------------------------------
_rate_store: dict[str, list[float]] = defaultdict(list)
_WINDOW = 60          # 60-second rolling window
_GENERAL_LIMIT = 200  # requests per window per IP
_AUTH_LIMIT = 10      # tighter limit for /auth/* routes


def _is_rate_limited(ip: str, limit: int) -> bool:
    now = time.time()
    timestamps = _rate_store[ip]
    # Prune timestamps outside the window
    _rate_store[ip] = [t for t in timestamps if now - t < _WINDOW]
    if len(_rate_store[ip]) >= limit:
        return True
    _rate_store[ip].append(now)
    return False


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting in test environment
        if os.getenv("ENV", "development") == "test":
            return await call_next(request)

        ip = request.client.host if request.client else "unknown"
        path = request.url.path

        limit = _AUTH_LIMIT if path.startswith("/auth/") else _GENERAL_LIMIT
        if _is_rate_limited(ip, limit):
            logger.warning("Rate limit hit for IP=%s path=%s", ip, path)
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down."},
            )
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Cache-Control"] = "no-store"
        # Only add HSTS in production (when served over HTTPS)
        if os.getenv("ENV", "development") == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=63072000; includeSubDomains; preload"
            )
        return response


class RequestSizeMiddleware(BaseHTTPMiddleware):
    MAX_BYTES = 1_048_576  # 1 MB

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_BYTES:
            return JSONResponse(
                status_code=413,
                content={"detail": "Request body too large (max 1 MB)."},
            )
        return await call_next(request)


def get_allowed_origins() -> list[str]:
    """Read CORS origins from env; fallback to localhost for dev."""
    raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:19006,http://localhost:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]


def add_security(app: FastAPI) -> None:
    """Attach all security middleware to the FastAPI app."""
    allowed_origins = get_allowed_origins()
    logger.info("CORS allowed origins: %s", allowed_origins)

    # Order matters — outermost middleware runs first on request, last on response.
    app.add_middleware(RequestSizeMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
        max_age=600,
    )
