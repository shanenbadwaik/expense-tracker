from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALLOWED_ORIGIN: str = "http://localhost:3000"
    FRONTEND_URL: str = "http://localhost:3000"

    # Brevo — leave blank to print emails to the console (dev mode)
    BREVO_API_KEY: str = ""
    MAIL_FROM: str = "shanenbadwaik1234@gmail.com"
    MAIL_FROM_NAME: str = "Cairn"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
