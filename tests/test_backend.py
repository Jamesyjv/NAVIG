"""
Tests for NAVIG FastAPI backend.
Run tests using: pytest
"""
# ── Environment MUST be set before any backend module is imported ───────────
import os
os.environ["ENV"] = "test"                              # disables rate limiter
os.environ["SECRET_KEY"] = "ci-test-secret-navig-2024"
os.environ["DATABASE_URL"] = "sqlite:///./test_navig.db"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"
os.environ["ANTHROPIC_API_KEY"] = ""                   # uses mock fallbacks

import pytest  # type: ignore
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base, get_db
from backend.main import app

# ── In-memory SQLite DB for tests ──────────────────────────────────────────
_engine = create_engine(
    "sqlite:///./test_navig.db",
    connect_args={"check_same_thread": False},
)
_SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
Base.metadata.create_all(bind=_engine)


def _override_get_db():
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db
client = TestClient(app, raise_server_exceptions=True)


# ── Helpers ─────────────────────────────────────────────────────────────────
def _register(email: str, password: str = "TestPass1!", name: str = "Test User") -> None:
    client.post("/auth/register", json={"email": email, "name": name, "password": password})


def _login(email: str, password: str = "TestPass1!") -> str:
    resp = client.post(
        "/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


def _auth(email: str, password: str = "TestPass1!") -> str:
    """Register (idempotent) then login, return Bearer token."""
    _register(email, password)
    return _login(email, password)


# ── Health ──────────────────────────────────────────────────────────────────
def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ── Auth: register ──────────────────────────────────────────────────────────
def test_register_success():
    resp = client.post(
        "/auth/register",
        json={"email": "reg_new@example.com", "name": "New User", "password": "StrongPass1!"},
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == "reg_new@example.com"


def test_register_duplicate_email():
    email = "dup@example.com"
    client.post("/auth/register", json={"email": email, "name": "A", "password": "pass"})
    resp = client.post("/auth/register", json={"email": email, "name": "B", "password": "pass"})
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"]


# ── Auth: login ─────────────────────────────────────────────────────────────
def test_login_success():
    token = _auth("login_ok@example.com")
    assert token and len(token) > 10


def test_login_wrong_password():
    _register("wrongpw@example.com", "correct123")
    resp = client.post(
        "/auth/login",
        data={"username": "wrongpw@example.com", "password": "wrongpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 401


# ── Auth: /me ───────────────────────────────────────────────────────────────
def test_me_authenticated():
    token = _auth("me_auth@example.com")
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me_auth@example.com"


def test_me_unauthenticated():
    resp = client.get("/auth/me")
    assert resp.status_code == 401


# ── Goals ───────────────────────────────────────────────────────────────────
def test_create_goal():
    token = _auth("goal_create@example.com")
    resp = client.post(
        "/goals/",
        json={"title": "Learn Python"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Learn Python"


def test_get_active_goal():
    token = _auth("goal_active@example.com")
    client.post(
        "/goals/",
        json={"title": "My Active Goal"},
        headers={"Authorization": f"Bearer {token}"},
    )
    resp = client.get("/goals/active", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "My Active Goal"


# ── Security headers ────────────────────────────────────────────────────────
def test_security_headers():
    resp = client.get("/health")
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("x-frame-options") == "DENY"
    assert resp.headers.get("x-xss-protection") == "1; mode=block"


# ── Cleanup ─────────────────────────────────────────────────────────────────
@pytest.fixture(autouse=True, scope="session")
def cleanup_db():
    yield
    if os.path.exists("test_navig.db"):
        os.remove("test_navig.db")
