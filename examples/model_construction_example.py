"""Minimal, fast demo for `DynamicMLPModel`.

Shows how to:
- Define a classification config (MNIST-style: 784 -> 128 -> 10)
- Define a regression config (housing-style: 8 -> 32 -> 16 -> 1)
- Build `DynamicMLPModel` from a dict and run one forward pass
  - Classification: logits + CrossEntropyLoss
  - Regression: predictions + MSELoss

Notes:
- Uses random tensors only (no real datasets)
- No training loop or optimization, so it runs quickly

Run from project root:
    PYTHONPATH=src python examples/model_construction_example.py
"""
from __future__ import annotations

from typing import Any, Dict

import torch

from backend.models import DynamicMLPModel, ModelConfigError


def make_mnist_config() -> Dict[str, Any]:
    """Return an MNIST-style classification config (784 -> 128 -> 10)."""

    return {
        "input_dim": 784,
        "output_dim": 10,
        "task_type": "classification",
        "layers": [
            {"type": "input", "neurons": 784},
            {"type": "hidden", "neurons": 128, "activation": "ReLU"},
            # Final Softmax is accepted but ignored when building; model returns logits.
            {"type": "output", "neurons": 10, "activation": "Softmax"},
        ],
    }


def make_california_housing_config() -> Dict[str, Any]:
    """Return a California Housing-style regression config (8 -> 32 -> 16 -> 1)."""

    return {
        "input_dim": 8,
        "output_dim": 1,
        "task_type": "regression",
        "layers": [
            {"type": "input", "neurons": 8},
            {"type": "hidden", "neurons": 32, "activation": "ReLU"},
            {"type": "hidden", "neurons": 16, "activation": "Tanh"},
            {"type": "output", "neurons": 1, "activation": "Linear"},
        ],
    }


def _run_classification_example() -> None:
    """Classification on random MNIST-style data."""

    mnist_cfg = make_mnist_config()
    model = DynamicMLPModel(mnist_cfg)

    x = torch.randn(32, mnist_cfg["input_dim"])
    y = torch.randint(0, mnist_cfg["output_dim"], (32,))

    logits, loss = model(x, y)

    print("=== Classification (MNIST-style) ===")
    print("input:", tuple(x.shape), "logits:", tuple(logits.shape))
    print("loss:", float(loss), "params:", model.num_parameters)
    print()


def _run_regression_example() -> None:
    """Regression on random housing-style data."""

    housing_cfg = make_california_housing_config()
    model = DynamicMLPModel(housing_cfg)

    x = torch.randn(16, housing_cfg["input_dim"])
    y = torch.randn(16)  # regression targets (shape matches squeezed output)

    preds, loss = model(x, y)

    print("=== Regression (Housing-style) ===")
    print("input:", tuple(x.shape), "preds:", tuple(preds.shape))
    print("loss:", float(loss), "params:", model.num_parameters)
    print()


def run_example() -> None:
    """Run both classification and regression demos."""

    _run_classification_example()
    _run_regression_example()


if __name__ == "__main__":
    try:
        run_example()
    except ModelConfigError as exc:
        print("Configuration error:", exc)
