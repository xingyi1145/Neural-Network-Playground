from __future__ import annotations

from typing import Any, Dict

import pytest
import torch

from backend.models import DynamicMLPModel, ModelConfigError


def _build_basic_mnist_config() -> Dict[str, Any]:
    return {
        "input_dim": 784,
        "output_dim": 10,
        "task_type": "classification",
        "layers": [
            {"type": "input", "neurons": 784},
            {"type": "hidden", "neurons": 128, "activation": "ReLU"},
            # Final Softmax accepted but ignored; model returns logits.
            {"type": "output", "neurons": 10, "activation": "Softmax"},
        ],
    }


def _build_basic_regression_config() -> Dict[str, Any]:
    return {
        "input_dim": 8,
        "output_dim": 1,
        "task_type": "regression",
        "layers": [
            {"type": "input", "neurons": 8},
            {"type": "hidden", "neurons": 16, "activation": "ReLU"},
            {"type": "output", "neurons": 1, "activation": "Linear"},
        ],
    }


class TestClassificationModel:
    def test_logits_and_loss_shape(self) -> None:
        cfg = _build_basic_mnist_config()
        model = DynamicMLPModel(cfg)

        x = torch.randn(32, cfg["input_dim"])
        y = torch.randint(0, cfg["output_dim"], (32,))

        logits = model(x)
        assert logits.shape == (32, cfg["output_dim"])

        logits2, loss = model(x, y)
        assert logits2.shape == (32, cfg["output_dim"])
        assert loss.dim() == 0  # scalar tensor

    def test_hidden_softmax_allowed(self) -> None:
        cfg = _build_basic_mnist_config()
        # Insert Softmax on a hidden layer
        cfg["layers"].insert(
            2, {"type": "hidden", "neurons": 64, "activation": "Softmax"}
        )
        model = DynamicMLPModel(cfg)

        x = torch.randn(8, cfg["input_dim"])
        logits = model(x)
        assert logits.shape == (8, cfg["output_dim"])


class TestRegressionModel:
    def test_predictions_and_loss_shape(self) -> None:
        cfg = _build_basic_regression_config()
        model = DynamicMLPModel(cfg)

        x = torch.randn(16, cfg["input_dim"])
        y = torch.randn(16)

        preds = model(x)
        assert preds.shape == (16,)

        preds2, loss = model(x, y)
        assert preds2.shape == (16,)
        assert loss.dim() == 0

    def test_invalid_final_activation_regression_raises(self) -> None:
        cfg = _build_basic_regression_config()
        cfg["layers"][-1]["activation"] = "ReLU"

        with pytest.raises(ModelConfigError):
            DynamicMLPModel(cfg)


class TestValidationErrors:
    def test_num_parameters_and_output_shape(self) -> None:
        cfg = _build_basic_mnist_config()
        model = DynamicMLPModel(cfg)

        # At least one trainable parameter and correct output shape metadata.
        assert model.num_parameters > 0
        assert model.output_shape == (cfg["output_dim"],)

        reg_cfg = _build_basic_regression_config()
        reg_model = DynamicMLPModel(reg_cfg)
        # For 1D regression, output_shape should be empty tuple.
        assert reg_model.output_shape == ()

    def test_invalid_task_type_raises(self) -> None:
        cfg = _build_basic_mnist_config()
        cfg["task_type"] = "classify"

        with pytest.raises(ModelConfigError):
            DynamicMLPModel(cfg)

    def test_missing_required_fields_raise(self) -> None:
        cfg = _build_basic_mnist_config()
        cfg.pop("input_dim")

        with pytest.raises(ModelConfigError):
            DynamicMLPModel(cfg)

    def test_mismatched_input_dim_raises(self) -> None:
        cfg = _build_basic_mnist_config()
        cfg["input_dim"] = 100  # does not match input layer neurons

        with pytest.raises(ModelConfigError):
            DynamicMLPModel(cfg)

    def test_mismatched_output_dim_raises(self) -> None:
        cfg = _build_basic_mnist_config()
        cfg["output_dim"] = 5  # does not match output layer neurons

        with pytest.raises(ModelConfigError):
            DynamicMLPModel(cfg)

    def test_invalid_layer_type_raises(self) -> None:
        cfg = _build_basic_mnist_config()
        cfg["layers"][1]["type"] = "weird"

        with pytest.raises(ModelConfigError):
            DynamicMLPModel(cfg)

    def test_invalid_activation_name_raises(self) -> None:
        cfg = _build_basic_mnist_config()
        cfg["layers"][1]["activation"] = "LeakyReLU"

        with pytest.raises(ModelConfigError):
            DynamicMLPModel(cfg)

    def test_layers_must_not_be_empty(self) -> None:
        cfg = _build_basic_mnist_config()
        cfg["layers"] = []

        with pytest.raises(ModelConfigError):
            DynamicMLPModel(cfg)

    def test_case_insensitive_task_and_activation(self) -> None:
        cfg = _build_basic_mnist_config()
        cfg["task_type"] = "CLASSIFICATION"
        cfg["layers"][1]["activation"] = "tanh"

        model = DynamicMLPModel(cfg)
        x = torch.randn(4, cfg["input_dim"])
        logits = model(x)
        assert logits.shape == (4, cfg["output_dim"])

    def test_from_json_helper(self) -> None:
        cfg = _build_basic_mnist_config()
        import json

        json_str = json.dumps(cfg)
        model = DynamicMLPModel.from_json(json_str)

        x = torch.randn(2, cfg["input_dim"])
        logits = model(x)
        assert logits.shape == (2, cfg["output_dim"])

    def test_from_json_invalid_string_raises(self) -> None:
        with pytest.raises(ModelConfigError):
            DynamicMLPModel.from_json("not valid json")

