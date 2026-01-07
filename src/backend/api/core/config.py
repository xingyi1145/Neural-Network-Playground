from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "FastAPI App" # default names
    DATABASE_URL: str = "sqlite:///./data.db"

    class Config:
        env_file = ".env"

settings = Settings()