"""Test that stopped models can still be used for predictions."""
from __future__ import annotations

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
    """Ensure clean model registration for each test."""
    model_id = "test_stopped_model"
    layers = [
        {"type": "input", "neurons": 4, "activation": None, "position": 0},
        {"type": "hidden", "neurons": 8, "activation": "relu", "position": 1},
        {"type": "output", "neurons": 3, "activation": "softmax", "position": 2},
    ]
    training_routes.register_model_definition(model_id, "iris", layers)


def test_stopped_model_can_be_used_for_prediction(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test that a stopped model (with partial training) can still make predictions."""

    def fake_train_with_stop(
        self: TrainingEngine, model_id: str | None = None
    ) -> TrainingSession:
        """Simulate training that gets stopped partway through."""
        session = TrainingSession(
            session_id=str(uuid4()),
            model_id=model_id or "unknown",
            dataset_id=self.dataset_id,
            status="running",
            start_time=datetime.now(timezone.utc),
            total_epochs=10,
            metrics=[],
        )
        self.session = session

        # Simulate partial training (3 out of 10 epochs)
        for epoch in range(1, 4):
            session.current_epoch = epoch
            metric = TrainingMetric(
                epoch=epoch,
                loss=1.0 / epoch,
                accuracy=0.5 + (epoch * 0.05),
                timestamp=datetime.now(timezone.utc),
            )
            session.metrics.append(metric)

        # Simulate the stop signal
        session.status = "stopped"
        session.end_time = datetime.now(timezone.utc)

        # Create a mock trained model (in real scenario, this would be the partially trained network)
        from unittest.mock import MagicMock

        self.trained_model = MagicMock()

        return session

    def fake_predict(self: TrainingEngine, inputs: list) -> dict:
        """Mock prediction function."""
        return {"prediction": 1, "probabilities": [0.2, 0.7, 0.1], "confidence": 0.7}

    monkeypatch.setattr(TrainingEngine, "train", fake_train_with_stop, raising=False)
    monkeypatch.setattr(TrainingEngine, "predict", fake_predict, raising=False)

    # Start training
    response = client.post(
        "/api/models/test_stopped_model/train", json={"max_samples": 50}
    )
    assert response.status_code == 202
    session_id = response.json()["session_id"]

    # Wait a bit for training to initialize
    time.sleep(0.1)

    # Check status - should be stopped
    status_resp = client.get(f"/api/training/{session_id}/status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "stopped"
    assert status_data["current_epoch"] == 3  # Only trained 3 epochs
    assert len(status_data["metrics"]) == 3

    # Test prediction on the stopped model - this should work!
    prediction_resp = client.post(
        f"/api/training/{session_id}/predict",
        json={"inputs": [5.1, 3.5, 1.4, 0.2]},  # Sample iris input
    )
    assert prediction_resp.status_code == 200
    prediction_data = prediction_resp.json()
    assert "prediction" in prediction_data
    assert prediction_data["prediction"] == 1
    assert "probabilities" in prediction_data
    assert prediction_data["confidence"] == 0.7


def test_running_model_cannot_be_used_for_prediction(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test that a model that is still running cannot be used for prediction."""

    def fake_train_running(
        self: TrainingEngine, model_id: str | None = None
    ) -> TrainingSession:
        """Simulate a training session that stays in running state."""
        session = TrainingSession(
            session_id=str(uuid4()),
            model_id=model_id or "unknown",
            dataset_id=self.dataset_id,
            status="running",  # Still running
            start_time=datetime.now(timezone.utc),
            total_epochs=10,
            metrics=[],
        )
        self.session = session

        # Add some initial metrics
        for epoch in range(1, 3):
            session.current_epoch = epoch
            metric = TrainingMetric(
                epoch=epoch,
                loss=1.0 / epoch,
                accuracy=0.5 + (epoch * 0.05),
                timestamp=datetime.now(timezone.utc),
            )
            session.metrics.append(metric)

        # Keep status as running - not completed or stopped
        time.sleep(0.5)  # Simulate ongoing training
        return session

    monkeypatch.setattr(TrainingEngine, "train", fake_train_running, raising=False)

    # Start training
    response = client.post(
        "/api/models/test_stopped_model/train", json={"max_samples": 50}
    )
    assert response.status_code == 202
    session_id = response.json()["session_id"]

    # Wait a bit for training to initialize
    time.sleep(0.1)

    # Try to predict while still running - should fail
    prediction_resp = client.post(
        f"/api/training/{session_id}/predict", json={"inputs": [5.1, 3.5, 1.4, 0.2]}
    )
    assert prediction_resp.status_code == 400
    assert "not complete" in prediction_resp.json()["detail"].lower()
