# Training API – Sprint 2 Snapshot

- Base URL `http://localhost:8000`, namespace `/api`, no auth in dev.
- Assumes each `model_id` is already registered with a dataset + ordered layer list (templates seed MNIST configs; helper allows manual registration).

## POST `/api/models/{id}/train`
- Body fields (all JSON): `dataset_id` (optional override), `layers` (optional override, same shape as templates), `max_samples` (int cap for quicker experiments).
- Returns `202` with `{session_id, status, total_epochs, poll_interval_seconds}`.
- Errors: `404` when model/dataset missing, `400` when schema fails or an active session already exists.

## GET `/api/training/{session_id}/status`
- Optional query `since_epoch` (default 0) filters metrics.
- Returns `{session_id, model_id, dataset_id, status, current_epoch, total_epochs, progress, metrics[], error_message, started_at, completed_at, poll_interval_seconds}`.
- Errors: `404` when session ID is unknown/expired.

## Polling & Workflow
1. Register model (template or helper) → `POST /api/models/{id}/train`.
2. Poll `/api/training/{session_id}/status?since_epoch=<lastEpoch>` until `status` is `completed`/`failed`.
3. Follow `poll_interval_seconds` hint: ~1.5s while running, 5s after done; responses are non-cacheable by default.

## Error Glossary
| Code | Scenario |
|------|----------|
| 400  | Duplicate active session or invalid payload |
| 404  | Unknown model, dataset, or session |

## Next Ideas
- Add `DELETE /api/training/{session_id}` for cancellation.
- Promote WebSocket/SSE streaming once backend capacity allows.
- Persist model registry once a public `POST /api/models` exists.
