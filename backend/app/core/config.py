from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # REMOVEMOS a classe 'Config'. O Pydantic (BaseSettings)
    # automaticamente já lê as variáveis do ambiente do contêiner,
    # que é exatamente o que o docker-compose (com env_file) faz.
    # Não precisamos mais que o Python leia o .env.

settings = Settings()