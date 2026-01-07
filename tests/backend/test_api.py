"""API endpoint tests for Neural Network Playground."""
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


class TestDatasetEndpoints:
    def test_list_datasets(self):
        response = client.get("/api/datasets")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_get_dataset_details(self):
        response = client.get("/api/datasets/mnist")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "mnist"
        assert "name" in data
        assert "task_type" in data
        assert "num_features" in data

    def test_get_nonexistent_dataset(self):
        response = client.get("/api/datasets/nonexistent_dataset")
        assert response.status_code == 404

    def test_dataset_preview(self):
        response = client.get("/api/datasets/mnist/preview?num_samples=5")
        assert response.status_code == 200
        data = response.json()
        assert "features" in data
        assert "labels" in data
        assert "num_samples_shown" in data
        assert data["num_samples_shown"] <= 5


class TestTemplateEndpoints:
    def test_list_templates(self):
        response = client.get("/api/templates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2

    def test_filter_templates_by_dataset(self):
        response = client.get("/api/templates?dataset_id=mnist")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for template in data:
            assert template["dataset_id"] == "mnist"

    def test_get_simple_template(self):
        response = client.get("/api/templates/mnist_simple")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "mnist_simple"
        assert data["name"] == "Simple MLP"
        assert len(data["layers"]) == 3
        assert data["layers"][0]["neurons"] == 784
        assert data["layers"][1]["neurons"] == 128
        assert data["layers"][2]["neurons"] == 10

    def test_get_deep_template(self):
        response = client.get("/api/templates/mnist_deep")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "mnist_deep"
        assert data["name"] == "Deep MLP"
        assert len(data["layers"]) == 4
        assert data["layers"][0]["neurons"] == 784
        assert data["layers"][1]["neurons"] == 256
        assert data["layers"][2]["neurons"] == 128
        assert data["layers"][3]["neurons"] == 10

    def test_get_nonexistent_template(self):
        response = client.get("/api/templates/nonexistent_template")
        assert response.status_code == 404


class TestRootEndpoints:
    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "endpoints" in data

    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


