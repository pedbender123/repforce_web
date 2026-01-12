from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os 
from .core.middleware import TenantMiddleware
from app.shared import database, security, schemas
from app.system import models as models_system

# --- ENGINE ROUTERS (CRM Motor) ---
from app.engine.metadata import models as models_meta # REFAC: Metadata Engine Models

from app.engine.metadata import models as models_meta # REFAC: Metadata Engine Models
# Engine Models (Transient/Dynamic)
from app.engine.metadata import models as models_meta # REFAC: Metadata Engine Models
# Engine Models (Transient/Dynamic)
from app.engine import models_tenant 
from app.engine.services.seeder import seed_tenant_defaults 

# --- SYSTEM ROUTERS (OS Core) ---
from app.system.api import auth as v1_auth
from app.system.api.sysadmin import companies
from app.system.api import tasks_v2 # Tasks V2 IMPORT

# --- ENGINE ROUTERS (CRM Motor) ---
from app.engine.api import builder # REFAC: Builder API
from app.engine.api import metadata # REFAC: Engine Runtime API
from app.engine.api import data # REFAC: Universal Data API
from app.engine.api import actions # REFAC: Actions API
from app.engine.api import analytics # REFAC: Analytics API

# --- LEGACY / SHARED ROUTERS ---
# Reduced for Stability Protocol
from .api import admin, manager, diagnostics
# from .api import catalog, orders, webhooks, crm, routes, analytics, custom_fields, tasks, demo

app = FastAPI(title="Repforce API", version="0.4.0 (SaaS Lite)")

# Uploads Configuration
UPLOAD_ROOT = os.path.abspath("uploads")
os.makedirs(UPLOAD_ROOT, exist_ok=True)

@app.get("/uploads/{file_path:path}")
def serve_upload(file_path: str):
    full_path = os.path.join(UPLOAD_ROOT, file_path)
    if os.path.isfile(full_path):
        return FileResponse(full_path)
    return {"detail": "File not found"}, 404

@app.on_event("startup")
def startup_event():
    print("Initializing Global Tables (Public Schema)...")
    try:
        models_system.Base.metadata.create_all(bind=database.engine)
        # Ensure Metadata models are also created (since they share Base but are in different file)
        # SQLAlchemy creates all tables for Base subclass imported.
    except Exception as e:
        print(f"Schema Init Error (Ensure Postgres is up): {e}")
    
    # 2. Seed SysAdmin (Global)
    db = database.SessionSys()
    try:
        # Check if user exists
        # Note: SessionSys is bound to engine, default search_path=public usually
        sysadmin_user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.username == "pbrandon").first()
        if not sysadmin_user:
            print("Seeding SysAdmin...")
            hashed_pw = security.get_password_hash("1asdfgh.")
            sysadmin_user = models_system.GlobalUser(
                username="pbrandon",
                recovery_email="pedro.p.bender.randon@gmail.com", 
                password_hash=hashed_pw,
                full_name="Pedro Bender",
                is_superuser=True,
                is_active=True
            )
            db.add(sysadmin_user)
            db.commit()
            print("SysAdmin created: pbrandon / 1asdfgh.")

        # Check for 'admin' user
        admin_user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.username == "admin").first()
        if not admin_user:
            print("Seeding Admin...")
            hashed_pw = security.get_password_hash("12345678")
            admin_user = models_system.GlobalUser(
                username="admin",
                recovery_email="admin@repforce.com", 
                password_hash=hashed_pw,
                full_name="Administrator",
                is_superuser=True,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Admin created: admin / 12345678")
        
        # 3. Seed "Rotas" Entity (Default for first tenant)
        # Assuming the first tenant is the default one created by system or manual request
        first_tenant = db.query(models_system.Tenant).first()
        if first_tenant:
             seed_tenant_defaults(db, first_tenant.id)
    except Exception as e:
        print(f"Startup Seeding Error: {e}")
    finally:
        db.close()

app.add_middleware(TenantMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Repforce API Online (SaaS Lite)"}

# Definição das Rotas
# Definição das Rotas - ADM CORE ONLY
# app.include_router(auth.router, prefix="/auth", tags=["Autenticação"]) # DEPRECATED
app.include_router(manager.router, prefix="/manager", tags=["Manager (Provisioning)"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Tenant"])
app.include_router(v1_auth.router, prefix="/v1", tags=["V1 Auth"])
# User Tasks System
app.include_router(tasks_v2.router, prefix="/api/system/tasks", tags=["System Tasks (User)"])
# Builder API (No-Code Engine)
app.include_router(builder.router, prefix="/api/builder", tags=["Builder"])
app.include_router(metadata.router, prefix="/api/engine", tags=["Engine Runtime"])
app.include_router(data.router, prefix="/api/engine", tags=["Universal Data"])
app.include_router(actions.router, prefix="/api/engine", tags=["Engine Actions"])
app.include_router(analytics.router, prefix="/api/engine/analytics", tags=["Engine Analytics"])
app.include_router(companies.router, prefix="/v1/sysadmin/companies", tags=["SysAdmin Companies"])
app.include_router(diagnostics.router, prefix="/sysadmin/diagnostics", tags=["SysAdmin Diagnostics"])