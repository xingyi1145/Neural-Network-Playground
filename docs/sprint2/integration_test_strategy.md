# Integration Test Strategy

Integration tests exercise the full lifecycle: create model → trigger training → poll → validate metrics.

## Quick Reference

- Tests live in `src/tests/test_training_integration.py`
- Sample flows in `examples/integration_test_example.py`
- Core helper: `wait_for_training_completion(client, model_id, max_wait=?)`

## Coverage Matrix

| Area | What to assert |
| --- | --- |
| Happy path | 5 datasets finish with `status="completed"` and metrics present |
| Errors | Bad config / dataset → 400, missing model → 404 |
| Concurrency | Parallel create/train calls stay isolated, IDs unique |
| Idempotency | Re-running same request repeats safely |
| Metrics | Status payload includes recorded metrics after completion |

Pytest classes map 1:1 with the rows above (`TestTrainingHappyPath`, `TestErrorScenarios`, `TestConcurrentTraining`, `TestIdempotency`, `TestTrainingMetrics`).

## Data + APIs

- Datasets + target runtime: iris (10s), wine_quality (30s), california_housing (20s), synthetic (15s), mnist (120s)
- Endpoints touched: `POST /api/models`, `GET /api/models/{id}`, `POST /api/models/{id}/train`, `GET /api/models/{id}/status` (pending/training/completed/failed/cancelled)

## How to Run

- Full suite: `pytest src/tests/test_training_integration.py -v`
- Focused: append `::TestClass` or `::TestClass::test_name`
- Stream logs: add `-s`

## Troubleshooting & Tips

- 404? verify router wiring or model ID.
- Timeout? raise helper `max_wait_time` and inspect worker logs.
- Concurrency flake? ensure per-test fixtures create unique datasets/IDs.
- Missing metrics? confirm training writes them before marking completion.
- Keep fixtures isolated (`test_client`, `sample_model_config`, `dataset_model_configs`) and assertions explicit (status code + body).

## Automation

Run these tests on every PR, before merges, and in deploy pipelines using the same dataset snapshots for reproducibility.

## References

- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [Pytest Docs](https://docs.pytest.org/)
