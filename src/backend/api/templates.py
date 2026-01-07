"""Prebuilt MLP templates for all datasets."""
from typing import Dict, List

# Template data structure matching the API schema
# Assumes teammate has created the Pydantic models
TEMPLATES: Dict[str, dict] = {
    # MNIST (784 -> 10 classification)
    "mnist_simple": {
        "id": "mnist_simple",
        "name": "Simple MLP",
        "description": "Basic 3-layer network for MNIST digit classification",
        "dataset_id": "mnist",
        "layers": [
            {"type": "input", "neurons": 784, "activation": None, "position": 0},
            {"type": "hidden", "neurons": 128, "activation": "relu", "position": 1},
            {"type": "output", "neurons": 10, "activation": "softmax", "position": 2},
        ],
    },
    "mnist_deep": {
        "id": "mnist_deep",
        "name": "Deep MLP",
        "description": "4-layer deep network for improved MNIST accuracy",
        "dataset_id": "mnist",
        "layers": [
            {"type": "input", "neurons": 784, "activation": None, "position": 0},
            {"type": "hidden", "neurons": 256, "activation": "relu", "position": 1},
            {"type": "hidden", "neurons": 128, "activation": "relu", "position": 2},
            {"type": "output", "neurons": 10, "activation": "softmax", "position": 3},
        ],
    },
    # Iris (4 -> 3 classification)
    "iris_simple": {
        "id": "iris_simple",
        "name": "Iris Simple MLP",
        "description": "Single hidden layer for Iris classification",
        "dataset_id": "iris",
        "layers": [
            {"type": "input", "neurons": 4, "activation": None, "position": 0},
            {"type": "hidden", "neurons": 16, "activation": "relu", "position": 1},
            {"type": "output", "neurons": 3, "activation": "softmax", "position": 2},
        ],
    },
    "iris_deep": {
        "id": "iris_deep",
        "name": "Iris Deep MLP",
        "description": "Two hidden layers for Iris classification",
        "dataset_id": "iris",
        "layers": [
            {"type": "input", "neurons": 4, "activation": None, "position": 0},
            {"type": "hidden", "neurons": 32, "activation": "relu", "position": 1},
            {"type": "hidden", "neurons": 16, "activation": "relu", "position": 2},
            {"type": "output", "neurons": 3, "activation": "softmax", "position": 3},
        ],
    },
    # California Housing (8 -> 1 regression)
    "california_simple": {
        "id": "california_simple",
        "name": "California Simple MLP",
        "description": "Single hidden layer for California Housing regression",
        "dataset_id": "california_housing",
        "layers": [
            {"type": "input", "neurons": 8, "activation": None, "position": 0},
            {"type": "hidden", "neurons": 32, "activation": "relu", "position": 1},
            {"type": "output", "neurons": 1, "activation": "linear", "position": 2},
        ],
    },
    "california_deep": {
        "id": "california_deep",
        "name": "California Deep MLP",
        "description": "Two hidden layers for California Housing regression",
        "dataset_id": "california_housing",
        "layers": [
            {"type": "input", "neurons": 8, "activation": None, "position": 0},
            {"type": "hidden", "neurons": 64, "activation": "relu", "position": 1},
            {"type": "hidden", "neurons": 32, "activation": "relu", "position": 2},
            {"type": "output", "neurons": 1, "activation": "linear", "position": 3},
        ],
    },
    # Wine Quality (11 -> 6 classification)
    "wine_simple": {
        "id": "wine_simple",
        "name": "Wine Simple MLP",
        "description": "Single hidden layer for wine quality classification",
        "dataset_id": "wine_quality",
        "layers": [
            {"type": "input", "neurons": 11, "activation": None, "position": 0},
            {"type": "hidden", "neurons": 32, "activation": "relu", "position": 1},
            {"type": "output", "neurons": 6, "activation": "softmax", "position": 2},
        ],
    },
    "wine_deep": {
        "id": "wine_deep",
        "name": "Wine Deep MLP",
        "description": "Two hidden layers for wine quality classification",
        "dataset_id": "wine_quality",
        "layers": [
            {"type": "input", "neurons": 11, "activation": None, "position": 0},
            {"type": "hidden", "neurons": 64, "activation": "relu", "position": 1},
            {"type": "hidden", "neurons": 32, "activation": "relu", "position": 2},
            {"type": "output", "neurons": 6, "activation": "softmax", "position": 3},
        ],
    },
    # Synthetic (2 -> 2 classification)
    "synthetic_simple": {
        "id": "synthetic_simple",
        "name": "Synthetic Simple MLP",
        "description": "Single hidden layer for synthetic XOR/spiral classification",
        "dataset_id": "synthetic",
        "layers": [
            {"type": "input", "neurons": 2, "activation": None, "position": 0},
            {"type": "hidden", "neurons": 16, "activation": "relu", "position": 1},
            {"type": "output", "neurons": 2, "activation": "softmax", "position": 2},
        ],
    },
    "synthetic_deep": {
        "id": "synthetic_deep",
        "name": "Synthetic Deep MLP",
        "description": "Two hidden layers for synthetic XOR/spiral classification",
        "dataset_id": "synthetic",
        "layers": [
            {"type": "input", "neurons": 2, "activation": None, "position": 0},
            {"type": "hidden", "neurons": 32, "activation": "relu", "position": 1},
            {"type": "hidden", "neurons": 16, "activation": "tanh", "position": 2},
            {"type": "output", "neurons": 2, "activation": "softmax", "position": 3},
        ],
    },
}


def list_all_templates() -> List[dict]:
    """Return all available templates."""
    return list(TEMPLATES.values())


def get_template_by_id(template_id: str) -> dict:
    """Get a specific template by ID."""
    return TEMPLATES.get(template_id)


def filter_templates_by_dataset(dataset_id: str) -> List[dict]:
    """Filter templates for a specific dataset."""
    return [t for t in TEMPLATES.values() if t["dataset_id"] == dataset_id]
