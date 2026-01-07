from __future__ import annotations

from typing import Dict, List

import pytest

from backend.api.templates import TEMPLATES, filter_templates_by_dataset, get_template_by_id, list_all_templates
from backend.datasets.registry import get_dataset


def _by_dataset() -> Dict[str, List[dict]]:
    buckets: Dict[str, List[dict]] = {}
    for t in TEMPLATES.values():
        buckets.setdefault(t["dataset_id"], []).append(t)
    return buckets


def test_all_datasets_have_simple_and_deep_templates() -> None:
    by_ds = _by_dataset()
    for dataset_id, templates in by_ds.items():
        ids = {t["id"] for t in templates}
        assert any("simple" in tid for tid in ids), f"{dataset_id} missing simple template"
        assert any("deep" in tid for tid in ids), f"{dataset_id} missing deep template"


def test_template_shapes_match_datasets() -> None:
    """Validate that all templates have correct input/output dimensions matching their datasets."""
    for template_id, template in TEMPLATES.items():
        dataset_id = template["dataset_id"]
        dataset = get_dataset(dataset_id)

        # Get expected dimensions from dataset metadata
        expected_input_dim = dataset.num_features
        expected_output_dim = dataset.num_classes if dataset.task_type == "classification" else 1

        # Validate template structure
        layers = template["layers"]
        assert layers[0]["type"] == "input", f"{template_id}: First layer must be input"
        assert layers[-1]["type"] == "output", f"{template_id}: Last layer must be output"

        # Validate dimensions match dataset
        assert layers[0]["neurons"] == expected_input_dim, (
            f"{template_id}: Input layer has {layers[0]['neurons']} neurons, "
            f"but dataset {dataset_id} has {expected_input_dim} features"
        )
        assert layers[-1]["neurons"] == expected_output_dim, (
            f"{template_id}: Output layer has {layers[-1]['neurons']} neurons, "
            f"but dataset {dataset_id} expects {expected_output_dim} outputs"
        )


def test_filter_and_list_helpers_are_consistent() -> None:
    all_templates = list_all_templates()
    assert len(all_templates) == len(TEMPLATES)
    by_ds = _by_dataset()
    for dataset_id, expected in by_ds.items():
        filtered = filter_templates_by_dataset(dataset_id)
        assert {t["id"] for t in filtered} == {t["id"] for t in expected}


def test_get_template_by_id_returns_none_for_unknown() -> None:
    assert get_template_by_id("does_not_exist") is None


