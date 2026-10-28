from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/assistencia"
    SECRET_KEY: str = "troque-esta-chave-em-producao"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 horas
    CORS_ORIGINS: str = "http://localhost:5173"
    # Opcional: se definido, o "Primeiro acesso" exige este código (protege um site recém-publicado)
    SETUP_TOKEN: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
