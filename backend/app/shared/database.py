
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import event, text

# 1. Configuração da Conexão (PostgreSQL)
def get_database_url():
    """
    Retorna a URL de conexão do PostgreSQL.
    Tenta ler de variáveis de ambiente do Docker ou usa localhost como fallback.
    """
    # Priority 1: DATABASE_URL (Docker)
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL")

    # Priority 2: Build from components
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres")
    server = os.getenv("POSTGRES_HOST", "db") 
    
    # Fallback logic for local dev
    if os.getenv("KUBERNETES_SERVICE_HOST") is None and not os.getenv("POSTGRES_HOST"):
        server = "localhost"
        
    port = os.getenv("POSTGRES_PORT", "5432")
    db = os.getenv("POSTGRES_DB", "repforce")
    return f"postgresql://{user}:{password}@{server}:{port}/{db}"

SQLALCHEMY_DATABASE_URL = get_database_url()

# Engine único com Pool de Conexões
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True, # Auto-reconnect
    pool_size=20,
    max_overflow=10
)

# Sessão "Sistema" (Schema Public / Manager)
SessionSys = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Sessão "CRM" (Schema Tenant) - Será configurada dinamicamente
SessionCrm = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Bases Declarativas
Base = declarative_base() # Base Global (Manager)
BaseCrm = declarative_base() # Base CRM (Tenant)

# Configuração de Schema para Models Globais (Opcional, mas seguro)
# Base.metadata.schema = "public" 

# Dependência: Obter DB de Sistema (Global)
def get_db():
    db = SessionSys()
    try:
        # Garante que está no public
        db.execute(text("SET search_path TO public"))
        yield db
    finally:
        db.close()

from fastapi import Request, HTTPException

# Dependência: Obter DB de CRM (Tenant-Specific)
def get_crm_db(request: Request):
    """
    Retorna uma sessão configurada para o schema do tenant.
    Necessita do request para ler o estado injetado pelo middleware.
    """
    
    tenant_id = None
    if isinstance(request, Request):
       tenant_id = getattr(request.state, "tenant_id", None)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant context missing. Ensure X-Tenant-Slug header is provided.")

    db = SessionCrm()
    try:
        # Use slug if available (set by middleware), or fallback to ID logic (deprecated)
        tenant_slug = getattr(request.state, "tenant_slug", None)
        if tenant_slug:
             # Sanitize slug just in case
             safe_slug = tenant_slug.replace("-", "_")
             schema_name = f"tenant_{safe_slug}"
        elif tenant_id:
             schema_name = f"tenant_{tenant_id}"
        else:
             # Should not happen
             yield None
             return

        # Set Search Path: Tenant First, then Public (for shared funcs if any)
        db.execute(text(f"SET search_path TO \"{schema_name}\", public"))
        yield db
    finally:
        db.close()