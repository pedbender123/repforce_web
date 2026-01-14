import os
from typing import Optional

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app/data/manager.db")
    CRM_DATABASE_URL: Optional[str] = os.getenv("CRM_DATABASE_URL") 
    SECRET_KEY: str = os.getenv("SECRET_KEY", "771e84771092e036e52c809e53000b005e83000b005e8300")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 720))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

    # Security Defaults (Dev/Reset only)
    SYSADMIN_DEFAULT_PASSWORD: str = os.getenv("SYSADMIN_DEFAULT_PASSWORD", "1asdfgh.")
    ADMIN_DEFAULT_PASSWORD: str = os.getenv("ADMIN_DEFAULT_PASSWORD", "12345678")
    
    # Integração N8N (Chave estática para segurança de Webhook)
    N8N_API_KEY: str = os.getenv("N8N_API_KEY", "sua_chave_secreta_n8n_aqui_altere_em_producao")

settings = Settings()