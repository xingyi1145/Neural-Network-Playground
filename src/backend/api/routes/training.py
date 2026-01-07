from __future__ import annotations

import threading
import time
from concurrent.futures import Future, ThreadPoolExecutor
from dataclasses import dataclass
from types import MethodType
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, status

from backend.api.schemas.training import (
    LayerConfig,
    TrainingMetricPayload,
    TrainingStartRequest,
    TrainingStartResponse,
    TrainingStatusResponse,
)
from pydantic import BaseModel
from typing import Union

from backend.datasets import get_dataset


class PredictionRequest(BaseModel):
    inputs: list


class PredictionResponse(BaseModel):
    prediction: Union[int, float]
    probabilities: list = None
    confidence: float = None
from backend.training.engine import TrainingEngine
from backend.training.models import TrainingMetric, TrainingSession

router = APIRouter(prefix="/api", tags=["training"])

DEFAULT_POLL_INTERVAL = 1.0


class ModelAlreadyTrainingError(RuntimeError):
    """Raised when a model has an active training session."""


class ModelNotFoundError(KeyError):
    """Raised when no model metadata exists for the requested ID."""


class SessionNotFoundError(KeyError):
    """Raised when a session cannot be located."""


@dataclass
class ModelDefinition:
    model_id: str
    dataset_id: str
    layers: List[LayerConfig]


class ModelRegistry:
    def __init__(self) -> None:
        self._models: Dict[str, ModelDefinition] = {}
        self._lock = threading.Lock()

    def register(self, model_id: str, dataset_id: str, layers: List[LayerConfig]) -> None:
        normalized_layers = [layer if isinstance(layer, LayerConfig) else LayerConfig(**layer) for layer in layers]
        with self._lock:
            self._models[model_id] = ModelDefinition(
                model_id=model_id,
                dataset_id=dataset_id,
                layers=normalized_layers,
            )

    def get(self, model_id: str) -> ModelDefinition:
        with self._lock:
            definition = self._models.get(model_id)
        if definition is None:
            raise ModelNotFoundError(model_id)
        return definition

    def seed_from_templates(self) -> None:
        from backend.api import templates as template_data

        for template in template_data.list_all_templates():
            layers = [LayerConfig(**layer) for layer in template["layers"]]
            self.register(template["id"], template["dataset_id"], layers)

    def clear(self) -> None:
        with self._lock:
            self._models.clear()


@dataclass
class TrainingJob:
    model_id: str
    dataset_id: str
    engine: TrainingEngine
    future: Future


class TrainingSessionManager:
    def __init__(self, max_workers: int = 2) -> None:
        self._sessions: Dict[str, TrainingSession] = {}
        self._jobs: Dict[str, TrainingJob] = {}
        self._model_sessions: Dict[str, str] = {}
        self._lock = threading.Lock()
        self._executor = ThreadPoolExecutor(max_workers=max_workers)

    def start_training(
        self,
        model_id: str,
        dataset_id: str,
        layers: List[LayerConfig],
        *,
        max_samples: Optional[int] = None,
        epochs: Optional[int] = None,
        learning_rate: Optional[float] = None,
        batch_size: Optional[int] = None,
        optimizer: Optional[str] = None,
    ) -> TrainingSession:
        with self._lock:
            active_session = self._model_sessions.get(model_id)
            if active_session:
                session = self._sessions.get(active_session)
                if session and session.status == "running":
                    raise ModelAlreadyTrainingError(active_session)

        layer_payload = [layer.model_dump(exclude_none=True) for layer in layers]
        engine = TrainingEngine(
            dataset_id=dataset_id,
            model_config={"layers": layer_payload},
            epochs=epochs,
            learning_rate=learning_rate,
            batch_size=batch_size,
            optimizer=optimizer,
        )
        _inject_max_samples(engine, max_samples)

        future = self._executor.submit(engine.train, model_id)
        session = _wait_for_session_initialization(engine)

        with self._lock:
            self._sessions[session.session_id] = session
            self._jobs[session.session_id] = TrainingJob(
                model_id=model_id,
                dataset_id=dataset_id,
                engine=engine,
                future=future,
            )
            self._model_sessions[model_id] = session.session_id

        future.add_done_callback(lambda _: self._mark_model_idle(model_id, session.session_id))
        return session

    def _mark_model_idle(self, model_id: str, session_id: str) -> None:
        with self._lock:
            current = self._model_sessions.get(model_id)
            if current == session_id:
                self._model_sessions.pop(model_id, None)

    def get_session(self, session_id: str) -> TrainingSession:
        with self._lock:
            session = self._sessions.get(session_id)
        if session is None:
            raise SessionNotFoundError(session_id)
        return session

    def get_job(self, session_id: str) -> TrainingJob:
        with self._lock:
            job = self._jobs.get(session_id)
        if job is None:
            raise SessionNotFoundError(session_id)
        return job

    def stop_session(self, session_id: str) -> TrainingSession:
        """Request a training session to stop."""
        with self._lock:
            session = self._sessions.get(session_id)
            job = self._jobs.get(session_id)
        
        if session is None or job is None:
            raise SessionNotFoundError(session_id)
        
        if session.status not in {"running", "paused"}:
            return session  # Already stopped/completed/failed

        # Request the engine to stop
        job.engine.request_stop()
        session.status = "stopped"
        return session

    def pause_session(self, session_id: str) -> TrainingSession:
        """Pause an ongoing training session."""
        with self._lock:
            session = self._sessions.get(session_id)
            job = self._jobs.get(session_id)

        if session is None or job is None:
            raise SessionNotFoundError(session_id)

        if session.status != "running":
            return session

        job.engine.request_pause()
        session.status = "paused"
        return session

    def resume_session(self, session_id: str) -> TrainingSession:
        """Resume a paused training session."""
        with self._lock:
            session = self._sessions.get(session_id)
            job = self._jobs.get(session_id)

        if session is None or job is None:
            raise SessionNotFoundError(session_id)

        if session.status != "paused":
            return session

        job.engine.resume()
        session.status = "running"
        return session


def _inject_max_samples(engine: TrainingEngine, max_samples: Optional[int]) -> None:
    if max_samples is None:
        return

    def _patched_prepare(self) -> tuple:
        return TrainingEngine._prepare_data(self, max_samples=max_samples)

    engine._prepare_data = MethodType(_patched_prepare, engine)  # type: ignore[attr-defined]


def _wait_for_session_initialization(engine: TrainingEngine, timeout: float = 5.0) -> TrainingSession:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if engine.session is not None:
            return engine.session
        time.sleep(0.01)
    raise RuntimeError("Training session failed to initialize")


def _build_metric_payloads(metrics: List[TrainingMetric], since_epoch: int) -> List[TrainingMetricPayload]:
    return [
        TrainingMetricPayload(
            epoch=metric.epoch,
            loss=metric.loss,
            accuracy=metric.accuracy,
            timestamp=metric.timestamp,
        )
        for metric in metrics
        if metric.epoch > since_epoch
    ]


def _calculate_progress(session: TrainingSession) -> float:
    if session.total_epochs <= 0:
        return 0.0
    progress = session.current_epoch / session.total_epochs
    return min(1.0, max(0.0, progress))


_model_registry = ModelRegistry()
_model_registry.seed_from_templates()
_session_manager = TrainingSessionManager()


def register_model_definition(model_id: str, dataset_id: str, layers: List[Dict]) -> None:
    """Utility helper for tests or future APIs to register models."""

    if not layers:
        raise ValueError("layers must not be empty")
    layer_objs = [LayerConfig(**layer) if not isinstance(layer, LayerConfig) else layer for layer in layers]
    _model_registry.register(model_id, dataset_id, layer_objs)


@router.post(
    "/models/{model_id}/train",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=TrainingStartResponse,
)
async def start_training_endpoint(model_id: str, payload: TrainingStartRequest) -> TrainingStartResponse:
    print(f"DEBUG: start_training_endpoint called with model_id={model_id}")
    print(f"DEBUG: payload={payload.model_dump()}")
    if model_id == "new":
        if not payload.dataset_id or not payload.layers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dataset ID and layers are required for new models",
            )
        dataset_id = payload.dataset_id
        layers = payload.layers
    else:
        try:
            definition = _model_registry.get(model_id)
            dataset_id = payload.dataset_id or definition.dataset_id
            layers = payload.layers or definition.layers
        except ModelNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Model '{model_id}' not found",
            ) from exc

    # Validate dataset exists before scheduling work for clearer errors
    try:
        get_dataset(dataset_id)
    except Exception as exc:  # pragma: no cover - defensive, dataset registry raises ValueError
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Dataset '{dataset_id}' not found") from exc

    # Use a unique ID for "new" models to avoid locking collisions in SessionManager
    # otherwise multiple users (or tabs) training "new" models would block each other.
    actual_model_id = model_id
    if model_id == "new":
        import uuid
        actual_model_id = f"temp-{uuid.uuid4()}"

    try:
        session = _session_manager.start_training(
            model_id=actual_model_id,
            dataset_id=dataset_id,
            layers=layers,
            max_samples=payload.max_samples,
            epochs=payload.epochs,
            learning_rate=payload.learning_rate,
            batch_size=payload.batch_size,
            optimizer=payload.optimizer,
        )
    except ModelAlreadyTrainingError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Model '{model_id}' is already running session '{exc.args[0]}'",
        ) from exc

    return TrainingStartResponse(
        session_id=session.session_id,
        status=session.status,
        total_epochs=session.total_epochs,
        poll_interval_seconds=max(DEFAULT_POLL_INTERVAL, 1.5 if session.status == "running" else 0.0),
    )


@router.get(
    "/training/{session_id}/status",
    response_model=TrainingStatusResponse,
)
async def get_training_status_endpoint(
    session_id: str,
    since_epoch: int = Query(0, ge=0, description="Return metrics with epoch greater than this value"),
) -> TrainingStatusResponse:
    try:
        session = _session_manager.get_session(session_id)
        job = _session_manager.get_job(session_id)
    except SessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training session not found") from exc

    metrics = _build_metric_payloads(session.metrics, since_epoch)
    progress = _calculate_progress(session)
    poll_interval = DEFAULT_POLL_INTERVAL if session.status in {"running", "paused"} else 5.0

    return TrainingStatusResponse(
        session_id=session.session_id,
        model_id=job.model_id,
        dataset_id=job.dataset_id,
        status=session.status,
        current_epoch=session.current_epoch,
        total_epochs=session.total_epochs,
        progress=progress,
        metrics=metrics,
        error_message=session.error_message,
        started_at=session.start_time,
        completed_at=session.end_time,
        poll_interval_seconds=poll_interval,
    )


@router.post(
    "/training/{session_id}/predict",
    response_model=PredictionResponse,
)
async def predict_endpoint(session_id: str, request: PredictionRequest) -> PredictionResponse:
    """Run prediction using a trained model."""
    try:
        job = _session_manager.get_job(session_id)
    except SessionNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training session not found"
        ) from exc
    
    session = _session_manager.get_session(session_id)
    if session.status not in ("completed", "stopped"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Model training is not complete (status: {session.status})"
        )
    
    if job.engine.trained_model is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No trained model available"
        )
    
    try:
        result = job.engine.predict(request.inputs)
        return PredictionResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


class StopTrainingResponse(BaseModel):
    session_id: str
    status: str
    message: str


class PauseTrainingResponse(BaseModel):
    session_id: str
    status: str
    message: str


class ResumeTrainingResponse(BaseModel):
    session_id: str
    status: str
    message: str


@router.post(
    "/training/{session_id}/stop",
    response_model=StopTrainingResponse,
)
async def stop_training_endpoint(session_id: str) -> StopTrainingResponse:
    """Stop an ongoing training session."""
    try:
        session = _session_manager.stop_session(session_id)
    except SessionNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training session not found"
        ) from exc
    
    if session.status == "running":
        return StopTrainingResponse(
            session_id=session_id,
            status="stopping",
            message="Stop request sent. Training will stop after the current epoch."
        )
    else:
        return StopTrainingResponse(
            session_id=session_id,
            status=session.status,
            message=f"Training already {session.status}"
        )


@router.post(
    "/training/{session_id}/pause",
    response_model=PauseTrainingResponse,
)
async def pause_training_endpoint(session_id: str) -> PauseTrainingResponse:
    """Pause an ongoing training session."""
    try:
        session = _session_manager.pause_session(session_id)
    except SessionNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training session not found"
        ) from exc

    return PauseTrainingResponse(
        session_id=session_id,
        status=session.status,
        message="Training paused" if session.status == "paused" else f"Training already {session.status}",
    )


@router.post(
    "/training/{session_id}/resume",
    response_model=ResumeTrainingResponse,
)
async def resume_training_endpoint(session_id: str) -> ResumeTrainingResponse:
    """Resume a paused training session."""
    try:
        session = _session_manager.resume_session(session_id)
    except SessionNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training session not found"
        ) from exc

    return ResumeTrainingResponse(
        session_id=session_id,
        status=session.status,
        message="Training resumed" if session.status == "running" else f"Training already {session.status}",
    )


__all__ = [
    "router",
    "register_model_definition",
]
