from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings
from fastapi import Request

# 1. Engine Única (O "Prédio")
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# 2. Sessão Padrão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Bases Separadas para Organização
# CoreBase: Tabelas que ficam no esquema 'public' (Users, Tenants)
CoreBase = declarative_base()

# TenantBase: Tabelas que serão criadas DENTRO de cada esquema (Clients, Orders)
TenantBase = declarative_base()

def get_db(request: Request):
    """
    Injeção de Dependência Mágica.
    1. Abre a sessão.
    2. Se tiver um schema definido no request (pelo middleware), muda o foco para ele.
    3. Se não, fica no 'public'.
    """
    db = SessionLocal()
    try:
        # O Middleware já decidiu qual é o esquema (ex: "tenant_cocacola")
        if hasattr(request.state, "tenant_schema") and request.state.tenant_schema:
            schema = request.state.tenant_schema
            # O COMANDO MÁGICO: Muda o "search_path" para o esquema do cliente
            db.execute(text(f"SET search_path TO {schema}"))
        
        yield db
    finally:
        db.close()