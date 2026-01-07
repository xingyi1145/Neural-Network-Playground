from fastapi import FastAPI
from .routes.health import router as health_router
from .routes.datasets import router as datasets_router
from .routes.training import router as training_router
from .core.utils.error_handler import http_error_handler
from .core.config import settings
from .core.cors import init_cors

app = FastAPI(title=settings.APP_NAME)

init_cors(app)

app.include_router(health_router)
app.include_router(datasets_router)
app.include_router(training_router)
app.add_exception_handler(Exception, http_error_handler)

@app.get("/")
def root():
    return {"message": "API running"}

