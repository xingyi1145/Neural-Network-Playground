from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel

class TrainingMetric(BaseModel):
    epoch: int
    loss: float
    accuracy: Optional[float] = None
    timestamp: datetime

class TrainingSession(BaseModel):
    session_id: str
    model_id: Optional[str] = None
    dataset_id: str
    status: Literal["pending", "running", "paused", "stopped", "completed", "failed"]
    start_time: datetime
    end_time: Optional[datetime] = None
    total_epochs: int
    current_epoch: int = 0
    metrics: List[TrainingMetric] = []
    error_message: Optional[str] = None
