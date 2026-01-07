"""
Tiny integration-test snippets for the training API.
Run: python examples/integration_test_example.py
"""

import time
from fastapi.testclient import TestClient
from pathlib import Path
import sys

project_root = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(project_root))

from main import app


client = TestClient(app)

DATASETS = {
    "iris": {
        "dataset_id": "iris",
        "layers": [{"neurons": 4, "activation": "relu"}, {"neurons": 3, "activation": "softmax"}],
        "hyperparameters": {"epochs": 3, "learning_rate": 0.01, "batch_size": 16, "optimizer": "adam"},
    },
    "iris_deep": {
        "dataset_id": "iris",
        "layers": [
            {"neurons": 4, "activation": "relu"},
            {"neurons": 8, "activation": "relu"},
            {"neurons": 3, "activation": "softmax"},
        ],
        "hyperparameters": {"epochs": 5, "learning_rate": 0.01, "batch_size": 16, "optimizer": "adam"},
    },
    "synthetic": {
        "dataset_id": "synthetic",
        "layers": [{"neurons": 2, "activation": "relu"}, {"neurons": 2, "activation": "softmax"}],
        "hyperparameters": {"epochs": 5, "learning_rate": 0.01, "batch_size": 32, "optimizer": "adam"},
    },
}


def wait_for_training_completion(model_id: str, max_wait_time: int = 90):
    """Poll /status until training completes or times out."""
    start_time = time.time()
    while time.time() - start_time < max_wait_time:
        response = client.get(f"/api/models/{model_id}/status")
        if response.status_code != 200:
            raise RuntimeError(f"status lookup failed: {response.status_code}")
        status_data = response.json()
        if status_data.get("status") in {"completed", "failed", "cancelled"}:
            return status_data
        time.sleep(1.0)
    raise TimeoutError(f"training exceeded {max_wait_time}s")


def create_and_train(config_name: str, wait: int = 60):
    """Create, trigger training, and wait; returns (model_id, status_dict)."""
    config = DATASETS[config_name]
    create = client.post("/api/models", json=config)
    if create.status_code != 201:
        raise RuntimeError(f"{config_name}: create failed ({create.status_code})")
    model_id = create.json()["id"]
    train = client.post(f"/api/models/{model_id}/train")
    if train.status_code != 202:
        raise RuntimeError(f"{config_name}: train failed ({train.status_code})")
    return model_id, wait_for_training_completion(model_id, wait)


def example_basic():
    """Example 1: single happy-path run."""
    try:
        start = time.time()
        _, status = create_and_train("iris_deep", wait=60)
        print(f"[basic] {status['status']} in {time.time() - start:.1f}s metrics={status.get('metrics', {})}")
    except Exception as exc:
        print(f"[basic] {exc}")


def example_errors():
    """Example 2: three quick negative tests."""
    tests = [
        ("missing layers", {"dataset_id": "iris", "hyperparameters": {"epochs": 1}}, 400),
        ("missing model", None, 404),
        ("bad dataset", {"dataset_id": "nope", "layers": [{"neurons": 1}], "hyperparameters": {"epochs": 1}}, 400),
    ]
    for label, payload, expected in tests:
        if payload is None:
            resp = client.get("/api/models/does_not_exist")
        else:
            resp = client.post("/api/models", json=payload)
        outcome = "✅" if resp.status_code == expected else f"❌ got {resp.status_code}"
        print(f"[error] {label}: expect {expected} -> {outcome}")


def example_multi_dataset():
    """Example 3: run iris + synthetic sequentially."""
    for name in ("iris", "synthetic"):
        try:
            _, status = create_and_train(name, wait=90)
            print(f"[multi:{name}] {status['status']} metrics={status.get('metrics', {})}")
        except Exception as exc:
            print(f"[multi:{name}] {exc}")


def example_polling():
    """Example 4: manual poll loop showing progress."""
    create = client.post("/api/models", json=DATASETS["iris"])
    if create.status_code != 201:
        print("[poll] create failed")
        return
    model_id = create.json()["id"]
    if client.post(f"/api/models/{model_id}/train").status_code != 202:
        print("[poll] train failed")
        return

    for poll in range(60):
        resp = client.get(f"/api/models/{model_id}/status")
        if resp.status_code != 200:
            print(f"[poll] status failed ({resp.status_code})")
            break
        status = resp.json()
        epoch = status.get("current_epoch")
        total = status.get("total_epochs", "?")
        msg = f"epoch {epoch}/{total}" if epoch is not None else "no epoch info"
        print(f"[poll] {status.get('status')} ({msg})")
        if status.get("status") in {"completed", "failed", "cancelled"}:
            print(f"[poll] final metrics: {status.get('metrics')}")
            break
        time.sleep(1.0)
    else:
        print("[poll] timeout")


def main():
    print("Integration test snippets\n")
    for func in (example_basic, example_errors, example_multi_dataset, example_polling):
        func()


if __name__ == "__main__":
    main()

