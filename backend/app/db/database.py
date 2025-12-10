from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from ..core.config import settings
from fastapi import Request

# Engine Global (Connection Pooling)
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# Factory de Sessão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db(request: Request):
    """
    Dependency Injection para obter a sessão do banco.
    A mágica do Multi-Tenant acontece aqui: configuramos o search_path
    baseado no que o Middleware identificou.
    """
    db = SessionLocal()
    try:
        # Se o middleware injetou um schema de tenant, usamos ele.
        if hasattr(request.state, "tenant_schema") and request.state.tenant_schema:
            schema = request.state.tenant_schema
            
            # Validação de segurança básica para evitar injeção SQL no nome do schema
            # (O middleware já deve garantir que o slug é seguro, mas reforçamos)
            if not schema.replace("_", "").isalnum():
                 raise ValueError("Invalid schema name")

            # Prioridade: Schema do Tenant > Schema Public
            # Assim, tabelas como 'clients' são lidas do tenant, 
            # e 'users' (que só existe no public) são lidas do public se referenciadas.
            db.execute(text(f"SET search_path TO {schema}, public"))
        else:
            # Fallback para public apenas (ex: chamadas sem auth ou SysAdmin puro)
            db.execute(text("SET search_path TO public"))
        
        yield db
    finally:
        db.close()