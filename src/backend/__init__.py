"""Backend package for Neural Network Playground.

Currently provides dataset infrastructure with a registry/factory pattern
and five curated datasets aligned with the project charter.
"""

from .datasets import BaseDataset, Hyperparameters, get_dataset, list_datasets

__all__ = [
    "get_dataset",
    "list_datasets",
    "BaseDataset",
    "Hyperparameters",
]
