"""
Example client for the Model API endpoints.

Run the API first:
    cd Project/src
    uvicorn main:app --reload
Then execute this script:
    python examples/model_api_usage.py
"""
from __future__ import annotations

from typing import Any, Dict

import httpx

API_ROOT = "http://localhost:8000/api/models"


def create_model(client: httpx.Client) -> Dict[str, Any]:
    """Send a POST request to create a model."""
    payload = {
        "name": "Example MNIST Model",
        "description": "Simple 3-layer classifier",
        "dataset_id": "mnist",
        "layers": [
            {"type": "input", "neurons": 784, "activation": None, "position": 0},
            {"type": "hidden", "neurons": 128, "activation": "relu", "position": 1},
            {"type": "output", "neurons": 10, "activation": "softmax", "position": 2},
        ],
    }
    response = client.post(API_ROOT, json=payload)
    response.raise_for_status()
    return response.json()


def get_model(client: httpx.Client, model_id: str) -> Dict[str, Any]:
    """Fetch a model by id."""
    response = client.get(f"{API_ROOT}/{model_id}")
    response.raise_for_status()
    return response.json()


def main() -> None:
    with httpx.Client(timeout=10.0) as client:
        created = create_model(client)
        print("Created model:")
        print(created)

        fetched = get_model(client, created["id"])
        print("\nFetched model:")
        print(fetched)


if __name__ == "__main__":
    main()
