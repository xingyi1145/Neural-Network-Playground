# Dynamic Model Builder

Builds PyTorch MLPs from JSON/dict configs. Used by all datasets to convert visual layer specs into trainable models.

## Where to Look

- **Implementation**: `src/backend/models/dynamic_model.py` - `DynamicMLPModel` class
- **Tests**: `tests/test_dynamic_model.py` - validation and forward pass tests
- **Example**: `examples/model_construction_example.py` - MNIST and California Housing configs (runs on random data as a quick smoke test; no real datasets or training loop)

## Quick Start

Config requires `input_dim`, `output_dim`, `task_type` ("classification" or "regression"), and ordered `layers` with `type` ("input"/"hidden"/"output"), `neurons`, and optional `activation` ("ReLU", "Sigmoid", "Tanh", "Softmax", "Linear").

```python
from backend.models import DynamicMLPModel
model = DynamicMLPModel(config_dict)
logits, loss = model(x, y)  # Classification returns logits + CrossEntropyLoss; regression returns predictions + MSELoss
```
