from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "FastAPI App" # default names
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/nn_playground"

    class Config:
        env_file = ".env"

settings = Settings()