from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Mapping, Optional, Sequence, Tuple, Union

import torch
import torch.nn as nn
import torch.nn.functional as F


class ModelConfigError(ValueError):
    """Raised when a dynamic model configuration is invalid."""


@dataclass(frozen=True)
class LayerSpec:
    """Normalized representation of a single layer in the MLP."""

    type: str  # "input" | "hidden" | "output"
    neurons: int
    activation: Optional[str]  # normalized lower-case name or None


SUPPORTED_ACTIVATIONS: Dict[str, str] = {
    "relu": "relu",
    "sigmoid": "sigmoid",
    "tanh": "tanh",
    "softmax": "softmax",
    "linear": "linear",
}


def _normalize_activation(name: Optional[str]) -> Optional[str]:
    if name is None:
        return None
    normalized = str(name).strip().lower()
    if normalized not in SUPPORTED_ACTIVATIONS:
        raise ModelConfigError(
            f"Unsupported activation '{name}'. "
            f"Supported: {sorted(SUPPORTED_ACTIVATIONS.keys())}."
        )
    return normalized


def _ensure_positive_int(value: Any, field_name: str) -> int:
    try:
        int_value = int(value)
    except (TypeError, ValueError) as exc:
        raise ModelConfigError(f"Field '{field_name}' must be an integer.") from exc
    if int_value <= 0:
        raise ModelConfigError(f"Field '{field_name}' must be > 0 (got {int_value}).")
    return int_value


class DynamicMLPModel(nn.Module):
    """Dynamic Multi-Layer Perceptron built from a JSON/dict specification.

    The configuration must include:
    - input_dim (int)
    - output_dim (int)
    - task_type ("classification" or "regression")
    - layers: list of {type, neurons, activation}

    For classification, the model always returns logits suitable for
    torch.nn.CrossEntropyLoss, even if the final activation is specified
    as "softmax" in the configuration.
    """

    def __init__(self, config: Union[str, Mapping[str, Any]]) -> None:
        super().__init__()
        parsed = self._parse_config(config)
        (
            self.input_dim,
            self.output_dim,
            self.task_type,
            self._layers,
            self.config,
        ) = self._validate_and_normalize(parsed)
        self.network = self._build_network(self._layers)

    @classmethod
    def from_json(cls, config_json: str) -> "DynamicMLPModel":
        """Construct model from a JSON string."""
        return cls(config_json)

    @staticmethod
    def _parse_config(config: Union[str, Mapping[str, Any]]) -> Dict[str, Any]:
        if isinstance(config, str):
            try:
                parsed = json.loads(config)
            except json.JSONDecodeError as exc:
                raise ModelConfigError(f"Invalid JSON: {exc}") from exc
            if not isinstance(parsed, Mapping):
                raise ModelConfigError("Top-level JSON must be an object.")
            return dict(parsed)
        if isinstance(config, Mapping):
            return dict(config)
        raise ModelConfigError(
            "Config must be a dict or JSON string describing the model."
        )

    @staticmethod
    def _validate_and_normalize(
        config: Mapping[str, Any]
    ) -> Tuple[int, int, str, List[LayerSpec], Dict[str, Any]]:
        # Required fields
        required_fields = ("input_dim", "output_dim", "task_type", "layers")
        for field in required_fields:
            if field not in config:
                raise ModelConfigError(f"Missing required field '{field}'.")

        input_dim = _ensure_positive_int(config["input_dim"], "input_dim")
        output_dim = _ensure_positive_int(config["output_dim"], "output_dim")

        raw_task_type = str(config["task_type"]).strip().lower()
        if raw_task_type not in ("classification", "regression"):
            raise ModelConfigError(
                f"Invalid task_type '{config['task_type']}'. "
                "Expected 'classification' or 'regression'."
            )
        task_type = raw_task_type

        layers_raw = config["layers"]
        if not isinstance(layers_raw, Iterable) or isinstance(layers_raw, (str, bytes)):
            raise ModelConfigError("Field 'layers' must be a list of layer objects.")

        layers: List[LayerSpec] = []
        for idx, layer in enumerate(layers_raw):
            if not isinstance(layer, Mapping):
                raise ModelConfigError(
                    f"Layer at index {idx} must be an object with type/neurons/activation."
                )
            if "type" not in layer or "neurons" not in layer:
                raise ModelConfigError(
                    f"Layer at index {idx} must include 'type' and 'neurons'."
                )
            layer_type = str(layer["type"]).strip().lower()
            if layer_type not in ("input", "hidden", "output"):
                raise ModelConfigError(
                    f"Invalid layer type '{layer['type']}' at index {idx}. "
                    "Expected 'input', 'hidden', or 'output'."
                )

            neurons = _ensure_positive_int(layer["neurons"], f"layers[{idx}].neurons")

            activation = layer.get("activation")
            # Allow null/None or explicit "linear" as identity.
            normalized_activation = _normalize_activation(activation) if activation is not None else None

            layers.append(
                LayerSpec(
                    type=layer_type,
                    neurons=neurons,
                    activation=normalized_activation,
                )
            )

        if not layers:
            raise ModelConfigError("Field 'layers' must contain at least one layer.")

        # Structural checks
        first, last = layers[0], layers[-1]
        if first.type != "input":
            raise ModelConfigError(
                "First layer must be of type 'input'. "
                f"Got '{first.type}' instead."
            )
        if last.type != "output":
            raise ModelConfigError(
                "Last layer must be of type 'output'. "
                f"Got '{last.type}' instead."
            )

        for idx, layer in enumerate(layers[1:-1], start=1):
            if layer.type != "hidden":
                raise ModelConfigError(
                    "All intermediate layers must be of type 'hidden'. "
                    f"Layer at index {idx} is '{layer.type}'."
                )

        if first.neurons != input_dim:
            raise ModelConfigError(
                "Input layer neurons must match input_dim. "
                f"Got neurons={first.neurons}, input_dim={input_dim}."
            )

        if last.neurons != output_dim:
            raise ModelConfigError(
                "Output layer neurons must match output_dim. "
                f"Got neurons={last.neurons}, output_dim={output_dim}."
            )

        # Activation constraints on final layer
        final_activation = last.activation
        if task_type == "classification":
            # We always return logits for CrossEntropyLoss.
            # If final activation is softmax, we accept the config but ignore
            # the activation when building the network.
            if final_activation not in (None, "linear", "softmax"):
                raise ModelConfigError(
                    "For classification with CrossEntropyLoss, the final layer "
                    "activation must be 'linear', 'softmax', or omitted."
                )
        else:  # regression
            if final_activation not in (None, "linear"):
                raise ModelConfigError(
                    "For regression with MSELoss, the final layer activation "
                    "must be 'linear' or omitted."
                )

        # Return normalized config snapshot for debugging/introspection
        normalized_config: Dict[str, Any] = {
            "input_dim": input_dim,
            "output_dim": output_dim,
            "task_type": task_type,
            "layers": [
                {
                    "type": layer.type,
                    "neurons": layer.neurons,
                    "activation": layer.activation,
                }
                for layer in layers
            ],
        }

        return input_dim, output_dim, task_type, layers, normalized_config

    @staticmethod
    def _build_network(layers: Sequence[LayerSpec]) -> nn.Sequential:
        modules: List[nn.Module] = []
        # Skip input layer for modules; it only defines the input dimension.
        prev_dim = layers[0].neurons
        for idx, layer in enumerate(layers[1:], start=1):
            # Linear projection
            modules.append(nn.Linear(prev_dim, layer.neurons))
            prev_dim = layer.neurons

            is_final = idx == len(layers) - 1
            activation = layer.activation

            # For the final layer, we intentionally do NOT add softmax for
            # classification tasks; the model returns logits.
            if is_final:
                if activation is None or activation == "linear":
                    continue
                if activation == "softmax":
                    # Ignore final softmax; logits only.
                    continue
                # Other invalid final activations are already rejected in validation.
                continue

            # Hidden layer activations
            if activation is None or activation == "linear":
                continue
            if activation == "relu":
                modules.append(nn.ReLU())
            elif activation == "sigmoid":
                modules.append(nn.Sigmoid())
            elif activation == "tanh":
                modules.append(nn.Tanh())
            elif activation == "softmax":
                modules.append(nn.Softmax(dim=1))
            else:
                # Should not happen due to validation, but keep defensive.
                raise ModelConfigError(
                    f"Unexpected activation '{activation}' during network build."
                )

        return nn.Sequential(*modules)

    @property
    def num_parameters(self) -> int:
        """Total number of trainable parameters."""

        return sum(p.numel() for p in self.parameters() if p.requires_grad)

    @property
    def output_shape(self) -> Tuple[int, ...]:
        """Output feature shape (excluding batch dimension)."""

        if self.output_dim == 1 and self.task_type == "regression":
            return ()
        return (self.output_dim,)

    def forward(
        self, x: torch.Tensor, y: Optional[torch.Tensor] = None
    ) -> Union[torch.Tensor, Tuple[torch.Tensor, torch.Tensor]]:
        """Forward pass.

        Args:
            x: Input tensor of shape (batch_size, input_dim).
            y: Optional target tensor. For classification, integer class labels.
               For regression, float targets.

        Returns:
            If y is None: model outputs (logits for classification, predictions for regression).
            If y is provided: (outputs, loss) where loss is a scalar tensor.
        """

        outputs = self.network(x)

        if self.task_type == "regression" and self.output_dim == 1:
            # Match regression datasets that use shape (batch_size,) for targets.
            outputs = outputs.squeeze(-1)

        if y is None:
            return outputs

        if self.task_type == "classification":
            loss = F.cross_entropy(outputs, y.long())
        else:
            loss = F.mse_loss(outputs, y.float())

        return outputs, loss


