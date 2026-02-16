from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Tuple

import numpy as np


@dataclass(frozen=True)
class Hyperparameters:
    epochs: int
    learning_rate: float
    batch_size: int
    optimizer: str = "adam"


class BaseDataset(ABC):
    """Abstract base class for curated datasets.

    Implementations must provide:
    - id: unique identifier (e.g., "mnist")
    - name: human-readable name
    - task_type: "classification" or "regression"
    - num_features: number of input features
    - num_samples: number of samples (approximate if source-specific)
    - num_classes: number of output classes (for classification) or 1 (for regression)
    - description: short description
    - hyperparameters: pre-configured Hyperparameters per charter
    - load() implementation that returns preprocessed train/test splits
    """

    id: str
    name: str
    task_type: str  # "classification" | "regression"
    num_features: int
    num_samples: int
    num_classes: int  # Number of output classes (1 for regression)
    description: str
    hyperparameters: Hyperparameters

    def __init__(
        self, max_samples: Optional[int] = None, random_state: int = 42
    ) -> None:
        self.max_samples = max_samples
        self.random_state = random_state

    @abstractmethod
    def load(
        self, test_size: float = 0.2
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Load, preprocess, and split the dataset.

        Returns:
            X_train, y_train, X_test, y_test (all numpy arrays)
        """

    # Common helpers
    def _ensure_float32(self, array: np.ndarray) -> np.ndarray:
        if array.dtype != np.float32:
            return array.astype(np.float32)
        return array

    def _validate_no_nans(self, *arrays: np.ndarray) -> None:
        for arr in arrays:
            if np.isnan(arr).any():
                raise ValueError("NaN values detected after preprocessing.")

    def transform_inputs(self, inputs) -> np.ndarray:
        """Transform raw user inputs to match training preprocessing.

        Default behavior returns float32 numpy array shaped (1, num_features).
        Datasets that fit scalers should override/extend this to reuse them.
        """
        arr = np.asarray(inputs, dtype=np.float32)
        if arr.ndim == 1:
            arr = arr.reshape(1, -1)
        return self._ensure_float32(arr)
