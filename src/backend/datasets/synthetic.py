from __future__ import annotations

from typing import Literal, Tuple

import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from .base import BaseDataset, Hyperparameters
from .registry import register_dataset


def _make_xor(n_samples: int, random_state: int) -> Tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(random_state)
    X = rng.uniform(-1.0, 1.0, size=(n_samples, 2)).astype(np.float32)
    y = ((X[:, 0] > 0) ^ (X[:, 1] > 0)).astype(np.int64)
    return X, y


def _make_spiral(n_samples: int, random_state: int) -> Tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(random_state)
    n_per_class = n_samples // 2
    theta = rng.uniform(0, 4 * np.pi, size=n_per_class)
    r = np.linspace(0.0, 1.0, n_per_class, dtype=np.float32)

    x1 = np.stack([r * np.cos(theta), r * np.sin(theta)], axis=1)
    x2 = np.stack([r * np.cos(theta + np.pi), r * np.sin(theta + np.pi)], axis=1)
    X = np.concatenate([x1, x2], axis=0).astype(np.float32)
    y = np.concatenate([np.zeros(n_per_class, dtype=np.int64), np.ones(n_per_class, dtype=np.int64)])
    # Add small noise
    X += rng.normal(0, 0.05, size=X.shape).astype(np.float32)
    return X, y


@register_dataset("synthetic")
class SyntheticDataset(BaseDataset):
    name = "Synthetic (XOR/Spiral)"
    task_type = "classification"
    num_features = 2
    num_samples = 1000
    num_classes = 2  # binary classification
    description = "Synthetic non-linear 2D datasets: XOR or spiral."
    hyperparameters = Hyperparameters(epochs=100, learning_rate=0.01, batch_size=64)

    def __init__(self, kind: Literal["xor", "spiral"] = "xor", **kwargs) -> None:
        super().__init__(**kwargs)
        self.kind: Literal["xor", "spiral"] = kind

    def load(self, test_size: float = 0.2) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        n_samples = self.max_samples if self.max_samples is not None else self.num_samples
        if n_samples < 100:
            n_samples = 100  # ensure reasonable size

        if self.kind == "xor":
            X, y = _make_xor(n_samples, self.random_state)
        else:
            X, y = _make_spiral(n_samples, self.random_state)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=self.random_state, stratify=y
        )

        self.scaler = StandardScaler()
        X_train = self.scaler.fit_transform(X_train)
        X_test = self.scaler.transform(X_test)

        X_train = self._ensure_float32(X_train)
        X_test = self._ensure_float32(X_test)
        self._validate_no_nans(X_train, X_test)
        return X_train, y_train, X_test, y_test

    def transform_inputs(self, inputs):
        arr = super().transform_inputs(inputs)
        if getattr(self, "scaler", None) is not None:
            arr = self.scaler.transform(arr)
        return self._ensure_float32(arr)
