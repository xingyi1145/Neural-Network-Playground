"""
Integration tests for training API.

Tests the complete workflow: create model → start training → poll status → verify results.

Coverage:
    - Happy path for all 5 datasets
    - Error handling (400, 404)
    - Concurrent operations
    - Idempotency checks

Usage:
    pytest src/tests/test_training_integration.py -v
    pytest src/tests/test_training_integration.py::TestTrainingHappyPath -v

Requirements:
    - Training endpoints: POST /api/models, POST /api/models/{id}/train,
      GET /api/models/{id}/status, GET /api/models/{id}
    - All datasets registered: iris, wine_quality, mnist, california_housing, synthetic
"""
import threading
import time
from typing import Any, Dict

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app

pytestmark = pytest.mark.skip(
    reason="Incompatible API contract: uses wrong endpoints and response schemas. "
    "Needs rewrite for DB-backed API."
)

client = TestClient(app)

# All available datasets for parametrized testing
DATASETS = ["iris", "wine_quality", "mnist", "california_housing", "synthetic"]


@pytest.fixture
def test_client():
    """FastAPI TestClient for making API requests in tests."""
    return TestClient(app)


@pytest.fixture
def sample_model_config() -> Dict[str, Any]:
    """Valid model configuration for Iris dataset (minimal example)."""
    return {
        "dataset_id": "iris",
        "layers": [
            {"neurons": 4, "activation": "relu"},
            {"neurons": 8, "activation": "relu"},
            {"neurons": 3, "activation": "softmax"},
        ],
        "hyperparameters": {
            "epochs": 5,
            "learning_rate": 0.01,
            "batch_size": 16,
            "optimizer": "adam",
        },
    }


@pytest.fixture
def dataset_model_configs() -> Dict[str, Dict[str, Any]]:
    """
    Model configurations for all 5 datasets.

    Returns dict mapping dataset_id to model config with appropriate
    layer architecture and hyperparameters for quick testing.
    """
    return {
        "iris": {
            "dataset_id": "iris",
            "layers": [
                {"neurons": 4, "activation": "relu"},
                {"neurons": 8, "activation": "relu"},
                {"neurons": 3, "activation": "softmax"},
            ],
            "hyperparameters": {
                "epochs": 5,
                "learning_rate": 0.01,
                "batch_size": 16,
                "optimizer": "adam",
            },
        },
        "wine_quality": {
            "dataset_id": "wine_quality",
            "layers": [
                {"neurons": 11, "activation": "relu"},
                {"neurons": 16, "activation": "relu"},
                {"neurons": 8, "activation": "relu"},
                {"neurons": 7, "activation": "softmax"},
            ],
            "hyperparameters": {
                "epochs": 3,
                "learning_rate": 0.001,
                "batch_size": 32,
                "optimizer": "adam",
            },
        },
        "mnist": {
            "dataset_id": "mnist",
            "layers": [
                {"neurons": 784, "activation": "relu"},
                {"neurons": 128, "activation": "relu"},
                {"neurons": 10, "activation": "softmax"},
            ],
            "hyperparameters": {
                "epochs": 2,
                "learning_rate": 0.001,
                "batch_size": 64,
                "optimizer": "adam",
            },
        },
        "california_housing": {
            "dataset_id": "california_housing",
            "layers": [
                {"neurons": 8, "activation": "relu"},
                {"neurons": 16, "activation": "relu"},
                {"neurons": 1, "activation": "linear"},
            ],
            "hyperparameters": {
                "epochs": 3,
                "learning_rate": 0.001,
                "batch_size": 32,
                "optimizer": "adam",
            },
        },
        "synthetic": {
            "dataset_id": "synthetic",
            "layers": [
                {"neurons": 2, "activation": "relu"},
                {"neurons": 8, "activation": "relu"},
                {"neurons": 4, "activation": "relu"},
                {"neurons": 2, "activation": "softmax"},
            ],
            "hyperparameters": {
                "epochs": 10,
                "learning_rate": 0.01,
                "batch_size": 32,
                "optimizer": "adam",
            },
        },
    }


def wait_for_training_completion(
    client: TestClient,
    model_id: str,
    max_wait_time: int = 300,
    poll_interval: float = 1.0,
) -> Dict[str, Any]:
    """
    Poll training status until completion or timeout.

    Args:
        client: TestClient instance
        model_id: Model identifier
        max_wait_time: Max seconds to wait (default: 300)
        poll_interval: Seconds between polls (default: 1.0)

    Returns:
        Final status dict with "status", "metrics", etc.

    Raises:
        RuntimeError: If status endpoint fails
        TimeoutError: If training doesn't complete in time
    """
    start_time = time.time()

    while time.time() - start_time < max_wait_time:
        response = client.get(f"/api/models/{model_id}/status")

        if response.status_code != 200:
            raise RuntimeError(
                f"Failed to get status: {response.status_code} - {response.text}"
            )

        status_data = response.json()
        status = status_data.get("status", "unknown")

        if status in ["completed", "failed", "cancelled"]:
            return status_data

        time.sleep(poll_interval)

    raise TimeoutError(f"Training did not complete within {max_wait_time} seconds")


class TestTrainingHappyPath:
    """Test successful training workflow: create → train → poll → verify."""

    def test_create_train_poll_verify_iris(self, test_client, dataset_model_configs):
        """Test complete training workflow for Iris dataset."""
        config = dataset_model_configs["iris"]

        # Step 1: Create model
        create_response = test_client.post("/api/models", json=config)
        assert (
            create_response.status_code == 201
        ), f"Failed to create model: {create_response.text}"
        model_data = create_response.json()
        model_id = model_data["id"]
        assert model_id is not None
        assert "created_at" in model_data

        # Step 2: Start training
        train_response = test_client.post(f"/api/models/{model_id}/train")
        assert (
            train_response.status_code == 202
        ), f"Failed to start training: {train_response.text}"
        train_data = train_response.json()
        assert train_data["status"] == "training"
        assert "started_at" in train_data

        # Step 3: Poll until completion
        start_time = time.time()
        final_status = wait_for_training_completion(
            test_client, model_id, max_wait_time=60
        )
        training_time = time.time() - start_time

        # Step 4: Verify results
        assert final_status["status"] == "completed", f"Training failed: {final_status}"
        assert "metrics" in final_status
        assert "training_time" in final_status or training_time > 0

        # Verify model details
        model_response = test_client.get(f"/api/models/{model_id}")
        assert model_response.status_code == 200
        model_details = model_response.json()
        assert model_details["id"] == model_id
        assert model_details["dataset_id"] == config["dataset_id"]

        print(f"\n✓ Iris training completed in {training_time:.2f} seconds")

    @pytest.mark.parametrize("dataset_id", DATASETS)
    def test_training_all_datasets(
        self, test_client, dataset_model_configs, dataset_id
    ):
        """
        Test training workflow for all 5 datasets (parametrized).

        This ensures all datasets can be used for training and validates
        the training pipeline works across different data types and sizes.
        """
        config = dataset_model_configs[dataset_id]

        # Create model
        create_response = test_client.post("/api/models", json=config)
        assert (
            create_response.status_code == 201
        ), f"Failed to create model for {dataset_id}: {create_response.text}"
        model_id = create_response.json()["id"]

        # Start training
        train_response = test_client.post(f"/api/models/{model_id}/train")
        assert (
            train_response.status_code == 202
        ), f"Failed to start training for {dataset_id}: {train_response.text}"

        # Poll until completion
        start_time = time.time()
        final_status = wait_for_training_completion(
            test_client, model_id, max_wait_time=300
        )
        training_time = time.time() - start_time

        # Verify completion
        assert (
            final_status["status"] == "completed"
        ), f"Training failed for {dataset_id}: {final_status}"
        assert "metrics" in final_status

        # Document training time
        print(f"\n✓ {dataset_id} training completed in {training_time:.2f} seconds")

        # Verify idempotency: can query same model multiple times
        for _ in range(3):
            status_response = test_client.get(f"/api/models/{model_id}/status")
            assert status_response.status_code == 200
            assert status_response.json()["status"] == "completed"


class TestErrorScenarios:
    """Test error handling: invalid configs (400), non-existent models (404)."""

    def test_invalid_model_configuration_400(self, test_client):
        """Test that invalid model configuration returns 400 error."""
        invalid_configs = [
            # Missing required fields
            {"dataset_id": "iris"},
            # Invalid layer structure
            {
                "dataset_id": "iris",
                "layers": "not_a_list",
                "hyperparameters": {"epochs": 5},
            },
            # Invalid dataset_id
            {
                "dataset_id": "nonexistent_dataset",
                "layers": [{"neurons": 4}],
                "hyperparameters": {"epochs": 5},
            },
            # Invalid layer neurons (mismatch with dataset)
            {
                "dataset_id": "iris",
                "layers": [
                    {"neurons": 999, "activation": "relu"},  # Wrong input size
                    {"neurons": 3, "activation": "softmax"},
                ],
                "hyperparameters": {"epochs": 5},
            },
            # Invalid hyperparameters
            {
                "dataset_id": "iris",
                "layers": [{"neurons": 4}, {"neurons": 3}],
                "hyperparameters": {"epochs": -1, "learning_rate": 0.01},  # Invalid
            },
        ]

        for invalid_config in invalid_configs:
            response = test_client.post("/api/models", json=invalid_config)
            assert (
                response.status_code == 400
            ), f"Expected 400 for invalid config {invalid_config}, got {response.status_code}: {response.text}"

    def test_nonexistent_model_404(self, test_client):
        """Test that operations on non-existent model return 404 error."""
        fake_model_id = "nonexistent_model_12345"

        # Get model details
        response = test_client.get(f"/api/models/{fake_model_id}")
        assert (
            response.status_code == 404
        ), f"Expected 404 for GET, got {response.status_code}"

        # Get training status
        response = test_client.get(f"/api/models/{fake_model_id}/status")
        assert (
            response.status_code == 404
        ), f"Expected 404 for status, got {response.status_code}"

        # Start training
        response = test_client.post(f"/api/models/{fake_model_id}/train")
        assert (
            response.status_code == 404
        ), f"Expected 404 for train, got {response.status_code}"

    def test_train_before_create_404(self, test_client):
        """Test that training a model before it exists returns 404."""
        fake_model_id = "model_not_created_yet"
        response = test_client.post(f"/api/models/{fake_model_id}/train")
        assert response.status_code == 404


class TestConcurrentTraining:
    """Test concurrent operations: multiple models, parallel training."""

    def test_concurrent_model_creation(self, test_client, dataset_model_configs):
        """Test creating multiple models concurrently."""
        config = dataset_model_configs["iris"]
        num_models = 3
        model_ids = []
        errors = []

        def create_model():
            try:
                response = test_client.post("/api/models", json=config)
                if response.status_code == 201:
                    model_ids.append(response.json()["id"])
                else:
                    errors.append(f"Failed: {response.status_code} - {response.text}")
            except Exception as e:
                errors.append(str(e))

        threads = [threading.Thread(target=create_model) for _ in range(num_models)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        assert len(errors) == 0, f"Errors during concurrent creation: {errors}"
        assert (
            len(model_ids) == num_models
        ), f"Expected {num_models} models, got {len(model_ids)}"
        assert len(set(model_ids)) == num_models, "Model IDs should be unique"

    def test_concurrent_training_requests(self, test_client, dataset_model_configs):
        """Test starting multiple training jobs concurrently."""
        config = dataset_model_configs["iris"]

        # Create model
        create_response = test_client.post("/api/models", json=config)
        assert create_response.status_code == 201
        model_id = create_response.json()["id"]

        # Try to start training multiple times concurrently
        results = []
        errors = []

        def start_training():
            try:
                response = test_client.post(f"/api/models/{model_id}/train")
                results.append(
                    {
                        "status_code": response.status_code,
                        "data": response.json()
                        if response.status_code < 400
                        else response.text,
                    }
                )
            except Exception as e:
                errors.append(str(e))

        threads = [threading.Thread(target=start_training) for _ in range(3)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        # At least one should succeed (202), others might be 409 (conflict) or 202
        status_codes = [r["status_code"] for r in results]
        assert 202 in status_codes, f"No successful training start: {status_codes}"
        assert len(errors) == 0, f"Errors during concurrent training: {errors}"

    def test_multiple_models_training_concurrently(
        self, test_client, dataset_model_configs
    ):
        """Test training multiple different models concurrently."""
        datasets_to_test = ["iris", "wine_quality", "synthetic"]
        model_ids = []
        training_times = {}

        # Create all models
        for dataset_id in datasets_to_test:
            config = dataset_model_configs[dataset_id]
            create_response = test_client.post("/api/models", json=config)
            assert create_response.status_code == 201
            model_ids.append((dataset_id, create_response.json()["id"]))

        # Start training all concurrently
        def train_model(dataset_id: str, model_id: str):
            start_time = time.time()
            train_response = test_client.post(f"/api/models/{model_id}/train")
            assert train_response.status_code == 202

            final_status = wait_for_training_completion(
                test_client, model_id, max_wait_time=300
            )
            training_time = time.time() - start_time
            training_times[dataset_id] = training_time

            assert (
                final_status["status"] == "completed"
            ), f"Training failed for {dataset_id}"

        threads = [
            threading.Thread(target=train_model, args=(dataset_id, model_id))
            for dataset_id, model_id in model_ids
        ]

        overall_start = time.time()
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()
        overall_time = time.time() - overall_start

        # Verify all completed
        assert len(training_times) == len(datasets_to_test)

        print(f"\n✓ Concurrent training of {len(datasets_to_test)} models:")
        for dataset_id, train_time in training_times.items():
            print(f"  - {dataset_id}: {train_time:.2f}s")
        print(f"  Total wall-clock time: {overall_time:.2f}s")


class TestIdempotency:
    """Test that repeated operations return consistent results (no side effects)."""

    def test_status_polling_idempotent(self, test_client, dataset_model_configs):
        """Test that status polling is idempotent (can be called multiple times)."""
        config = dataset_model_configs["iris"]

        # Create and train
        create_response = test_client.post("/api/models", json=config)
        model_id = create_response.json()["id"]
        test_client.post(f"/api/models/{model_id}/train")
        wait_for_training_completion(test_client, model_id, max_wait_time=60)

        # Poll status multiple times - should return same result
        statuses = []
        for _ in range(5):
            response = test_client.get(f"/api/models/{model_id}/status")
            assert response.status_code == 200
            statuses.append(response.json())

        # All statuses should be identical
        first_status = statuses[0]
        for status in statuses[1:]:
            assert status["status"] == first_status["status"]
            assert status["id"] == first_status["id"]

    def test_model_details_idempotent(self, test_client, dataset_model_configs):
        """Test that getting model details is idempotent."""
        config = dataset_model_configs["iris"]

        create_response = test_client.post("/api/models", json=config)
        model_id = create_response.json()["id"]

        # Get details multiple times
        details_list = []
        for _ in range(3):
            response = test_client.get(f"/api/models/{model_id}")
            assert response.status_code == 200
            details_list.append(response.json())

        # All should be identical
        first_details = details_list[0]
        for details in details_list[1:]:
            assert details == first_details


class TestTrainingMetrics:
    """Test that training returns proper metrics (loss, accuracy, epochs)."""

    def test_training_metrics_present(self, test_client, dataset_model_configs):
        """Test that completed training returns proper metrics."""
        config = dataset_model_configs["iris"]

        # Create, train, and wait
        create_response = test_client.post("/api/models", json=config)
        model_id = create_response.json()["id"]
        test_client.post(f"/api/models/{model_id}/train")
        final_status = wait_for_training_completion(
            test_client, model_id, max_wait_time=60
        )

        # Verify metrics structure
        assert "metrics" in final_status
        metrics = final_status["metrics"]

        # Should have loss and accuracy (for classification) or loss and mse (for regression)
        assert "loss" in metrics or "train_loss" in metrics

        # For classification datasets, should have accuracy
        if config["dataset_id"] in ["iris", "wine_quality", "mnist", "synthetic"]:
            assert (
                "accuracy" in metrics
                or "train_accuracy" in metrics
                or "val_accuracy" in metrics
            )

        # Should have epoch information
        assert "epochs_completed" in final_status or "current_epoch" in final_status


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
