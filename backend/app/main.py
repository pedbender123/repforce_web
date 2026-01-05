from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os 
from .middleware import TenantMiddleware
from app.shared import database, security, schemas
from app.system.models import models as models_system
# Engine Models (Transient/Dynamic)
from app.engine import models_tenant 

# --- SYSTEM ROUTERS (OS Core) ---
from app.system.api import auth as v1_auth
from app.system.api.sysadmin import companies, tasks as v1_sysadmin_tasks

# --- ENGINE ROUTERS (CRM Motor) ---
from app.engine.api import engine
from app.engine.metadata import meta as v1_meta

# --- LEGACY / SHARED ROUTERS ---
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
    except Exception as e:
        print(f"Startup Seeding Error: {e}")
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TenantMiddleware)

@app.get("/")
def read_root():
    return {"message": "Repforce API Online (SaaS Lite)"}

# Definição das Rotas
# Definição das Rotas - ADM CORE ONLY
# app.include_router(auth.router, prefix="/auth", tags=["Autenticação"]) # DEPRECATED
app.include_router(manager.router, prefix="/manager", tags=["Manager (Provisioning)"])
# app.include_router(crm.router, prefix="/crm", tags=["CRM (Clientes)"])
# app.include_router(tasks.router, prefix="/crm", tags=["Tarefas & Notificações"])
# app.include_router(custom_fields.router, prefix="/crm", tags=["CRM Config"])
# app.include_router(catalog.router, prefix="/catalog", tags=["Catálogo"])
# app.include_router(orders.router, prefix="/crm/orders", tags=["Pedidos"])
# app.include_router(routes.router, prefix="/routes", tags=["Rotas de Visita"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Tenant"])
# app.include_router(sysadmin.router, prefix="/sysadmin", tags=["SysAdmin"]) # REMOVED LEGACY
# app.include_router(sysadmin_health.router, prefix="/sysadmin/health", tags=["SysAdmin Health"]) # REMOVED LEGACY
# app.include_router(demo.router, prefix="/sysadmin/demo", tags=["System Demo"])
# app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
# app.include_router(analytics.router, prefix="/crm/analytics", tags=["Analytics"])
app.include_router(v1_auth.router, prefix="/v1", tags=["V1 Auth"])
# app.include_router(v1_meta.router, prefix="/v1/meta", tags=["Metadados (No-Code)"])
# app.include_router(engine.router, prefix="/v1/engine", tags=["No-Code Engine"])
app.include_router(companies.router, prefix="/v1/sysadmin/companies", tags=["SysAdmin Companies"])
app.include_router(v1_sysadmin_tasks.router, prefix="/v1/sysadmin/tasks", tags=["SysAdmin Tasks"])
app.include_router(diagnostics.router, prefix="/sysadmin/diagnostics", tags=["SysAdmin Diagnostics"])