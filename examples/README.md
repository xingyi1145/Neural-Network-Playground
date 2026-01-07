# Examples

Standalone executable examples demonstrating Neural Network Playground features.

## Current Examples

- `model_construction_example.py` - Build `DynamicMLPModel` from JSON/dict-style configs for:
  - MNIST-style classification (logits + CrossEntropyLoss)
  - California Housing-style regression (predictions + MSELoss)
  - Uses random data only and runs in a few seconds

## Running Examples

```bash
# From project root
source .venv/bin/activate
python examples/model_construction_example.py
```

## Adding New Examples

Requirements:
1. Must run standalone without modifications
2. Include docstring with usage and expected output
3. Add entry to this README
