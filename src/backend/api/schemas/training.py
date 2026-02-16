from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, PositiveInt, field_validator

_ALLOWED_ACTIVATIONS = {"relu", "sigmoid", "tanh", "softmax", "linear"}


class LayerConfig(BaseModel):
    """Layer specification mirroring the visual builder payload."""

    type: Literal["input", "hidden", "output"]
    neurons: PositiveInt = Field(..., description="Number of neurons in the layer")
    activation: Optional[str] = Field(
        default=None,
        description="Activation function name (case-insensitive)",
    )
    position: Optional[int] = Field(
        default=None,
        ge=0,
        description="Optional ordering hint from the client UI",
    )

    @field_validator("activation")
    @classmethod
    def _normalize_activation(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip().lower()
        if normalized not in _ALLOWED_ACTIVATIONS:
            raise ValueError(
                f"Unsupported activation '{value}'. Allowed: {sorted(_ALLOWED_ACTIVATIONS)}"
            )
        return normalized


class TrainingStartRequest(BaseModel):
    dataset_id: Optional[str] = Field(
        default=None,
        description="Dataset identifier to train against (falls back to stored model metadata)",
    )
    layers: Optional[List[LayerConfig]] = Field(
        default=None,
        description="Full model architecture definition; optional when model registry has it",
    )
    max_samples: Optional[int] = Field(
        default=None,
        gt=0,
        le=60000,
        description="Optional sample cap to speed up experimentation",
    )
    epochs: Optional[int] = Field(
        default=None,
        ge=1,
        description="Number of training epochs",
    )
    learning_rate: Optional[float] = Field(
        default=None,
        gt=0.0,
        description="Learning rate for the optimizer",
    )
    batch_size: Optional[int] = Field(
        default=None,
        ge=1,
        description="Batch size for training",
    )
    optimizer: Optional[str] = Field(
        default=None,
        description="Optimizer name (e.g., 'adam', 'sgd')",
    )

    @field_validator("layers")
    @classmethod
    def _ensure_layers_not_empty(
        cls, value: Optional[List[LayerConfig]]
    ) -> Optional[List[LayerConfig]]:
        if value is None:
            return value
        if len(value) < 2:
            raise ValueError("Model must contain at least an input and output layer")
        return value


class TrainingMetricPayload(BaseModel):
    epoch: int
    loss: float
    accuracy: Optional[float] = None
    timestamp: datetime


class TrainingStartResponse(BaseModel):
    session_id: str
    status: Literal["pending", "running", "paused", "completed", "failed", "stopped"]
    total_epochs: int
    poll_interval_seconds: float = Field(
        default=1.5,
        description="Recommended minimum seconds clients should wait before polling again",
    )


class TrainingStatusResponse(BaseModel):
    session_id: str
    model_id: str
    dataset_id: str
    status: Literal["pending", "running", "paused", "completed", "failed", "stopped"]
    current_epoch: int
    total_epochs: int
    progress: float = Field(
        ..., ge=0.0, le=1.0, description="Fractional progress through total epochs"
    )
    metrics: List[TrainingMetricPayload]
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    poll_interval_seconds: float = Field(
        default=1.0,
        description="Recommended delay before the next poll (seconds)",
    )
