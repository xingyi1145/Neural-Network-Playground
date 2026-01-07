# Training Engine Design Document

## Overview

**TrainingEngine** orchestrates end-to-end neural network training: loads datasets from registry, builds models using teammate's `DynamicMLPModel`, trains with Adam, tracks metrics, and handles failures (NaN, divergence).

**Location:** `/src/backend/training/engine.py`

---

## Architecture

```
TrainingEngine.train():
  1. Load dataset → get_dataset(id).load()
  2. Build model → DynamicMLPModel(config) from backend.models
  3. Configure → Adam optimizer with dataset hyperparameters
  4. Train loop → batch with DataLoader, track loss/accuracy per epoch
  5. Detect failures → NaN, divergence (loss > 1e6)
  6. Return → TrainingSession with metrics
```

---

## Key Components

### TrainingEngine
- **Constructor:** `dataset_id` (str), `model_config` (dict), `device` (str="cpu")
- **train():** Returns `TrainingSession` with status, metrics, error_message
- **_train_one_epoch():** Batch training, returns (avg_loss, accuracy)
- **_check_for_failures():** Detects NaN, divergence; stagnation is warning-only

### Data Models (Pydantic)
- **TrainingSession:** session_id, dataset_id, status, metrics[], error_message
- **TrainingMetric:** epoch, loss, accuracy (optional), timestamp

### Loss Selection
- Classification → `CrossEntropyLoss` (expects logits)
- Regression → `MSELoss`

---

## Model Integration

**Uses teammate's `DynamicMLPModel` from `backend.models.dynamic_model`:**
```python
from backend.models.dynamic_model import DynamicMLPModel

config = {
    "input_dim": ds.num_features,
    "output_dim": 10 if ds.task_type == "classification" else 1,
    "task_type": ds.task_type,
    "layers": [...]  # from model_config
}
model = DynamicMLPModel(config).to(device)
```

---

## Error Handling

- **NaN loss:** Immediately fails, sets status="failed"
- **Divergence (loss > 1e6):** Fails, records error_message
- **Stagnation:** Warning-only (no failure)
- Always returns `TrainingSession` with partial metrics on failure

---

## Performance Target

<5 minutes per dataset on CPU using pre-configured hyperparameters (epochs, lr, batch_size) from dataset registry.

---

## Out of Scope (this MR)

- Shape validation between model config and dataset
- Training API routes (POST /train, GET /status)

---

## Testing

Unit tests in `/tests/test_training_engine.py`:
- Classification/regression workflows
- NaN and divergence detection
- Metrics tracking
- Target >60% coverage

Example: `/examples/training_example.py`

---
