from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings
from fastapi import Request

# 1. Engine Global (Sempre aponta para o repforce_global)
global_engine = create_engine(settings.DATABASE_URL)
GlobalSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=global_engine)

Base = declarative_base()

# 2. Gerenciador de Conexões de Tenant (Cache de Engines)
class TenantConnectionManager:
    def __init__(self):
        self._engines = {}

    def get_tenant_engine(self, db_url: str):
        if db_url not in self._engines:
            # Cria a engine apenas se ainda não existir no cache
            print(f"🔌 [Database] Criando nova engine para: {db_url}")
            self._engines[db_url] = create_engine(db_url)
        return self._engines[db_url]

    def dispose_engine(self, db_url: str):
        if db_url in self._engines:
            self._engines[db_url].dispose()
            del self._engines[db_url]

tenant_manager = TenantConnectionManager()

# 3. Dependency Injection Inteligente
def get_db(request: Request):
    """
    Decide qual banco de dados usar baseado no estado da requisição.
    - Se houver 'tenant_db_url' no state, conecta no banco do Tenant.
    - Caso contrário, conecta no banco Global.
    """
    if hasattr(request.state, "tenant_db_url") and request.state.tenant_db_url:
        engine = tenant_manager.get_tenant_engine(request.state.tenant_db_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
    else:
        # Fallback para Global (ex: rotas de SysAdmin ou Login inicial)
        db = GlobalSessionLocal()
    
    try:
        yield db
    finally:
        db.close()

# Helper para obter sessão global explicitamente (usado no login)
def get_global_db():
    db = GlobalSessionLocal()
    try:
        yield db
    finally:
        db.close()