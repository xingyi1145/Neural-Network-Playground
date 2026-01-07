from __future__ import annotations

from typing import Callable, Dict, List, Type

from .base import BaseDataset


_DATASET_REGISTRY: Dict[str, Type[BaseDataset]] = {}


def register_dataset(dataset_id: str) -> Callable[[Type[BaseDataset]], Type[BaseDataset]]:
    """Class decorator to register a dataset by id."""

    def _decorator(cls: Type[BaseDataset]) -> Type[BaseDataset]:
        if dataset_id in _DATASET_REGISTRY:
            raise KeyError(f"Dataset id '{dataset_id}' already registered")
        _DATASET_REGISTRY[dataset_id] = cls
        cls.id = dataset_id  # type: ignore[attr-defined]
        return cls

    return _decorator


def get_dataset(dataset_id: str, **kwargs) -> BaseDataset:
    try:
        cls = _DATASET_REGISTRY[dataset_id]
    except KeyError as exc:
        raise KeyError(
            f"Unknown dataset_id '{dataset_id}'. Available: {sorted(_DATASET_REGISTRY.keys())}"
        ) from exc
    return cls(**kwargs)


def list_datasets() -> List[str]:
    return sorted(_DATASET_REGISTRY.keys())


