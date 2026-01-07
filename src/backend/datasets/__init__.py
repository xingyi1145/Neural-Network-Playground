from .base import BaseDataset, Hyperparameters
from .registry import register_dataset, get_dataset, list_datasets

# Ensure dataset classes register on import
from . import mnist  # noqa: F401
from . import iris  # noqa: F401
from . import california_housing  # noqa: F401
from . import wine_quality  # noqa: F401
from . import synthetic  # noqa: F401

__all__ = [
    "BaseDataset",
    "Hyperparameters",
    "register_dataset",
    "get_dataset",
    "list_datasets",
]


