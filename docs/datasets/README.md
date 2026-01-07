# Dataset System Documentation

**Version:** 1.0  |  **Status:** Complete - All 5 datasets implemented and tested

---

## Overview

Unified interface for loading, preprocessing, and managing 5 curated datasets with pre-configured hyperparameters optimized for CPU training (<5 minutes per charter).

**Features:** Registry/factory pattern • Automatic preprocessing • Stratified train/test splits • Type-safe • Fully tested (6/6 passing)

### Datasets

| Dataset | Type | Features | Samples | Use Case |
|---------|------|----------|---------|----------|
| MNIST | Classification | 784 | 60,000 | Digit recognition (28x28 grayscale images) |
| Iris | Classification | 4 | 150 | Simple 3-class flower classification |
| California Housing | Regression | 8 | 20,640 | House price prediction |
| Wine Quality | Classification | 11 | 1,599 | Multi-class wine quality (red wine) |
| Synthetic (XOR/Spiral) | Classification | 2 | 1,000 | Non-linear decision boundaries |

---

## Architecture

**Structure:** `src/backend/datasets/` contains base classes, registry, and 5 dataset implementations. Tests in `tests/test_datasets.py`.

**Core Components:**
- **BaseDataset** ([base.py](../../src/backend/datasets/base.py)): Abstract class defining `load()` method and metadata attributes
- **Registry** ([registry.py](../../src/backend/datasets/registry.py)): `@register_dataset` decorator + `get_dataset()` factory function
- **Hyperparameters** ([base.py](../../src/backend/datasets/base.py)): Immutable dataclass (epochs, learning_rate, batch_size, optimizer)

---

## Quick Start

```python
from backend.datasets import get_dataset, list_datasets

# Load a dataset
dataset = get_dataset("mnist")
X_train, y_train, X_test, y_test = dataset.load()

# Access metadata and hyperparameters
print(dataset.name, dataset.task_type, dataset.num_features)
print(dataset.hyperparameters.epochs, dataset.hyperparameters.learning_rate)

# Custom test split
dataset.load(test_size=0.3)  # 70-30 split

# Limit samples for testing (speeds up development)
dataset = get_dataset("mnist", max_samples=1000)

# Synthetic dataset variants
xor_data = get_dataset("synthetic", kind="xor")
spiral_data = get_dataset("synthetic", kind="spiral")

# List all datasets
print(list_datasets())  # ['california_housing', 'iris', 'mnist', 'synthetic', 'wine_quality']
```

---

## Dataset Specifications

All hyperparameters match [Project Charter Section 8](../charter.md). All datasets use Adam optimizer.

| Dataset | ID | Epochs | LR | Batch | Source | Preprocessing |
|---------|-----|--------|-----|-------|--------|---------------|
| **MNIST** | `mnist` | 10 | 0.001 | 64 | OpenML `mnist_784` | Normalize [0,1] via `/255` |
| **Iris** | `iris` | 50 | 0.01 | 16 | sklearn `load_iris()` | StandardScaler |
| **California Housing** | `california_housing` | 20 | 0.001 | 32 | sklearn `fetch_california_housing()` | StandardScaler |
| **Wine Quality** | `wine_quality` | 30 | 0.001 | 32 | OpenML `wine-quality-red` | StandardScaler |
| **Synthetic** | `synthetic` | 100 | 0.01 | 32 | Programmatic (XOR/Spiral) | Noise + StandardScaler |

**Implementation Files:** [src/backend/datasets/](../../src/backend/datasets/) - `mnist.py`, `iris.py`, `california_housing.py`, `wine_quality.py`, `synthetic.py`

---

## API Reference

### `get_dataset(dataset_id: str, **kwargs) -> BaseDataset`

Factory function to instantiate datasets by ID.

**Parameters:**
- `dataset_id`: `"mnist"`, `"iris"`, `"california_housing"`, `"wine_quality"`, or `"synthetic"`
- `max_samples` (optional): Limit dataset size for testing
- `random_state` (default=42): Random seed for reproducibility
- `kind` (synthetic only): `"xor"` or `"spiral"`

**Returns:** Dataset instance | **Raises:** `KeyError` if dataset not found

---

### `dataset.load(test_size: float = 0.2) -> Tuple[X_train, y_train, X_test, y_test]`

Load, preprocess, and split dataset into train/test sets.

**Returns:** Tuple of numpy arrays (X_train, y_train, X_test, y_test)
- Features: `float32` arrays, shape `(n_samples, num_features)`
- Labels: `int64` (classification) or `float32` (regression), shape `(n_samples,)`
- Guarantees: No NaN values, stratified splits for classification

---

### `list_datasets() -> List[str]`

Returns sorted list of all registered dataset IDs.

---

## Testing

**Run tests:** `source .venv/bin/activate && PYTHONPATH=src python -m pytest tests/test_datasets.py -v`

**Status:** 6/6 tests passing (~113s runtime)

**Coverage:** [tests/test_datasets.py](../../tests/test_datasets.py)
- Shape validation (correct dimensions)
- Data types (float32 features, int64/float32 labels)
- Preprocessing (no NaN values)
- Hyperparameters (exact charter match)
- Registry (all 5 datasets registered)
- Split consistency (non-empty, aligned)

---

## Design Decisions

Key architectural choices:

1. **Registry/Factory Pattern**: Cleaner API (`get_dataset("mnist")`) vs explicit imports, enables dynamic discovery
2. **Immutable Hyperparameters**: `frozen=True` dataclass enforces charter's pre-configured constraint
3. **OpenML for MNIST/Wine**: Consistent API across all datasets, simpler dependencies than torchvision
4. **StandardScaler for Tabular Data**: Zero-mean/unit-variance normalization (NN best practice), MNIST uses [0,1] (image-specific)
5. **Stratified Classification Splits**: Balanced class distributions, critical for small datasets (Iris=150 samples)
6. **Optional `max_samples`**: Speeds up testing/prototyping (100x faster for MNIST), no production impact
7. **No Caching**: Simpler implementation, acceptable load times (<2 min), memory-efficient

---

## References

- **Charter:** [docs/charter.md](../charter.md) (Section 8: Datasets)
- **Source:** [src/backend/datasets/](../../src/backend/datasets/)
- **Tests:** [tests/test_datasets.py](../../tests/test_datasets.py)
