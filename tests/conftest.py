import pytest

from backend.database import Base, SessionLocal, engine
from backend.db_models import (  # noqa: F401
    ModelConfigDB,
    TrainingMetricsDB,
    TrainingSessionDB,
)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
