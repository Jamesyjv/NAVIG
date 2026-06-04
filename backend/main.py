import uvicorn
import logging
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from backend.database import engine, Base
from backend.security import add_security

# ── Models (registers them with SQLAlchemy metadata) ───────────────────────
from backend.models.user import User
from backend.models.goal import Goal
from backend.models.roadmap import Roadmap, Milestone
from backend.models.mission import Mission
from backend.models.decision import Decision
from backend.models.progress import Progress

# ── Routers ────────────────────────────────────────────────────────────────
from backend.routers import auth, goals, roadmap, missions, progress, decision

# ── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ── Database init ──────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)
logger.info("Database tables verified / created.")

# ── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="NAVIG API",
    version="1.0.0",
    docs_url=None,     # disable Swagger UI in production; re-enable for dev
    redoc_url=None,
    openapi_url=None,  # hides schema from public; set to "/openapi.json" for dev
)

# Attach security middleware (CORS, rate-limit, headers, size guard)
add_security(app)

# ── Routes ─────────────────────────────────────────────────────────────────
app.include_router(auth.router,      prefix="", tags=["auth"])
app.include_router(goals.router,     prefix="", tags=["goals"])
app.include_router(roadmap.router,   prefix="", tags=["roadmap"])
app.include_router(missions.router,  prefix="", tags=["missions"])
app.include_router(progress.router,  prefix="", tags=["progress"])
app.include_router(decision.router,  prefix="", tags=["decision"])


@app.get("/health", include_in_schema=False)
def health_check():
    return {"status": "ok", "service": "navig-api"}


@app.get("/", include_in_schema=False)
def read_root():
    return {"message": "NAVIG API is online"}


# ── Global error handler ───────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again."},
    )


if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
