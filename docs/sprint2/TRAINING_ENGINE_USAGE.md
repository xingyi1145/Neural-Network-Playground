# Training Engine Usage Guide

## Essentials for Teammates

**Location:** `/Project/src/backend/training/engine.py`

**Import:**
```python
from backend.training.engine import TrainingEngine
```

**Out of Scope (this MR):** Shape validation, training API routes.

---
## Basic Usage

```python
# 1. Define your model architecture
model_config = {
    "layers": [
        {"type": "input", "neurons": 784, "activation": None, "position": 0},
        {"type": "hidden", "neurons": 128, "activation": "relu", "position": 1},
        {"type": "output", "neurons": 10, "activation": None, "position": 2}
    ]
}

# 2. Create engine instance
engine = TrainingEngine(
    dataset_id="mnist",        # Must exist in dataset registry
    model_config=model_config,
    device="cpu"               # Optional, defaults to "cpu"
)

# 3. Run training
session = engine.train(model_id="my_model_v1")  # model_id is optional

# 4. Access results
print(f"Status: {session.status}")  # "completed" or "failed"
print(f"Final Loss: {session.metrics[-1].loss}")
if session.metrics[-1].accuracy:
    print(f"Final Accuracy: {session.metrics[-1].accuracy}")
```
---
## Expected Input
### `TrainingEngine.__init__()`
- `dataset_id` (str): Dataset ID from registry (e.g., "mnist", "iris")
- `model_config` (dict): Must contain "layers" key with list of layer configs
- `device` (str, optional): "cpu" or "cuda" (default: "cpu")

### `engine.train()`
- `model_id` (str, optional): Identifier for the model being trained
- **Returns:** `TrainingSession` object

---

## Expected Output
### `TrainingSession` Structure
```python
{
    "session_id": "uuid-string",
    "model_id": "my_model_v1",
    "dataset_id": "mnist",
    "status": "completed",  # or "failed"
    "start_time": datetime,
    "end_time": datetime,
    "total_epochs": 10,
    "current_epoch": 10,
    "metrics": [
        {"epoch": 1, "loss": 0.456, "accuracy": 0.89, "timestamp": datetime},
        {"epoch": 2, "loss": 0.321, "accuracy": 0.92, "timestamp": datetime},
        ...
    ],
    "error_message": None  # or error description if failed
}
```