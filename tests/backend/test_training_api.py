from __future__ import annotations

import threading
import time
from datetime import datetime, timezone
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from backend.api.routes import training as training_routes
from backend.training.engine import TrainingEngine
from backend.training.models import TrainingMetric, TrainingSession
from main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def seed_registry() -> None:
    # Ensure a clean registration for each test to avoid collision.
    model_id = "test_model"
    layers = [
        {"type": "input", "neurons": 4, "activation": None, "position": 0},
        {"type": "hidden", "neurons": 8, "activation": "relu", "position": 1},
        {"type": "output", "neurons": 3, "activation": "softmax", "position": 2},
    ]
    training_routes.register_model_definition(model_id, "iris", layers)


def _build_fake_session(
    model_id: str, dataset_id: str, total_epochs: int = 2
) -> TrainingSession:
    session = TrainingSession(
        session_id=str(uuid4()),
        model_id=model_id,
        dataset_id=dataset_id,
        status="running",
        start_time=datetime.now(timezone.utc),
        total_epochs=total_epochs,
        metrics=[],
    )
    return session


def _emit_metrics(session: TrainingSession, epochs: int) -> None:
    for epoch in range(1, epochs + 1):
        session.current_epoch = epoch
        metric = TrainingMetric(
            epoch=epoch,
            loss=1.0 / epoch,
            accuracy=0.8 + (epoch * 0.01),
            timestamp=datetime.now(timezone.utc),
        )
        session.metrics.append(metric)


def test_training_flow_with_polling(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_train(
        self: TrainingEngine, model_id: str | None = None
    ) -> TrainingSession:
        session = _build_fake_session(
            model_id or "unknown", self.dataset_id, total_epochs=3
        )
        self.session = session
        _emit_metrics(session, 3)
        session.status = "completed"
        session.end_time = datetime.now(timezone.utc)
        return session

    monkeypatch.setattr(TrainingEngine, "train", fake_train, raising=False)

    response = client.post("/api/models/test_model/train", json={"max_samples": 50})
    assert response.status_code == 202
    session_id = response.json()["session_id"]

    status_resp = client.get(f"/api/training/{session_id}/status")
    assert status_resp.status_code == 200
    payload = status_resp.json()
    assert payload["status"] == "completed"
    assert payload["current_epoch"] == 3
    assert len(payload["metrics"]) == 3

    filtered_resp = client.get(
        f"/api/training/{session_id}/status", params={"since_epoch": 2}
    )
    assert filtered_resp.status_code == 200
    filtered = filtered_resp.json()
    assert len(filtered["metrics"]) == 1
    assert filtered["metrics"][0]["epoch"] == 3


def test_start_rejects_unknown_model() -> None:
    response = client.post("/api/models/does-not-exist/train", json={})
    assert response.status_code == 404


def test_duplicate_start_returns_400(monkeypatch: pytest.MonkeyPatch) -> None:
    blocker = threading.Event()

    def slow_train(
        self: TrainingEngine, model_id: str | None = None
    ) -> TrainingSession:
        session = _build_fake_session(
            model_id or "unknown", self.dataset_id, total_epochs=5
        )
        self.session = session
        _emit_metrics(session, 2)
        # Keep status running until blocker is set so we can trigger the duplicate check.
        blocker.wait(timeout=1.0)
        session.status = "completed"
        session.current_epoch = session.total_epochs
        session.end_time = datetime.now(timezone.utc)
        return session

    monkeypatch.setattr(TrainingEngine, "train", slow_train, raising=False)

    first = client.post("/api/models/test_model/train", json={})
    assert first.status_code == 202

    duplicate = client.post("/api/models/test_model/train", json={})
    assert duplicate.status_code == 400

    blocker.set()
    time.sleep(0.05)


def test_status_unknown_session() -> None:
    resp = client.get("/api/training/not-real/status")
    assert resp.status_code == 404
