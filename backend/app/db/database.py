from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings
from fastapi import Request

# 1. Engine Única
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# 2. Sessão Padrão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Bases (Apenas para organização lógica, ambas usam a mesma engine)
CoreBase = declarative_base()
TenantBase = declarative_base()

def get_db(request: Request):
    """
    Gerencia a sessão do banco.
    Se o middleware identificou um Tenant, muda o "foco" (search_path) para ele.
    """
    db = SessionLocal()
    try:
        if hasattr(request.state, "tenant_schema") and request.state.tenant_schema:
            schema = request.state.tenant_schema
            # CRUCIAL: "SET search_path TO tenant_x, public"
            # Isso diz ao banco: "Procure primeiro no tenant_x. Se não achar, procure no public".
            # Assim, tabelas de negócio (Orders) e sistêmicas (Users) funcionam juntas.
            db.execute(text(f"SET search_path TO {schema}, public"))
        
        yield db
    finally:
        db.close()