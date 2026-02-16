from fastapi import FastAPI

from backend.database import Base, SessionLocal, engine

from .core.config import settings
from .core.cors import init_cors
from .core.utils.error_handler import http_error_handler
from .routes.datasets import router as datasets_router
from .routes.health import router as health_router
from .routes.models import router as models_router
from .routes.training import router as training_router

app = FastAPI(title=settings.APP_NAME)

init_cors(app)

app.include_router(health_router)
app.include_router(datasets_router)
app.include_router(models_router)
app.include_router(training_router)
app.add_exception_handler(Exception, http_error_handler)


@app.on_event("startup")
def on_startup():
    # Create tables if they don't exist (safety net for dev; Alembic handles prod)
    Base.metadata.create_all(bind=engine)

    # Seed template models into the DB
    from .routes.training import _model_registry

    db = SessionLocal()
    try:
        _model_registry.seed_from_templates(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "API running"}
