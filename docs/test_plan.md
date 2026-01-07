# Test Plan

**Project:** ML Web App (Team 8)
**Date:** 2025-11-29
**Version:** 1.0

## 1. Introduction
This document outlines the testing strategy for the Machine Learning Web Application. The objective is to ensure the reliability, correctness, and maintainability of the backend services, including API endpoints, dataset management, and model training workflows.

## 2. Scope
The testing scope includes all Python source code located in the `src/` directory.

### In Scope
- **API Layer**: `src/backend/api/` (Routes, Schemas, Error Handling)
- **Dataset Management**: `src/backend/datasets/` (Loading, Preprocessing, Registry)
- **Training Engine**: `src/backend/training/` (Training Loops, Metrics, State Management)
- **ML Models**: `src/backend/models/` (Dynamic Model Architecture)
- **Frontend UI**: `src/frontend/src/` (React Components, Pages, State Management)

### Out of Scope
- Third-party library internals (e.g., Scikit-learn, PyTorch implementation details).

## 3. Test Strategy

### 3.1 Unit Testing
- **Goal**: Verify individual components (functions, classes) work as expected in isolation.
- **Tools**: `pytest` (Backend), `Vitest` (Frontend)
- **Focus Areas**:
    - Dataset loading and transformation logic.
    - Model initialization and forward pass.
    - Utility functions (config, error handlers).
    - React components rendering and interaction.

### 3.2 Integration Testing
- **Goal**: Verify that different modules interact correctly.
- **Tools**: `pytest`, `FastAPI TestClient`, `Vitest`
- **Focus Areas**:
    - API endpoints triggering training jobs.
    - Data flowing from `datasets` to `training` engine.
    - Model persistence and loading.
    - Frontend page navigation and state updates.

### 3.3 Code Coverage
- **Requirement**: Minimum **70%** statement coverage.
- **Tool**: `pytest-cov` (Backend), `Vitest` (Frontend)
- **Reporting**: Terminal output and `docs/test_report.md`.

## 4. Test Environment
- **OS**: Linux
- **Python Version**: 3.12
- **Node.js Version**: 18+
- **Dependencies**: Managed via `requirements.txt` (Backend) and `package.json` (Frontend).
- **Key Libraries**:
    - `pytest`: Test runner
    - `pytest-cov`: Coverage reporting
    - `httpx`: For API testing
    - `torch`, `scikit-learn`, `numpy`: ML dependencies
    - `vitest`: Frontend test runner
    - `react-testing-library`: React component testing
    - `jsdom`: Browser environment simulation

## 5. Test Cases Overview

| Component | Test ID | Description | Location |
| :--- | :--- | :--- | :--- |
| **Datasets** | `test_datasets.py` | Verify shape, type, and hyperparameters of all registered datasets (MNIST, Iris, etc.). | `tests/backend/` |
| **API** | `test_api.py` | Check health endpoints, dataset listing, and training job creation/status. | `tests/backend/` |
| **Training** | `test_training_engine.py` | Validate training loop, loss calculation, and stop mechanisms. | `tests/backend/` |
| **Training** | `test_regression_training.py` | Ensure regression tasks train correctly. | `tests/backend/` |
| **Models** | `test_dynamic_model.py` | Verify model architecture adapts to input features and task type. | `tests/backend/` |
| **Fixes** | `test_training_fix.py` | Verify specific bug fixes (e.g., hyperparameter passing). | `tests/backend/` |
| **Frontend App** | `App.test.jsx` | Verify main application layout and routing. | `tests/frontend/` |
| **Frontend Pages** | `ModelBuilder.test.jsx` | Verify Model Builder page rendering and interactions. | `tests/frontend/pages/` |
| **Frontend Components** | `ConfigPanel.test.jsx` | Verify configuration panel for layer settings. | `tests/frontend/components/` |
| **Frontend Components** | `LayerPalette.test.jsx` | Verify layer palette rendering and drag-and-drop. | `tests/frontend/components/` |
| **Frontend Components** | `TemplateModal.test.jsx` | Verify template selection modal. | `tests/frontend/components/` |
| **Frontend Components** | `Layout.test.jsx` | Verify common layout components. | `tests/frontend/components/` |

## 6. Execution & Reporting
- Tests are executed manually via the command line.
- **Backend Command**: `cd Project && pytest`
- **Frontend Command**: `cd Project/src/frontend && npx vitest run`
- **Deliverable**: A Test Report (`docs/test_report.md`) summarizing the results, coverage metrics, and any defects found.

## 7. Risks and Mitigation
- **Risk**: Long running tests (training loops).
    - *Mitigation*: Use small subsets of data and few epochs for testing.
- **Risk**: Flaky tests due to randomness in ML.
    - *Mitigation*: Set random seeds (`torch.manual_seed`, `np.random.seed`) in tests.
