# API Contract Documentation

> **Base URL:** `http://localhost:8000` | **Content-Type:** `application/json` | **Version:** 1.0

---

## Error Format
All errors: `{"detail": "message"}` — Codes: 400 (bad request), 404 (not found), 422 (validation), 500 (server error)

---

## Health
| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/health` | `{"status": "ok"}` |

---

## Datasets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/datasets` | List all datasets |
| GET | `/api/datasets/{id}` | Get dataset details |
| GET | `/api/datasets/{id}/preview?num_samples=10` | Preview samples (1-100) |

**Response Schema:**
```json
{"id": "mnist", "name": "MNIST", "task_type": "classification", "num_samples": 70000,
 "num_features": 784, "num_classes": 10, "hyperparameters": {...}}
```

---

## Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List all templates |
| GET | `/api/templates?dataset_id=mnist` | Filter by dataset |
| GET | `/api/templates/{id}` | Get template details |

**Response Schema:**
```json
{"id": "mnist_simple", "name": "Simple MLP", "dataset_id": "mnist",
 "layers": [{"type": "input|hidden|output", "neurons": 784, "activation": "relu|sigmoid|softmax|null"}]}
```

---

## Training

### Start Training
```
POST /api/models/{model_id}/train
```
- `model_id`: Use `"new"` for custom models or existing template ID

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| dataset_id | string | Yes* | *Required for `model_id="new"` |
| layers | array | Yes* | Layer configs `[{type, neurons, activation}]` |
| epochs | int | No | Training epochs |
| learning_rate | float | No | Learning rate |
| batch_size | int | No | Batch size |
| optimizer | string | No | `"adam"` or `"sgd"` |
| max_samples | int | No | Limit samples (1-10000) |

**Response (202):** `{"session_id": "...", "status": "running", "total_epochs": 5}`

---

### Session Control

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/training/{session_id}/status?since_epoch=0` | Get status & metrics |
| POST | `/api/training/{session_id}/stop` | Stop training |
| POST | `/api/training/{session_id}/pause` | Pause training |
| POST | `/api/training/{session_id}/resume` | Resume training |
| POST | `/api/training/{session_id}/predict` | Run prediction (body: `{"inputs": [...]}`) |

**Status Values:** `pending` | `running` | `paused` | `completed` | `stopped` | `failed`

**Status Response:**
```json
{"session_id": "...", "status": "running", "current_epoch": 3, "total_epochs": 5,
 "progress": 0.6, "metrics": [{"epoch": 1, "loss": 2.34, "accuracy": 0.15}]}
```

**Predict Response:**
```json
{"prediction": 7, "probabilities": [0.01, ...], "confidence": 0.80}
```

---

## Status Codes
| Code | Usage |
|------|-------|
| 200 | Success |
| 202 | Training started |
| 400 | Invalid request |
| 404 | Not found |
| 422 | Validation error |
| 500 | Server error |
