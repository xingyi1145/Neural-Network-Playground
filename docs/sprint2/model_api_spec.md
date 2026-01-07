# Model API Specification (Sprint 2)

The Model API enables the frontend drag-and-drop builder to persist lightweight model configurations before any training work begins. All state currently lives in an in-memory store so it is ideal for demos and storyboards.

## Endpoints

### POST `/api/models`
- **Purpose:** Accept a configurable model topology for a specific dataset.
- **Request body schema:**
  - `name` *(string, optional)* – Friendly label displayed in the UI.
  - `description` *(string, optional)* – Short description (≤500 chars).
  - `dataset_id` *(string, required)* – Must match a registered dataset (see `/api/datasets`).
  - `layers` *(array, required)* – Ordered list of layer objects. Each layer contains:
    - `type` *(string)* – One of `input`, `hidden`, `output`.
    - `neurons` *(int > 0)* – Number of units.
    - `activation` *(string or null)* – Allowed values: `relu`, `sigmoid`, `tanh`, `softmax`, `gelu`, `leaky_relu`, `selu`, `elu`, `softplus`, `linear`, or `null`.
    - `position` *(int ≥ 0)* – Zero-based order.
- **Validation rules (400 on failure):**
  - Exactly one input and one output layer.
  - Layer positions must be contiguous starting at 0.
  - Graph must start with an input layer and end with an output layer.
  - Input layers cannot define an activation.
  - Dataset must exist (checked via `backend.datasets.list_datasets()`).
- **Response (201):**
  ```json
  {
    "id": "6d1d7909-5022-4a67-91f9-97fa6bc9b9b1",
    "name": "Custom MNIST model",
    "dataset_id": "mnist",
    "description": "Heavier classifier",
    "layers": [
      {"type": "input", "neurons": 784, "activation": null, "position": 0},
      {"type": "hidden", "neurons": 256, "activation": "relu", "position": 1},
      {"type": "output", "neurons": 10, "activation": "softmax", "position": 2}
    ],
    "created_at": "2024-02-22T18:25:43.511815+00:00",
    "status": "created"
  }
  ```

### GET `/api/models/{id}`
- **Purpose:** Retrieve a previously created configuration.
- **Response (200):** Same shape as the POST response.
- **Errors:**
  - `404` when the ID is not present in the in-memory store.

## Implementation Notes
- **Storage:** `MODEL_STORE` is a simple dictionary in `backend/api/routes/models.py`. All data is transient.
- **Identifiers:** Each model receives a UUID4 string.
- **Schemas:** Pydantic models (`LayerConfig`, `ModelCreateRequest`, `ModelResponse`) enforce types before business validation.
- **Extensibility:** Status currently hard-coded to `created`. Future sprints can update this to track training/testing lifecycle.

## Testing & Coverage
- Integration tests live in `src/tests/test_models_api.py` and exercise success + error paths via FastAPI’s `TestClient`.
- Running `pytest --cov=backend.api.routes.models tests/test_models_api.py -v` from `src/` produces >60% statement coverage on the new route module.
- Tests automatically reset the in-memory store between runs via the exported `clear_model_store()` helper.

## Example Usage
- See `examples/model_api_usage.py` for a ready-to-run script that creates and fetches a model using `httpx`.
- Script expects a locally running FastAPI server (`python src/main.py`). Update `API_ROOT` in the script to point to deployed environments.
