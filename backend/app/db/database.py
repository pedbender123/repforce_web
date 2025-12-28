from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from fastapi import Request, HTTPException
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "../../data") # /app/data in Docker
TENANTS_DIR = os.path.join(DATA_DIR, "tenants")
MANAGER_DB_PATH = os.path.join(DATA_DIR, "manager.db")

# Ensure directories exist
os.makedirs(TENANTS_DIR, exist_ok=True)

# Global DB (Manager)
SQLALCHEMY_DATABASE_URL_SYS = f"sqlite:///{MANAGER_DB_PATH}"
engine_sys = create_engine(
    SQLALCHEMY_DATABASE_URL_SYS, 
    connect_args={"check_same_thread": False} # Needed for SQLite
)
SessionSys = sessionmaker(autocommit=False, autoflush=False, bind=engine_sys)
Base = declarative_base() # Global Models need to inherit from this

# Tenant DB (CRM) - Dynamic
BaseCrm = declarative_base() # Tenant Models inherit from this

def get_tenant_db_path(slug: str):
    # Security check to prevent path traversal
    if ".." in slug or "/" in slug or "\\" in slug:
        raise ValueError("Invalid slug")
    return os.path.join(TENANTS_DIR, f"{slug}.db")

def get_tenant_engine(slug: str):
    db_path = get_tenant_db_path(slug)
    # Note: We might want to verify file existence here or let create_engine handle it
    # For now, simplistic approach:
    url = f"sqlite:///{db_path}"
    return create_engine(url, connect_args={"check_same_thread": False})

# Dependency for Manager DB
def get_db():
    db = SessionSys()
    try:
        yield db
    finally:
        db.close()

# Dependency for Tenant DB
def get_crm_db(request: Request):
    # Extract slug from Header (X-Tenant-Slug) or maybe query param for flexibility
    # header is best for API
    slug = request.headers.get("X-Tenant-Slug")
    
    if not slug:
        # Fallback or Error? 
        # SaaS Lite: Must have a context. 
        print("WARNING: No X-Tenant-Slug header found.")
        # We could raise 400 or yield None.
        # Let's try to yield None and handle downstream or raise.
        # Better: check usage. Most protected routes need it.
        # raise HTTPException(status_code=400, detail="Missing X-Tenant-Slug header")
        # For compatibility with some auth flows, maybe optional? 
        # But data access strictly needs it.
        yield None
        return

    try:
        engine = get_tenant_engine(slug)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        yield db
    except Exception as e:
        print(f"Error connecting to tenant db {slug}: {e}")
        yield None
    finally:
        if 'db' in locals():
            db.close()