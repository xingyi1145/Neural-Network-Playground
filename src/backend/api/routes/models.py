"""
Model configuration API endpoints.

Provides MVP endpoints to create and retrieve model configurations that
frontends can send as JSON. Models are stored in-memory so the data is reset
whenever the process restarts. Validation enforces simple structural rules so
users cannot create unusable graphs.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, conint

from backend.datasets import list_datasets

router = APIRouter(prefix="/api/models", tags=["models"])

ALLOWED_LAYER_TYPES = {"input", "hidden", "output"}
ALLOWED_ACTIVATIONS = {
    None,
    "relu",
    "sigmoid",
    "tanh",
    "softmax",
    "gelu",
    "leaky_relu",
    "selu",
    "elu",
    "softplus",
    "linear",
}

MODEL_STORE: Dict[str, "ModelResponse"] = {}


class LayerConfig(BaseModel):
    """Single layer description supplied by the frontend."""

    type: str = Field(..., description="Layer kind such as input, hidden, output")
    neurons: conint(gt=0) = Field(..., description="Number of units/neurons in the layer")
    activation: Optional[str] = Field(
        default=None,
        description="Activation function (None for input layers)",
        max_length=32,
    )
    position: conint(ge=0) = Field(..., description="Zero-indexed layer order")

    class Config:
        schema_extra = {
            "example": {
                "type": "hidden",
                "neurons": 128,
                "activation": "relu",
                "position": 1,
            }
        }


class ModelCreateRequest(BaseModel):
    """Incoming payload for POST /api/models."""

    name: Optional[str] = Field(
        default=None,
        description="Human friendly label shown in UI",
        min_length=1,
        max_length=100,
    )
    description: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional description provided by the creator",
    )
    dataset_id: str = Field(..., min_length=1, description="Dataset the model was built for")
    layers: List[LayerConfig] = Field(
        ...,
        min_items=2,
        description="Ordered list of layer configurations",
    )

    class Config:
        schema_extra = {
            "example": {
                "name": "Custom MNIST model",
                "dataset_id": "mnist",
                "layers": [
                    {"type": "input", "neurons": 784, "activation": None, "position": 0},
                    {"type": "hidden", "neurons": 128, "activation": "relu", "position": 1},
                    {"type": "output", "neurons": 10, "activation": "softmax", "position": 2},
                ],
            }
        }


class ModelResponse(BaseModel):
    """Representation returned from the API."""

    id: str
    name: str
    dataset_id: str
    description: Optional[str]
    layers: List[LayerConfig]
    created_at: datetime
    status: str

    class Config:
        orm_mode = True


def _ensure_dataset_exists(dataset_id: str) -> None:
    available_datasets = set(list_datasets())
    if dataset_id not in available_datasets:
        raise HTTPException(
            status_code=400,
            detail=f"Dataset '{dataset_id}' is not registered. Available: {sorted(available_datasets)}",
        )


def _validate_layers(layers: List[LayerConfig]) -> List[LayerConfig]:
    if len(layers) < 2:
        raise HTTPException(status_code=400, detail="Provide at least input and output layers")

    sorted_layers = sorted(layers, key=lambda layer: layer.position)
    expected_positions = list(range(len(sorted_layers)))
    actual_positions = [layer.position for layer in sorted_layers]
    if actual_positions != expected_positions:
        raise HTTPException(
            status_code=400,
            detail="Layer positions must be contiguous starting at 0",
        )

    type_counts = {layer_type: 0 for layer_type in ALLOWED_LAYER_TYPES}
    normalized_layers: List[LayerConfig] = []
    for layer in sorted_layers:
        layer_type = layer.type.lower()
        if layer_type not in ALLOWED_LAYER_TYPES:
            allowed = ", ".join(sorted(ALLOWED_LAYER_TYPES))
            raise HTTPException(status_code=400, detail=f"Layer type must be one of: {allowed}")

        activation = layer.activation.lower() if isinstance(layer.activation, str) else None
        if activation not in ALLOWED_ACTIVATIONS:
            allowed = sorted(filter(None, ALLOWED_ACTIVATIONS))
            raise HTTPException(status_code=400, detail=f"Activation must be one of {allowed} or null")

        type_counts[layer_type] += 1
        if layer_type == "input" and activation not in (None, "linear"):
            raise HTTPException(status_code=400, detail="Input layers cannot define an activation")

        normalized_layers.append(
            LayerConfig(
                type=layer_type,
                neurons=layer.neurons,
                activation=activation,
                position=layer.position,
            )
        )

    if type_counts["input"] != 1 or type_counts["output"] != 1:
        raise HTTPException(status_code=400, detail="Models require exactly one input and one output layer")

    if normalized_layers[0].type != "input" or normalized_layers[-1].type != "output":
        raise HTTPException(status_code=400, detail="Layers must start with input and end with output")

    return normalized_layers


def _build_model_record(
    model_id: str,
    payload: ModelCreateRequest,
    layers: List[LayerConfig],
) -> ModelResponse:
    created_at = datetime.now(timezone.utc)
    name = payload.name or f"{payload.dataset_id}_model"
    return ModelResponse(
        id=model_id,
        name=name,
        dataset_id=payload.dataset_id,
        description=payload.description,
        layers=layers,
        created_at=created_at,
        status="created",
    )


@router.post("", response_model=ModelResponse, status_code=201)
def create_model(config: ModelCreateRequest) -> ModelResponse:
    """
    Create a model configuration from a list of layers.
    """
    _ensure_dataset_exists(config.dataset_id)
    validated_layers = _validate_layers(config.layers)
    model_id = str(uuid4())
    record = _build_model_record(model_id, config, validated_layers)
    MODEL_STORE[model_id] = record
    return record


@router.get("/{model_id}", response_model=ModelResponse)
def get_model(model_id: str) -> ModelResponse:
    """
    Retrieve a previously created model configuration.
    """
    try:
        return MODEL_STORE[model_id]
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found") from exc


def clear_model_store() -> None:
    """Helper used by tests to start from a clean in-memory store."""
    MODEL_STORE.clear()


__all__ = [
    "router",
    "MODEL_STORE",
    "ModelCreateRequest",
    "ModelResponse",
    "LayerConfig",
    "clear_model_store",
]
