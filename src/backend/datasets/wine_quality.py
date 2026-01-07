from __future__ import annotations

from typing import Tuple

import numpy as np
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from .base import BaseDataset, Hyperparameters
from .registry import register_dataset


@register_dataset("wine_quality")
class WineQualityDataset(BaseDataset):
    name = "Wine Quality (Red)"
    task_type = "classification"
    num_features = 11
    num_samples = 1600  # Approx per charter
    num_classes = 10  # quality ratings typically 3-8, use 10 for safety
    description = "Multi-class quality prediction on red wine (11 numeric features)."
    hyperparameters = Hyperparameters(epochs=30, learning_rate=0.001, batch_size=128)

    def load(self, test_size: float = 0.2) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        # OpenML dataset: wine-quality-red (ID/name)
        data = fetch_openml(name="wine-quality-red", version=1, as_frame=True)
        X = data.data.to_numpy(dtype=np.float32)
        y = data.target.to_numpy()

        # Classes are integer-like strings; cast to int64
        y = y.astype(np.int64)

        if self.max_samples is not None and self.max_samples < len(X):
            X = X[: self.max_samples]
            y = y[: self.max_samples]

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
