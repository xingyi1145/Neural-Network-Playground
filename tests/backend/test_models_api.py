"""
Integration tests for /api/models endpoints.
"""
from __future__ import annotations

import re
from typing import Dict

import pytest
from fastapi.testclient import TestClient

from backend.api.routes import models as models_module
from main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_store() -> None:
    """Start each test with a blank in-memory store."""
    models_module.clear_model_store()
    yield
    models_module.clear_model_store()


def build_payload(overrides: Dict[str, object] | None = None) -> Dict[str, object]:
    payload: Dict[str, object] = {
        "name": "MNIST Builder",
        "dataset_id": "mnist",
        "layers": [
            {"type": "input", "neurons": 784, "activation": None, "position": 0},
            {"type": "hidden", "neurons": 128, "activation": "relu", "position": 1},
            {"type": "output", "neurons": 10, "activation": "softmax", "position": 2},
        ],
    }
    if overrides:
        payload.update(overrides)
    return payload


def test_create_model_returns_uuid_and_metadata() -> None:
    response = client.post("/api/models", json=build_payload())
    assert response.status_code == 201
    data = response.json()
    assert re.fullmatch(r"[0-9a-f-]{36}", data["id"])
    assert data["name"] == "MNIST Builder"
    assert data["dataset_id"] == "mnist"
    assert data["status"] == "created"
    assert data["layers"][0]["type"] == "input"
    assert data["layers"][-1]["type"] == "output"


def test_create_model_without_registered_dataset_fails() -> None:
    payload = build_payload({"dataset_id": "unknown_dataset"})
    response = client.post("/api/models", json=payload)
    assert response.status_code == 400
    assert "not registered" in response.json()["detail"]


def test_create_model_rejects_non_contiguous_positions() -> None:
    payload = build_payload()
    payload["layers"][1]["position"] = 2  # type: ignore[index]
    response = client.post("/api/models", json=payload)
    assert response.status_code == 400
    assert "contiguous" in response.json()["detail"]


def test_round_trip_get_returns_same_data() -> None:
    create_resp = client.post("/api/models", json=build_payload())
    model_id = create_resp.json()["id"]

    fetch_resp = client.get(f"/api/models/{model_id}")
    assert fetch_resp.status_code == 200
    fetched = fetch_resp.json()
    assert fetched["id"] == model_id
    assert fetched["layers"] == create_resp.json()["layers"]


def test_get_missing_model_returns_404() -> None:
    response = client.get("/api/models/does-not-exist")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_multiple_creations_return_unique_ids() -> None:
    first = client.post("/api/models", json=build_payload())
    second = client.post("/api/models", json=build_payload({"name": "Second Model"}))

    assert first.status_code == second.status_code == 201
    assert first.json()["id"] != second.json()["id"]
