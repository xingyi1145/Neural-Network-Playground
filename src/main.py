"""
Main FastAPI application for Neural Network Playground.

Provides REST API for:
- Dataset browsing and preview
- Pre-built neural network templates

Assumes teammates have created:
- backend.datasets (dataset registry and loaders)
- Pydantic models for API schemas
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import API routes
from backend.api.routes import datasets, models, templates, training

# Create FastAPI app
app = FastAPI(
    title="Neural Network Playground API",
    description="REST API for dataset management and neural network templates",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # React dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(datasets.router)
app.include_router(templates.router)
app.include_router(models.router)
app.include_router(training.router)


@app.get("/")
def root():
    """Root endpoint - API information."""
    return {
        "message": "Neural Network Playground API",
        "docs": "/docs",
        "endpoints": {
            "datasets": "/api/datasets",
            "templates": "/api/templates",
            "models": "/api/models",
            "training": "/api/training"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
