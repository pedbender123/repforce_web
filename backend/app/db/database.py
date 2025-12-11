from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from ..core.config import settings
from fastapi import Request

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db(request: Request):
    """
    Injeta o schema correto (search_path) baseado no middleware.
    """
    db = SessionLocal()
    try:
        if hasattr(request.state, "tenant_schema") and request.state.tenant_schema:
            schema = request.state.tenant_schema
            # Define o path de busca: primeiro o tenant, depois public
            db.execute(text(f"SET search_path TO {schema}, public"))
        else:
            db.execute(text("SET search_path TO public"))
        
        yield db
    finally:
        db.close()