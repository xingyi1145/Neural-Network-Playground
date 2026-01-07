import pytest
from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)

def test_reproduce_400():
    print("Testing missing dataset_id...")
    payload_missing_dataset = {
        "layers": [
            {"type": "input", "neurons": 4},
            {"type": "output", "neurons": 3}
        ],
        "epochs": 1
    }
    response = client.post("/api/models/new/train", json=payload_missing_dataset)
    print(f"Missing dataset_id -> Status: {response.status_code}, Body: {response.text}")
    assert response.status_code == 400
    assert "Dataset ID and layers are required" in response.text

    print("\nTesting missing layers...")
    payload_missing_layers = {
        "dataset_id": "iris",
        "epochs": 1
    }
    response = client.post("/api/models/new/train", json=payload_missing_layers)
    print(f"Missing layers -> Status: {response.status_code}, Body: {response.text}")
    assert response.status_code == 400
    assert "Dataset ID and layers are required" in response.text

    print("\nTesting valid payload...")
    payload_valid = {
        "dataset_id": "iris",
        "layers": [
            {"type": "input", "neurons": 4},
            {"type": "output", "neurons": 3}
        ],
        "epochs": 1
    }
    response = client.post("/api/models/new/train", json=payload_valid)
    print(f"Valid payload -> Status: {response.status_code}")
    assert response.status_code == 202

if __name__ == "__main__":
    try:
        test_reproduce_400()
        print("\nReproduction successful: 400 error confirmed for missing fields.")
    except AssertionError as e:
        print(f"\nAssertion failed: {e}")
    except Exception as e:
        print(f"\nAn error occurred: {e}")
