# Phase 1: PostgreSQL Persistence Layer — Implementation Guide

This guide walks you through replacing the in-memory dictionary storage with PostgreSQL using SQLAlchemy ORM and Alembic migrations.

---

## Prerequisites

1. Install PostgreSQL locally (or use Docker: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nn_playground postgres:16`)
2. Have your virtual environment activated

---

## Step 1: Update Dependencies

**File:** `requirements.txt`

Add these two lines (anywhere in the file):
```
psycopg2-binary==2.9.9
alembic==1.13.1
```

Then install:
```bash
pip install -r requirements.txt
```

---

## Step 2: Update Config to Support PostgreSQL URL

**File:** `src/backend/api/core/config.py`

Change the `DATABASE_URL` default from SQLite to PostgreSQL format, but keep it configurable via `.env`:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "FastAPI App"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/nn_playground"

    class Config:
        env_file = ".env"

settings = Settings()
```

> You can still override this with `DATABASE_URL=sqlite:///./data.db` in your `.env` for local SQLite dev if you want.

---

## Step 3: Create the Database Module

**New file:** `src/backend/database.py`

This module sets up the SQLAlchemy engine, session factory, and provides a FastAPI dependency.

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.api.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    # pool_pre_ping keeps connections healthy
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and auto-closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### What each piece does:
- **`engine`** — the connection pool to PostgreSQL. `pool_pre_ping=True` tests connections before using them (handles DB restarts gracefully).
- **`SessionLocal`** — a factory that creates new database sessions. Each session is a "unit of work" — you make queries, then commit or rollback.
- **`Base`** — the base class all your ORM models will inherit from. It provides the `__tablename__` and column mapping magic.
- **`get_db()`** — a FastAPI dependency. When a route declares `db: Session = Depends(get_db)`, FastAPI calls this function, gives the route a session, and auto-closes it when the request finishes (even if there's an error).

---

## Step 4: Create ORM Models

**New file:** `src/backend/db_models.py`

These classes define your database tables. Each class = one table. Each attribute = one column.

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship

from backend.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class ModelConfigDB(Base):
    __tablename__ = "model_configs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    dataset_id = Column(String, nullable=False)
    description = Column(String(500), nullable=True)
    layers = Column(JSON, nullable=False)       # stored as a JSON array of layer dicts
    status = Column(String(20), nullable=False, default="created")
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)

    # One model can have many training sessions
    training_sessions = relationship("TrainingSessionDB", back_populates="model")


class TrainingSessionDB(Base):
    __tablename__ = "training_sessions"

    session_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, ForeignKey("model_configs.id"), nullable=True)
    dataset_id = Column(String, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    total_epochs = Column(Integer, nullable=False, default=0)
    current_epoch = Column(Integer, nullable=False, default=0)
    start_time = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    end_time = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    model = relationship("ModelConfigDB", back_populates="training_sessions")
    metrics = relationship("TrainingMetricDB", back_populates="session", order_by="TrainingMetricDB.epoch")


class TrainingMetricDB(Base):
    __tablename__ = "training_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("training_sessions.session_id"), nullable=False)
    epoch = Column(Integer, nullable=False)
    loss = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=_utcnow)

    session = relationship("TrainingSessionDB", back_populates="metrics")
```

### Key design decisions to understand:

- **`layers = Column(JSON)`** — Layers are stored as a JSON array (e.g. `[{"type": "input", "neurons": 784, ...}, ...]`). We don't normalize them into a separate table because they're always read/written as a whole list.

- **`relationship()`** — These set up Python-level links between objects. When you load a `TrainingSessionDB`, you can access `session.metrics` and SQLAlchemy will automatically query the `training_metrics` table for you.

- **`ForeignKey("model_configs.id")`** — This tells the DB that `model_id` in `training_sessions` must reference a valid row in `model_configs`. The FK on `model_id` is `nullable=True` because "new" models (ad-hoc training without saving a model config) won't have a corresponding `model_configs` row.

- **`default=lambda: str(uuid.uuid4())`** — Auto-generates a UUID when you create a new row without specifying an ID.

---

## Step 5: Set Up Alembic

Run from the project root (`Neural-Network-Playground/`):

```bash
alembic init alembic
```

This creates:
- `alembic.ini` — main config file
- `alembic/` — directory with `env.py` and a `versions/` folder for migration scripts

### 5a: Edit `alembic.ini`

Find this line:
```
sqlalchemy.url = driver://user:pass@localhost/dbname
```

Replace it with:
```
sqlalchemy.url = postgresql://postgres:postgres@localhost:5432/nn_playground
```

> Alternatively, you can leave this blank and configure it dynamically in `env.py` (see next step). Dynamic is better because it reads from your `.env` file and avoids duplicating the URL.

### 5b: Edit `alembic/env.py`

You need to make two changes:

**Change 1:** Import your `Base` and models so Alembic knows about your tables.

Near the top of the file, after the existing imports, add:
```python
from backend.database import Base
from backend.db_models import ModelConfigDB, TrainingSessionDB, TrainingMetricDB
```

**Change 2:** Set `target_metadata` so Alembic can autogenerate migrations.

Find this line:
```python
target_metadata = None
```

Replace with:
```python
target_metadata = Base.metadata
```

**(Optional) Change 3:** Read DATABASE_URL from your app config instead of `alembic.ini`.

In the `run_migrations_online()` function, replace the `connectable` creation with:
```python
from backend.api.core.config import settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
```

> For this to work, you need `PYTHONPATH=src` set when running Alembic commands. On Windows PowerShell: `$env:PYTHONPATH='src'`

### 5c: Generate the Initial Migration

```bash
# Linux/macOS
PYTHONPATH=src alembic revision --autogenerate -m "create initial tables"

# Windows PowerShell
$env:PYTHONPATH='src'; alembic revision --autogenerate -m "create initial tables"
```

This will create a file in `alembic/versions/` like `xxxx_create_initial_tables.py`. Open it and verify it has `create_table` operations for `model_configs`, `training_sessions`, and `training_metrics`.

### 5d: Run the Migration

```bash
# Linux/macOS
PYTHONPATH=src alembic upgrade head

# Windows PowerShell
$env:PYTHONPATH='src'; alembic upgrade head
```

This creates the actual tables in your PostgreSQL database.

### How to verify:
Connect to your database and check:
```bash
psql -U postgres -d nn_playground -c "\dt"
```
You should see three tables plus `alembic_version`.

---

## Step 6: Update Model Routes to Use DB

**File:** `src/backend/api/routes/models.py`

This is where you replace `MODEL_STORE` (the in-memory dict) with actual DB queries.

### What to change:

**6a: Add imports**

Add these at the top:
```python
from fastapi import Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.db_models import ModelConfigDB
```

**6b: Remove the in-memory store**

Delete this line:
```python
MODEL_STORE: Dict[str, "ModelResponse"] = {}
```

**6c: Update `create_model()` — line 188**

Currently it does:
```python
MODEL_STORE[model_id] = record
return record
```

Replace with DB logic. The function needs a `db` parameter:
```python
@router.post("", response_model=ModelResponse, status_code=201)
def create_model(config: ModelCreateRequest, db: Session = Depends(get_db)) -> ModelResponse:
    _ensure_dataset_exists(config.dataset_id)
    validated_layers = _validate_layers(config.layers)
    model_id = str(uuid4())
    name = config.name or f"{config.dataset_id}_model"

    # Create DB row
    db_model = ModelConfigDB(
        id=model_id,
        name=name,
        dataset_id=config.dataset_id,
        description=config.description,
        layers=[layer.model_dump() for layer in validated_layers],  # serialize to JSON
        status="created",
    )
    db.add(db_model)
    db.commit()
    db.refresh(db_model)  # reload to get the created_at timestamp from the DB

    # Convert DB row to Pydantic response
    return ModelResponse(
        id=db_model.id,
        name=db_model.name,
        dataset_id=db_model.dataset_id,
        description=db_model.description,
        layers=validated_layers,
        created_at=db_model.created_at,
        status=db_model.status,
    )
```

The key change: instead of storing a Pydantic model in a dict, you create a SQLAlchemy ORM object, add it to the session, and commit. `db.refresh()` reloads the row from the DB so auto-generated fields (like `created_at`) are populated.

**6d: Update `get_model()` — line 201**

```python
@router.get("/{model_id}", response_model=ModelResponse)
def get_model(model_id: str, db: Session = Depends(get_db)) -> ModelResponse:
    db_model = db.query(ModelConfigDB).filter(ModelConfigDB.id == model_id).first()
    if db_model is None:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found")

    return ModelResponse(
        id=db_model.id,
        name=db_model.name,
        dataset_id=db_model.dataset_id,
        description=db_model.description,
        layers=[LayerConfig(**layer) for layer in db_model.layers],  # deserialize from JSON
        created_at=db_model.created_at,
        status=db_model.status,
    )
```

**6e: Update `clear_model_store()`**

This is used by tests. Update it to work with a DB session:
```python
def clear_model_store(db: Session) -> None:
    """Helper used by tests to start from a clean DB."""
    db.query(ModelConfigDB).delete()
    db.commit()
```

**6f: Remove `_build_model_record()`**

The helper function `_build_model_record()` (line 170) is no longer needed since you're building the `ModelConfigDB` object directly. You can delete it.

---

## Step 7: Update Training Routes to Use DB

**File:** `src/backend/api/routes/training.py`

This is the most complex change. The key insight:

> **Live training state (`TrainingEngine`, `Future`, `ThreadPoolExecutor`) MUST stay in-memory.** You cannot serialize a running Python thread into a database. What goes to the DB is the *metadata* (session status, epoch counts, timestamps) and *metrics* (loss/accuracy per epoch).

### 7a: Add imports

```python
from fastapi import Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.db_models import ModelConfigDB, TrainingSessionDB, TrainingMetricDB
```

### 7b: Update `ModelRegistry`

The `ModelRegistry` class (line 60) currently stores model definitions in a `_models` dict. Replace it to look up models from the DB.

The tricky part: `ModelRegistry` is not a route — it's a plain class, so it doesn't have access to FastAPI's `Depends(get_db)`. You have two options:

**Option A (simpler):** Pass a `db` session into `ModelRegistry.get()` from the route that calls it:
```python
class ModelRegistry:
    def get(self, model_id: str, db: Session) -> ModelDefinition:
        db_model = db.query(ModelConfigDB).filter(ModelConfigDB.id == model_id).first()
        if db_model is None:
            raise ModelNotFoundError(model_id)
        layers = [LayerConfig(**layer) for layer in db_model.layers]
        return ModelDefinition(model_id=db_model.id, dataset_id=db_model.dataset_id, layers=layers)

    def seed_from_templates(self, db: Session) -> None:
        from backend.api import templates as template_data
        for template in template_data.list_all_templates():
            existing = db.query(ModelConfigDB).filter(ModelConfigDB.id == template["id"]).first()
            if existing:
                continue
            db_model = ModelConfigDB(
                id=template["id"],
                name=template.get("name", template["id"]),
                dataset_id=template["dataset_id"],
                layers=template["layers"],
                status="template",
            )
            db.add(db_model)
        db.commit()
```

Then update `start_training_endpoint()` (line 283) to pass `db` when calling `_model_registry.get(model_id, db)`.

**Option B:** Create a new DB session inside `ModelRegistry` using `SessionLocal()` directly. This avoids changing function signatures but is less clean:
```python
from backend.database import SessionLocal

class ModelRegistry:
    def get(self, model_id: str) -> ModelDefinition:
        db = SessionLocal()
        try:
            db_model = db.query(ModelConfigDB).filter(ModelConfigDB.id == model_id).first()
            if db_model is None:
                raise ModelNotFoundError(model_id)
            layers = [LayerConfig(**layer) for layer in db_model.layers]
            return ModelDefinition(model_id=db_model.id, dataset_id=db_model.dataset_id, layers=layers)
        finally:
            db.close()
```

**I recommend Option A** — it's more explicit and follows FastAPI conventions.

### 7c: Update `TrainingSessionManager`

Currently, `TrainingSessionManager` stores three things in memory:
1. `_sessions: Dict[str, TrainingSession]` — session metadata
2. `_jobs: Dict[str, TrainingJob]` — live engine + future references
3. `_model_sessions: Dict[str, str]` — which model has an active session

**What changes:**
- `_sessions` → goes to DB (`training_sessions` table)
- `_jobs` → **stays in-memory** (can't serialize engines/futures)
- `_model_sessions` → **stays in-memory** (runtime lock tracking)

Here's the approach for `start_training()`:

```python
def start_training(self, model_id, dataset_id, layers, *, db: Session, **kwargs) -> TrainingSession:
    # ... existing lock check for _model_sessions stays the same ...

    # ... existing engine creation stays the same ...

    future = self._executor.submit(engine.train, model_id)
    session = _wait_for_session_initialization(engine)

    # Persist session to DB
    db_session = TrainingSessionDB(
        session_id=session.session_id,
        model_id=model_id,
        dataset_id=dataset_id,
        status=session.status,
        total_epochs=session.total_epochs,
        current_epoch=session.current_epoch,
        start_time=session.start_time,
    )
    db.add(db_session)
    db.commit()

    # Keep job in memory (engine + future can't go to DB)
    with self._lock:
        self._jobs[session.session_id] = TrainingJob(...)
        self._model_sessions[model_id] = session.session_id

    # When training finishes, persist final metrics to DB
    future.add_done_callback(
        lambda _: self._on_training_complete(session.session_id, engine)
    )

    return session
```

**The callback** — when training finishes, flush all metrics to the DB:

```python
def _on_training_complete(self, session_id: str, engine: TrainingEngine):
    """Called when the training future completes. Persists final state to DB."""
    db = SessionLocal()  # Need our own session since we're in a thread callback
    try:
        db_session = db.query(TrainingSessionDB).filter(
            TrainingSessionDB.session_id == session_id
        ).first()
        if db_session and engine.session:
            db_session.status = engine.session.status
            db_session.current_epoch = engine.session.current_epoch
            db_session.end_time = engine.session.end_time
            db_session.error_message = engine.session.error_message

            # Persist all metrics
            for metric in engine.session.metrics:
                db_metric = TrainingMetricDB(
                    session_id=session_id,
                    epoch=metric.epoch,
                    loss=metric.loss,
                    accuracy=metric.accuracy,
                    timestamp=metric.timestamp,
                )
                db.add(db_metric)
            db.commit()
    finally:
        db.close()

    # Clean up in-memory references
    self._mark_model_idle(...)
```

> **Why a new `SessionLocal()` in the callback?** The callback runs in a background thread after the HTTP request is long gone. The original `db` session from the route is already closed. Thread callbacks need their own DB session.

### 7d: Update `get_session()` and `get_job()`

For **active** training sessions, the live `engine.session` Pydantic object has the most up-to-date metrics (updated every epoch in real-time). For **completed** sessions, the data is in the DB.

```python
def get_session(self, session_id: str, db: Session) -> TrainingSession:
    # First check if there's a live job with real-time data
    with self._lock:
        job = self._jobs.get(session_id)
    if job and job.engine.session:
        return job.engine.session  # live, in-memory, most up-to-date

    # Fall back to DB for completed/historical sessions
    db_session = db.query(TrainingSessionDB).filter(
        TrainingSessionDB.session_id == session_id
    ).first()
    if db_session is None:
        raise SessionNotFoundError(session_id)

    # Reconstruct the Pydantic TrainingSession from DB
    db_metrics = db.query(TrainingMetricDB).filter(
        TrainingMetricDB.session_id == session_id
    ).order_by(TrainingMetricDB.epoch).all()

    metrics = [
        TrainingMetric(epoch=m.epoch, loss=m.loss, accuracy=m.accuracy, timestamp=m.timestamp)
        for m in db_metrics
    ]

    return TrainingSession(
        session_id=db_session.session_id,
        model_id=db_session.model_id,
        dataset_id=db_session.dataset_id,
        status=db_session.status,
        start_time=db_session.start_time,
        end_time=db_session.end_time,
        total_epochs=db_session.total_epochs,
        current_epoch=db_session.current_epoch,
        metrics=metrics,
        error_message=db_session.error_message,
    )
```

### 7e: Update the route functions

Every route that calls `_session_manager` or `_model_registry` needs `db: Session = Depends(get_db)` added as a parameter, and then pass `db` through to the manager methods.

For example, `start_training_endpoint` (line 283):
```python
async def start_training_endpoint(
    model_id: str,
    payload: TrainingStartRequest,
    db: Session = Depends(get_db),   # <-- add this
) -> TrainingStartResponse:
```

Then pass `db=db` when calling `_model_registry.get(model_id, db)` and `_session_manager.start_training(..., db=db)`.

Do the same for:
- `get_training_status_endpoint` (line 347) — pass `db` to `_session_manager.get_session()`
- `predict_endpoint` (line 381)
- `stop_training_endpoint` (line 436)
- `pause_training_endpoint` (line 464)
- `resume_training_endpoint` (line 485)

### 7f: Update template seeding

Currently at line 264-265:
```python
_model_registry = ModelRegistry()
_model_registry.seed_from_templates()
```

This runs at import time, before the app starts. With DB-backed templates, you need to move seeding to a FastAPI startup event. See Step 8.

**Delete or comment out** `_model_registry.seed_from_templates()` from this file.

---

## Step 8: Add DB Initialization to App Startup

**File:** `src/backend/api/main.py`

Add a startup event to seed templates and (optionally) create tables:

```python
from fastapi import FastAPI
from .routes.health import router as health_router
from .routes.datasets import router as datasets_router
from .routes.training import router as training_router
from .core.utils.error_handler import http_error_handler
from .core.config import settings
from .core.cors import init_cors
from backend.database import SessionLocal, engine, Base

app = FastAPI(title=settings.APP_NAME)

init_cors(app)

app.include_router(health_router)
app.include_router(datasets_router)
app.include_router(training_router)
app.add_exception_handler(Exception, http_error_handler)


@app.on_event("startup")
def on_startup():
    # Create tables if they don't exist (safe to call repeatedly)
    # In production, Alembic migrations handle this instead
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
```

> **Note:** `Base.metadata.create_all()` is idempotent — it only creates tables that don't exist. In production you'll use `alembic upgrade head` instead, but this is a nice safety net during development.

---

## Step 9: Update .env_example

**File:** `src/backend/api/.env_example`

```
APP_NAME=Neural Network Playground
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nn_playground
```

---

## Step 10: Verify Everything Works

### 10a: Create your local database
```bash
# If using a local PostgreSQL installation
psql -U postgres -c "CREATE DATABASE nn_playground;"

# If using Docker (the container from Prerequisites already has it)
```

### 10b: Run the migration
```bash
# Windows PowerShell
$env:PYTHONPATH='src'; alembic upgrade head

# Linux/macOS
PYTHONPATH=src alembic upgrade head
```

### 10c: Start the backend
```bash
# Windows PowerShell
$env:PYTHONPATH='src'; python -m uvicorn src.backend.api.main:app --reload --port 8000

# Linux/macOS
PYTHONPATH=src uvicorn src.backend.api.main:app --reload --port 8000
```

### 10d: Test the API
```bash
# Health check
curl http://localhost:8000/api/health

# Create a model
curl -X POST http://localhost:8000/api/models \
  -H "Content-Type: application/json" \
  -d '{"dataset_id": "iris", "layers": [{"type": "input", "neurons": 4, "activation": null, "position": 0}, {"type": "hidden", "neurons": 8, "activation": "relu", "position": 1}, {"type": "output", "neurons": 3, "activation": "softmax", "position": 2}]}'

# Check it persists — restart the server, then fetch the model by ID
curl http://localhost:8000/api/models/<id-from-above>
```

The persistence test: **restart the server and fetch the model again.** If it returns the model, your DB layer is working. With the old in-memory store, it would have returned 404.

### 10e: Run existing tests
```bash
# Windows PowerShell
$env:PYTHONPATH='src'; pytest

# Linux/macOS
PYTHONPATH=src pytest
```

> **Expect some test failures.** Tests that use `clear_model_store()` or directly access `MODEL_STORE` will need updates. The test files call routes via `TestClient`, and the DB dependency (`get_db`) needs to be overridden in tests to use a test database or SQLite. A common pattern:
>
> ```python
> from backend.database import Base, get_db
> from sqlalchemy import create_engine
> from sqlalchemy.orm import sessionmaker
>
> # Use an in-memory SQLite for tests
> TEST_ENGINE = create_engine("sqlite:///:memory:")
> TestSession = sessionmaker(bind=TEST_ENGINE)
> Base.metadata.create_all(bind=TEST_ENGINE)
>
> def override_get_db():
>     db = TestSession()
>     try:
>         yield db
>     finally:
>         db.close()
>
> app.dependency_overrides[get_db] = override_get_db
> ```

---

## Common Pitfalls

1. **Forgetting `PYTHONPATH=src`** — Alembic and Uvicorn both need this so `from backend.xxx` imports work.

2. **JSON column with SQLite** — If you test with SQLite locally, `JSON` columns work but store as text. PostgreSQL has native `JSONB`. Both work with SQLAlchemy's `JSON` type.

3. **Forgetting `db.commit()`** — SQLAlchemy doesn't auto-commit. If you `db.add()` but don't `db.commit()`, nothing gets saved. If you `db.query()` and modify an attribute, you still need `db.commit()`.

4. **Using the wrong session in threads** — The `db` from `Depends(get_db)` is scoped to the HTTP request. Background threads (like the training callback) need their own `SessionLocal()`. Never share a session across threads.

5. **Circular imports** — `database.py` imports from `config.py`. `db_models.py` imports from `database.py`. Route files import from `db_models.py`. Keep this import chain one-directional to avoid circular dependency errors.

6. **Alembic not detecting models** — The autogenerate only finds models that are imported in `alembic/env.py`. Make sure you import all three model classes there, not just `Base`.

---

## File Checklist

| # | Action | File |
|---|--------|------|
| 1 | Edit | `requirements.txt` — add psycopg2-binary, alembic |
| 2 | Edit | `src/backend/api/core/config.py` — update DATABASE_URL default |
| 3 | Create | `src/backend/database.py` — engine, session, Base, get_db |
| 4 | Create | `src/backend/db_models.py` — three ORM table classes |
| 5 | Run | `alembic init alembic` — scaffold migrations |
| 6 | Edit | `alembic.ini` — set sqlalchemy.url |
| 7 | Edit | `alembic/env.py` — import Base + models, set target_metadata |
| 8 | Run | `alembic revision --autogenerate` — generate initial migration |
| 9 | Run | `alembic upgrade head` — create tables |
| 10 | Edit | `src/backend/api/routes/models.py` — replace MODEL_STORE with DB queries |
| 11 | Edit | `src/backend/api/routes/training.py` — persist sessions/metrics, keep jobs in-memory |
| 12 | Edit | `src/backend/api/main.py` — add startup event for DB init + template seeding |
| 13 | Edit | `src/backend/api/.env_example` — update with PostgreSQL example |
| 14 | Run | Tests — update test fixtures to override `get_db` |
