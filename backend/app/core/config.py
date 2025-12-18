from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    CRM_DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12 # 12 horas padrão
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7 # 7 dias para "Lembrar de mim"
    
    # Integração N8N (Chave estática para segurança de Webhook)
    N8N_API_KEY: str = "sua_chave_secreta_n8n_aqui_altere_em_producao"

settings = Settings()