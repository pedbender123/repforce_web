from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings
import os

# System DB (Global)
SQLALCHEMY_DATABASE_URL_SYS = settings.DATABASE_URL
engine_sys = create_engine(SQLALCHEMY_DATABASE_URL_SYS)
SessionSys = sessionmaker(autocommit=False, autoflush=False, bind=engine_sys)
Base = declarative_base() # BaseSys implies Base for System, keeping name 'Base' for compatibility

# CRM DB (Schema-per-Tenant)
# Fallback to SYS URL if CRM URL is not set (e.g. dev environment using same DB instance)
SQLALCHEMY_DATABASE_URL_CRM = settings.CRM_DATABASE_URL or settings.DATABASE_URL
engine_crm = create_engine(SQLALCHEMY_DATABASE_URL_CRM)
SessionCrm = sessionmaker(autocommit=False, autoflush=False, bind=engine_crm)
BaseCrm = declarative_base()

# Dependency for System DB (default)
def get_sys_db():
    db = SessionSys()
    try:
        yield db
    finally:
        db.close()

# Alias for backward compatibility
get_db = get_sys_db

from fastapi import Request
from sqlalchemy import text

# Dependency for CRM DB (Context-aware)
def get_crm_db(request: Request):
    """
    Yields a database session connected to the CRM engine with the search_path 
    set to the tenant's specific schema.
    Relies on TenantMiddleware to populate request.state.tenant_id.
    """
    db = SessionCrm()
    try:
        tenant_id = getattr(request.state, "tenant_id", None)
        if tenant_id:
            schema = f"tenant_{tenant_id}"
            # print(f"DEBUG: get_crm_db setting schema to {schema}") # Uncomment for verbose debug
            db.execute(text(f"SET search_path TO {schema}"))
        else:
            print("WARNING: get_crm_db called without tenant_id in request.state! Search path defaults to public.")
        yield db
    finally:
        db.close()