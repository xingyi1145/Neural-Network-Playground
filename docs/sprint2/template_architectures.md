# Template Architectures

Prebuilt MLP templates for all datasets. Each template is just a JSON/dict the frontend can send to `DynamicMLPModel`.

## Datasets & Templates

- **MNIST (classification, 784 → 10)**  
  - `mnist_simple`: 784 → 128 (ReLU) → 10 (Softmax)  
  - `mnist_deep`: 784 → 256 (ReLU) → 128 (ReLU) → 10 (Softmax)
- **Iris (classification, 4 → 3)**  
  - `iris_simple`: 4 → 16 (ReLU) → 3 (Softmax)  
  - `iris_deep`: 4 → 32 (ReLU) → 16 (ReLU) → 3 (Softmax)
- **California Housing (regression, 8 → 1)**  
  - `california_simple`: 8 → 32 (ReLU) → 1 (Linear)  
  - `california_deep`: 8 → 64 (ReLU) → 32 (ReLU) → 1 (Linear)
- **Wine Quality (classification, 11 → 6)**
  - `wine_simple`: 11 → 32 (ReLU) → 6 (Softmax)
  - `wine_deep`: 11 → 64 (ReLU) → 32 (ReLU) → 6 (Softmax)
- **Synthetic (classification, 2 → 2)**  
  - `synthetic_simple`: 2 → 16 (ReLU) → 2 (Softmax)  
  - `synthetic_deep`: 2 → 32 (ReLU) → 16 (Tanh) → 2 (Softmax)

## Where to Look

- `src/backend/api/templates.py` – all template definitions and registry (`TEMPLATES`)
- `tests/test_api.py` – API tests for listing/fetching templates
- `examples/template_usage_example.py` – simple script that loads templates and prints layer shapes


