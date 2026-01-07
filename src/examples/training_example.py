from backend.training.engine import TrainingEngine
import pprint

# Example for a classification task (MNIST)
print("--- Training MNIST Simple MLP ---")
model_cfg_mnist = {
    "layers": [
        {"type": "input", "neurons": 784, "activation": None, "position": 0},
        {"type": "hidden", "neurons": 128, "activation": "relu", "position": 1},
        {"type": "output", "neurons": 10, "activation": None, "position": 2},  # No softmax for CrossEntropyLoss
    ]
}
engine_mnist = TrainingEngine(dataset_id="mnist", model_config=model_cfg_mnist, device="cpu")
session_mnist = engine_mnist.train(model_id="mnist_example_model")
pprint.pprint(session_mnist.dict())


# Example for a regression task (California Housing)
print("\n--- Training California Housing Regression ---")
model_cfg_housing = {
    "layers": [
        {"type": "input", "neurons": 8, "activation": None, "position": 0},
        {"type": "hidden", "neurons": 64, "activation": "relu", "position": 1},
        {"type": "hidden", "neurons": 32, "activation": "relu", "position": 2},
        {"type": "output", "neurons": 1, "activation": None, "position": 3},
    ]
}
engine_housing = TrainingEngine(dataset_id="california_housing", model_config=model_cfg_housing, device="cpu")
session_housing = engine_housing.train(model_id="housing_example_model")
pprint.pprint(session_housing.dict())
