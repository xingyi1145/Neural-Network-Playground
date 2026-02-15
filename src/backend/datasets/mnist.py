from __future__ import annotations

from typing import Tuple

import numpy as np
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split

from .base import BaseDataset, Hyperparameters
from .registry import register_dataset


@register_dataset("mnist")
class MNISTDataset(BaseDataset):
    name = "MNIST"
    task_type = "classification"
    num_features = 784
    num_samples = 60000  # Train samples per charter
    num_classes = 10  # digits 0-9
    description = "28x28 grayscale digit images (flattened to 784 features)."
    hyperparameters = Hyperparameters(epochs=10, learning_rate=0.001, batch_size=4096)

    def load(
        self, test_size: float = 0.2
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        # Use OpenML version for simpler dependency footprint
        data = fetch_openml("mnist_784", version=1, as_frame=False)
        X: np.ndarray = data["data"].astype(np.float32) / 255.0  # normalize to [0,1]
        y: np.ndarray = data["target"].astype(np.int64)

        if self.max_samples is not None and self.max_samples < len(X):
            X = X[: self.max_samples]
            y = y[: self.max_samples]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=self.random_state, stratify=y
        )

        X_train = self._ensure_float32(X_train)
        X_test = self._ensure_float32(X_test)
        self._validate_no_nans(X_train, X_test)
        return X_train, y_train, X_test, y_test
