from __future__ import annotations

from typing import Tuple

import numpy as np
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from .base import BaseDataset, Hyperparameters
from .registry import register_dataset


@register_dataset("iris")
class IrisDataset(BaseDataset):
    name = "Iris"
    task_type = "classification"
    num_features = 4
    num_samples = 150
    num_classes = 3  # setosa, versicolor, virginica
    description = "Simple 3-class classification on flower measurements (4 features)."
    hyperparameters = Hyperparameters(epochs=50, learning_rate=0.01, batch_size=32)

    def load(
        self, test_size: float = 0.2
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        bunch = load_iris(as_frame=False)
        X: np.ndarray = bunch.data
        y: np.ndarray = bunch.target.astype(np.int64)

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
