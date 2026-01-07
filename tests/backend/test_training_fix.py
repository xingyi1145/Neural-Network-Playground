import pytest
from fastapi.testclient import TestClient
from backend.api.main import app
from backend.api.routes.training import _model_registry

client = TestClient(app)

def test_start_training_with_hyperparameters():
    # 1. Register a dummy dataset (mocking behavior if needed, or using existing)
    # For this test, we'll try to use the 'iris' dataset which should exist
    
    payload = {
        "dataset_id": "iris",
        "layers": [
            {"type": "input", "neurons": 4},
            {"type": "hidden", "neurons": 10, "activation": "relu"},
            {"type": "output", "neurons": 3, "activation": "softmax"}
        ],
        "epochs": 5,
        "learning_rate": 0.01,
        "batch_size": 32,
        "optimizer": "adam"
    }

    response = client.post("/api/models/new/train", json=payload)
    
    print(f"Response Status: {response.status_code}")
    print(f"Response Body: {response.text}")

    # Check if the request was accepted
    assert response.status_code == 202, f"Response: {response.text}"
    
    data = response.json()
    assert "session_id" in data
    assert data["status"] in ["pending", "running", "completed"]
    assert data["total_epochs"] == 5

if __name__ == "__main__":
    # Manually run the test function if executed directly
    try:
        test_start_training_with_hyperparameters()
        print("Test passed!")
    except AssertionError as e:
        print(f"Test failed: {e}")
        if 'response' in locals():
             print(f"Response body: {response.text}")
    except Exception as e:
        print(f"An error occurred: {e}")
