from __future__ import annotations

import math

import numpy as np
import pytest

from backend.datasets import get_dataset


@pytest.mark.parametrize(
    "dataset_id,expected_features,task_type,hyperparams",
    [
        (
            "mnist",
            784,
            "classification",
            {"epochs": 10, "learning_rate": 0.001, "batch_size": 4096},
        ),
        (
            "iris",
            4,
            "classification",
            {"epochs": 50, "learning_rate": 0.01, "batch_size": 32},
        ),
        (
            "california_housing",
            8,
            "regression",
            {"epochs": 20, "learning_rate": 0.001, "batch_size": 512},
        ),
        (
            "wine_quality",
            11,
            "classification",
            {"epochs": 30, "learning_rate": 0.001, "batch_size": 128},
        ),
        (
            "synthetic",
            2,
            "classification",
            {"epochs": 100, "learning_rate": 0.01, "batch_size": 64},
        ),
    ],
)
def test_dataset_shapes_and_hyperparams(
    dataset_id: str, expected_features: int, task_type: str, hyperparams: dict
) -> None:
    # Keep tests fast by limiting sample size when supported
    kwargs = {"max_samples": 1000}
    if dataset_id == "iris":
        kwargs = {"max_samples": 150}
    if dataset_id == "synthetic":
        kwargs["kind"] = "xor"

    ds = get_dataset(dataset_id, **kwargs)
    assert ds.task_type == task_type
    assert ds.num_features == expected_features

    X_train, y_train, X_test, y_test = ds.load()

    # Basic shape checks
    assert X_train.ndim == 2 and X_test.ndim == 2
    assert X_train.shape[1] == expected_features
    assert X_test.shape[1] == expected_features
    assert y_train.ndim == 1 and y_test.ndim == 1

    # Non-empty and compatible splits
    assert X_train.shape[0] > 0 and X_test.shape[0] > 0
    assert y_train.shape[0] == X_train.shape[0]
    assert y_test.shape[0] == X_test.shape[0]

    # Preprocessing sanity: float features, no NaNs
    assert np.issubdtype(X_train.dtype, np.floating)
    assert not np.isnan(X_train).any()

    # Label types by task
    if task_type == "classification":
        assert np.issubdtype(y_train.dtype, np.integer)
    else:
        assert np.issubdtype(y_train.dtype, np.floating)

    # Hyperparameters match charter
    assert ds.hyperparameters.epochs == hyperparams["epochs"]
    assert math.isclose(
        ds.hyperparameters.learning_rate, hyperparams["learning_rate"], rel_tol=1e-9
    )
    assert ds.hyperparameters.batch_size == hyperparams["batch_size"]


def test_registry_lists_all() -> None:
    # Import inside to ensure registry is populated by module imports
    from backend.datasets import list_datasets

    available = set(list_datasets())
    expected = {"mnist", "iris", "california_housing", "wine_quality", "synthetic"}
    assert expected.issubset(available)
