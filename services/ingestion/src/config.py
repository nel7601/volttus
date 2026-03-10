from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    emporia_encryption_key: str
    poll_interval_minutes: int = 15
    log_level: str = "INFO"

    class Config:
        env_file = ".env"


settings = Settings()
