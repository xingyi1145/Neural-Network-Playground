"""Minimal end-to-end example for the training API.

Run FastAPI first (`uvicorn src.main:app --reload`), then execute this script to:
1. Register a throwaway model definition (using the backend helper).
2. Start training via `POST /api/models/{id}/train`.
3. Poll `GET /api/training/{session_id}/status` until completion.
"""
from __future__ import annotations

import asyncio
from typing import List

import httpx

from backend.api.routes.training import register_model_definition

BASE_URL = "http://localhost:8000/api"
MODEL_ID = "example_mlp"
DATASET_ID = "iris"

LAYERS: List[dict] = [
    {"type": "input", "neurons": 4, "activation": None, "position": 0},
    {"type": "hidden", "neurons": 16, "activation": "relu", "position": 1},
    {"type": "output", "neurons": 3, "activation": "softmax", "position": 2},
]


def ensure_model_registered() -> None:
    """Register the demo model once per process."""

    register_model_definition(MODEL_ID, DATASET_ID, LAYERS)


def _print_metrics(metrics: List[dict]) -> None:
    for metric in metrics:
        epoch = metric["epoch"]
        loss = metric["loss"]
        acc = metric.get("accuracy")
        if acc is None:
            print(f"epoch={epoch:03d} loss={loss:.4f}")
        else:
            print(f"epoch={epoch:03d} loss={loss:.4f} acc={acc:.3f}")


async def main() -> None:
    ensure_model_registered()

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=60.0) as client:
        start_resp = await client.post(f"/models/{MODEL_ID}/train", json={"max_samples": 200})
        start_resp.raise_for_status()
        start_payload = start_resp.json()
        session_id = start_payload["session_id"]
        print(f"Started session {session_id} (status={start_payload['status']})")

        since_epoch = 0
        while True:
            status_resp = await client.get(
                f"/training/{session_id}/status",
                params={"since_epoch": since_epoch},
            )
            status_resp.raise_for_status()
            payload = status_resp.json()
            new_metrics = payload["metrics"]
            if new_metrics:
                since_epoch = new_metrics[-1]["epoch"]
                _print_metrics(new_metrics)

            if payload["status"] in {"completed", "failed"}:
                print(f"Training finished with status={payload['status']}")
                if payload.get("error_message"):
                    print(f"Error: {payload['error_message']}")
                break

            await asyncio.sleep(payload["poll_interval_seconds"])


if __name__ == "__main__":
    asyncio.run(main())
