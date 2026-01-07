"""
Loads all registered templates and prints their dataset, id, and layer shapes.

Run with:
    PYTHONPATH=src python examples/template_usage_example.py
"""
from __future__ import annotations

from typing import Dict, List, Tuple

from backend.api.templates import TEMPLATES


def _layer_shapes(template: dict) -> List[Tuple[int, int]]:
    """Return (in_features, out_features) per Linear layer implied by template."""
    layers = template["layers"]
    shapes: List[Tuple[int, int]] = []
    prev = None
    for layer in layers:
        neurons = int(layer["neurons"])
        if prev is not None:
            shapes.append((prev, neurons))
        prev = neurons
    return shapes


def main() -> None:
    by_dataset: Dict[str, List[dict]] = {}
    for t in TEMPLATES.values():
        by_dataset.setdefault(t["dataset_id"], []).append(t)

    for dataset_id, templates in sorted(by_dataset.items()):
        print(f"Dataset: {dataset_id}")
        for tpl in sorted(templates, key=lambda t: t["id"]):
            shapes = _layer_shapes(tpl)
            shape_str = " → ".join(f"{i}->{o}" for i, o in shapes)
            print(f"  {tpl['id']}: {shape_str}")


if __name__ == "__main__":
    main()


