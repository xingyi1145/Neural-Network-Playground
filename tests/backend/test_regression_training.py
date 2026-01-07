import pytest
from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)

def test_regression_training():
    # Use California Housing dataset (regression)
    # Ensure dataset is loaded/registered (it should be by default)
    
    payload = {
        "dataset_id": "california_housing",
        "layers": [
            {"type": "input", "neurons": 8}, # 8 features
            {"type": "hidden", "neurons": 16, "activation": "relu"},
            {"type": "output", "neurons": 1, "activation": "linear"}
        ],
        "epochs": 2,
        "learning_rate": 0.01,
        "batch_size": 32,
        "optimizer": "adam"
    }

    print("Starting regression training test...")
    response = client.post("/api/models/new/train", json=payload)
    
    print(f"Response Status: {response.status_code}")
    print(f"Response Body: {response.text}")

    assert response.status_code == 202
    
    data = response.json()
    assert data["status"] in ["pending", "running", "completed"]
    print("Regression training started successfully.")

if __name__ == "__main__":
    try:
        test_regression_training()
        print("Test passed!")
    except AssertionError as e:
        print(f"Test failed: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")
