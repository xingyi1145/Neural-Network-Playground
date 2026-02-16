import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from backend.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class ModelConfigDB(Base):
    __tablename__ = "model_configs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    dataset_id = Column(String, nullable=False)
    description = Column(String(500), nullable=True)
    layers = Column(JSON, nullable=False)
    status = Column(String(20), nullable=False, default="created")
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow)

    training_sessions = relationship("TrainingSessionDB", back_populates="model")


class TrainingSessionDB(Base):
    __tablename__ = "training_sessions"

    session_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_id = Column(String, ForeignKey("model_configs.id"), nullable=True)
    dataset_id = Column(String, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    total_epochs = Column(Integer, nullable=False, default=0)
    current_epoch = Column(Integer, nullable=False, default=0)
    start_time = Column(DateTime(timezone=True), nullable=False, default=_utcnow)
    end_time = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    model = relationship("ModelConfigDB", back_populates="training_sessions")
    metrics = relationship(
        "TrainingMetricsDB",
        back_populates="session",
        order_by="TrainingMetricsDB.epoch",
    )


class TrainingMetricsDB(Base):
    __tablename__ = "training_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(
        String, ForeignKey("training_sessions.session_id"), nullable=False
    )
    epoch = Column(Integer, nullable=False)
    loss = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=_utcnow)

    session = relationship("TrainingSessionDB", back_populates="metrics")
