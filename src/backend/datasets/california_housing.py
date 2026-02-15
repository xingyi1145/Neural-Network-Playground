from __future__ import annotations

from typing import Tuple

import numpy as np
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from .base import BaseDataset, Hyperparameters
from .registry import register_dataset


@register_dataset("california_housing")
class CaliforniaHousingDataset(BaseDataset):
    name = "California Housing"
    task_type = "regression"
    num_features = 8
    num_samples = 20000  # Approx per charter
    num_classes = 1  # regression outputs single value
    description = "Predict median house values from 8 numeric features (regression)."
    hyperparameters = Hyperparameters(epochs=20, learning_rate=0.001, batch_size=512)

    def load(
        self, test_size: float = 0.2
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        bunch = fetch_california_housing(as_frame=False)
        X: np.ndarray = bunch.data
        y: np.ndarray = bunch.target.astype(np.float32)

        if self.max_samples is not None and self.max_samples < len(X):
            X = X[: self.max_samples]
            y = y[: self.max_samples]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=self.random_state
        )

        self.scaler = StandardScaler()
        X_train = self.scaler.fit_transform(X_train)
        X_test = self.scaler.transform(X_test)

        X_train = self._ensure_float32(X_train)
        X_test = self._ensure_float32(X_test)
        y_train = y_train.astype(np.float32)
        y_test = y_test.astype(np.float32)

        self._validate_no_nans(X_train, X_test)
        return X_train, y_train, X_test, y_test

    def transform_inputs(self, inputs):
        arr = super().transform_inputs(inputs)
        if getattr(self, "scaler", None) is not None:
            arr = self.scaler.transform(arr)
        return self._ensure_float32(arr)
