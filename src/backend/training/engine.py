import uuid
import math
import threading
from datetime import datetime
from typing import Dict, Any, Optional, Tuple, List

import torch
from torch import nn, optim
from torch.utils.data import TensorDataset, DataLoader

import numpy as np
from backend.datasets import get_dataset
from backend.training.models import TrainingSession, TrainingMetric
from backend.models.dynamic_model import DynamicMLPModel

class TrainingEngine:
    def __init__(
        self,
        dataset_id: str,
        model_config: Dict[str, Any],
        device: str = "cpu",
        epochs: Optional[int] = None,
        learning_rate: Optional[float] = None,
        batch_size: Optional[int] = None,
        optimizer: Optional[str] = None,
    ):
        self.dataset_id = dataset_id
        self.model_config = model_config
        self.device = torch.device(device)
        self.session = None
        self.custom_epochs = epochs
        self.custom_lr = learning_rate
        self.custom_batch_size = batch_size
        self.custom_optimizer = optimizer
        # Store the trained model and task info for predictions
        self.trained_model = None
        self.task_type = None
        self.dataset = None
        # Flag to request stopping training
        self._stop_requested = False
        # Pause coordination
        self._pause_requested = False
        self._pause_event = threading.Event()
        self._pause_event.set()

    def request_stop(self) -> None:
        """Request the training loop to stop at the next epoch."""
        self._stop_requested = True
        # If paused, release the wait so we can exit
        self._pause_event.set()

    def request_pause(self) -> None:
        """Request the training loop to pause after the current epoch."""
        self._pause_requested = True
        self._pause_event.clear()

    def resume(self) -> None:
        """Resume a paused training loop."""
        self._pause_requested = False
        self._pause_event.set()

    def _prepare_data(self, max_samples: Optional[int] = None) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor, Any]:
        ds = get_dataset(self.dataset_id, max_samples=max_samples)
        X_train, y_train, X_test, y_test = ds.load(test_size=0.2)
        # Keep dataset instance so we can reuse preprocessing (e.g., scalers) during predict
        self.dataset = ds
        X_train_t = torch.from_numpy(np.asarray(X_train)).float()
        X_test_t = torch.from_numpy(np.asarray(X_test)).float()
        if ds.task_type == "classification":
            y_train_t = torch.from_numpy(np.asarray(y_train)).long()
            y_test_t = torch.from_numpy(np.asarray(y_test)).long()
        else:
            y_train_t = torch.from_numpy(np.asarray(y_train)).float().unsqueeze(1)
            y_test_t = torch.from_numpy(np.asarray(y_test)).float().unsqueeze(1)
        return X_train_t, y_train_t, X_test_t, y_test_t, ds

    def _select_loss(self, task_type: str):
        if task_type == "classification":
            return nn.CrossEntropyLoss()
        return nn.MSELoss()

    def _train_one_epoch(self, loader: DataLoader, model: nn.Module, optimizer, loss_fn, task_type: str) -> Tuple[float, Optional[float]]:
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        for Xb, yb in loader:
            Xb = Xb.to(self.device)
            yb = yb.to(self.device)
            optimizer.zero_grad()
            preds = model(Xb)
            
            # Ensure shapes match for regression
            if task_type != "classification":
                preds = preds.view_as(yb)
                
            loss = loss_fn(preds, yb)
            if torch.isnan(loss).any():
                raise ValueError("NaN loss")
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * Xb.size(0)
            if task_type == "classification":
                pred_classes = preds.argmax(dim=1)
                correct += (pred_classes == yb).sum().item()
                total += yb.size(0)
        avg_loss = running_loss / len(loader.dataset)
        acc = (correct / total) if task_type == "classification" else None
        return avg_loss, acc

    def _check_for_failures(self, loss: float) -> Optional[str]:
        if math.isnan(loss):
            return "NaN loss detected"
        # Stagnation or divergence are warnings but no longer stop training
        return None

    def train(self, model_id: Optional[str] = None) -> TrainingSession:
        # Resolve epochs early to avoid race condition in API response
        # If custom epochs provided, use them. Otherwise default to 0 and let it update later (or peek dataset)
        initial_epochs = self.custom_epochs if self.custom_epochs is not None else 0

        session_id = str(uuid.uuid4())
        start_time = datetime.utcnow()
        self.session = TrainingSession(
            session_id=session_id,
            model_id=model_id,
            dataset_id=self.dataset_id,
            status="running",
            start_time=start_time,
            total_epochs=initial_epochs,
        )
        try:
            X_train, y_train, X_test, y_test, ds = self._prepare_data()
            hp = ds.hyperparameters
            
            # Override with custom hyperparameters if provided
            epochs = self.custom_epochs if self.custom_epochs is not None else hp.epochs
            lr = self.custom_lr if self.custom_lr is not None else hp.learning_rate
            batch_size = self.custom_batch_size if self.custom_batch_size is not None else hp.batch_size
            # optimizer_name = self.custom_optimizer if self.custom_optimizer else hp.optimizer # TODO: Implement optimizer switching

            self.session.total_epochs = epochs

            train_ds = TensorDataset(X_train, y_train)
            loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)

            # Build config for teammate's DynamicMLPModel
            # Extract output_dim from last layer in config
            layers = self.model_config["layers"]
            output_neurons = layers[-1]["neurons"] if layers else 1
            
            model_cfg = {
                "input_dim": ds.num_features,
                "output_dim": output_neurons,
                "task_type": ds.task_type,
                "layers": layers
            }
            model = DynamicMLPModel(model_cfg).to(self.device)
            
            # Select optimizer
            opt_name = (self.custom_optimizer or "adam").lower()
            if opt_name == "sgd":
                optimizer = optim.SGD(model.parameters(), lr=lr)
            elif opt_name == "rmsprop":
                optimizer = optim.RMSprop(model.parameters(), lr=lr)
            elif opt_name == "adagrad":
                optimizer = optim.Adagrad(model.parameters(), lr=lr)
            else:
                optimizer = optim.Adam(model.parameters(), lr=lr)

            print(
                f"[training] session={session_id} model={model_id} dataset={self.dataset_id} "
                f"epochs={epochs} lr={lr} batch_size={batch_size} optimizer={opt_name}"
            )

            loss_fn = self._select_loss(ds.task_type)

            for epoch in range(1, epochs + 1):
                # Check if stop was requested
                if self._stop_requested:
                    self.session.status = "stopped"
                    self.session.error_message = "Training stopped by user"
                    break

                self.session.current_epoch = epoch
                avg_loss, acc = self._train_one_epoch(loader, model, optimizer, loss_fn, ds.task_type)
                
                metric = TrainingMetric(epoch=epoch, loss=float(avg_loss), accuracy=(float(acc) if acc is not None else None), timestamp=datetime.utcnow())
                self.session.metrics.append(metric)

                err = self._check_for_failures(avg_loss)
                if err:
                    self.session.status = "failed"
                    self.session.error_message = err
                    break

                # Handle pause requests after completing an epoch
                if self._pause_requested:
                    self.session.status = "paused"
                    while self._pause_requested and not self._stop_requested:
                        self._pause_event.wait(timeout=0.25)
                    if self._stop_requested:
                        self.session.status = "stopped"
                        self.session.error_message = "Training stopped by user"
                        break
                    self.session.status = "running"
            else:
                self.session.status = "completed"
                # Store the trained model for predictions
                self.trained_model = model
                self.task_type = ds.task_type
        except Exception as e:
            self.session.status = "failed"
            self.session.error_message = str(e)
        finally:
            self.session.end_time = datetime.utcnow()
        return self.session

    def predict(self, inputs: List[float]) -> Dict[str, Any]:
        """Run prediction on trained model."""
        if self.trained_model is None:
            raise ValueError("Model has not been trained yet")
        if self.dataset is None:
            raise ValueError("Dataset context missing; cannot preprocess inputs")
        
        self.trained_model.eval()
        # Apply the same preprocessing used during training (e.g., StandardScaler)
        if hasattr(self.dataset, "transform_inputs"):
            processed_inputs = self.dataset.transform_inputs(inputs)
        else:
            processed_inputs = np.asarray(inputs, dtype=np.float32).reshape(1, -1)

        input_tensor = torch.tensor(processed_inputs, dtype=torch.float32).to(self.device)
        with torch.no_grad():
            output = self.trained_model(input_tensor)
            
            if self.task_type == "classification":
                # Apply softmax to get probabilities
                probabilities = torch.softmax(output, dim=1)[0].cpu().numpy().tolist()
                predicted_class = int(torch.argmax(output, dim=1).item())
                confidence = float(probabilities[predicted_class])
                
                return {
                    "prediction": predicted_class,
                    "probabilities": probabilities,
                    "confidence": confidence,
                }
            else:
                # Regression
                prediction = float(output[0].item())
                return {
                    "prediction": prediction,
                }
