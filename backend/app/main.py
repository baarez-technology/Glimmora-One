from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .db import async_session_factory, engine
from .bootstrap import ensure_demo_catalog, ensure_superadmin
from .db import Base
from . import models  # noqa: F401  -- register models with Base.metadata
from .routers import (
    admin,
    ai as ai_router,
    applications,
    auth,
    content,
    dashboard,
    notifications,
    reflection,
    skg,
    support,
    users,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    # Idempotent — adds any missing tables. Safe to leave on for SQLite + Postgres.
    # Alembic still owns destructive / schema-altering migrations in prod.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with async_session_factory() as db:
        await ensure_superadmin(db)
        await ensure_demo_catalog(db)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Glimmora ONE API", version="0.4.0-mvp", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(Exception)
    async def _unhandled(_req: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "internal_error", "detail": str(exc)},
        )

    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(dashboard.router)
    app.include_router(content.router)
    app.include_router(ai_router.router)
    app.include_router(reflection.router)
    app.include_router(skg.router)
    app.include_router(notifications.router)
    app.include_router(applications.router)
    app.include_router(admin.router)
    app.include_router(support.router)

    uploads = Path(__file__).resolve().parents[1] / "uploads"
    uploads.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(uploads)), name="uploads")

    @app.get("/health")
    async def health():
        return {"status": "ok", "service": "glimmora-one", "ai_enabled": settings.ai_enabled}

    @app.get("/")
    async def root():
        return {"name": "Glimmora ONE API", "docs": "/docs"}

    return app


app = create_app()
