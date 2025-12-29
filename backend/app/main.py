from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os 
from .middleware import TenantMiddleware
from .db import session, models_system, models_tenant
from .core import security
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

# Importa as rotas
from .api import auth, catalog, orders, admin, sysadmin, sysadmin_health, webhooks, crm, routes, analytics, custom_fields, tasks, demo, manager

app = FastAPI(title="Repforce API", version="0.4.0 (SaaS Lite)")

# Uploads Configuration
UPLOAD_ROOT = "/app/uploads"
os.makedirs(UPLOAD_ROOT, exist_ok=True)

@app.get("/uploads/{file_path:path}")
def serve_upload(file_path: str):
    full_path = os.path.join(UPLOAD_ROOT, file_path)
    if os.path.isfile(full_path):
        return FileResponse(full_path)
    return {"detail": "File not found"}, 404

@app.on_event("startup")
def startup_event():
    # 1. Initialize Global Tables (Public Schema)
    print("Initializing Global Tables (Public Schema)...")
    try:
        models_system.Base.metadata.create_all(bind=session.engine)
    except Exception as e:
        print(f"Schema Init Error (Ensure Postgres is up): {e}")
    
    # 2. Seed SysAdmin (Global)
    db = session.SessionSys()
    try:
        # Check if user exists
        # Note: SessionSys is bound to engine, default search_path=public usually
        sysadmin_user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.username == "sysadmin").first()
        if not sysadmin_user:
            print("Seeding SysAdmin...")
            hashed_pw = security.get_password_hash("12345678")
            sysadmin_user = models_system.GlobalUser(
                username="sysadmin",
                email="sysadmin@repforce.com",
                hashed_password=hashed_pw,
                full_name="System Administrator",
                is_sysadmin=True,
                is_active=True
            )
            db.add(sysadmin_user)
            db.commit()
            print("SysAdmin created: sysadmin / 12345678")
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
app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(manager.router, prefix="/manager", tags=["Manager (Provisioning)"])
app.include_router(crm.router, prefix="/crm", tags=["CRM (Clientes)"])
app.include_router(tasks.router, prefix="/crm", tags=["Tarefas & Notificações"])
app.include_router(custom_fields.router, prefix="/crm", tags=["CRM Config"])
app.include_router(catalog.router, prefix="/catalog", tags=["Catálogo"])
app.include_router(orders.router, prefix="/crm/orders", tags=["Pedidos"])
app.include_router(routes.router, prefix="/routes", tags=["Rotas de Visita"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Tenant"])
app.include_router(sysadmin.router, prefix="/sysadmin", tags=["SysAdmin"])
app.include_router(sysadmin_health.router, prefix="/sysadmin/health", tags=["SysAdmin Health"])
app.include_router(demo.router, prefix="/sysadmin/demo", tags=["System Demo"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
app.include_router(analytics.router, prefix="/crm/analytics", tags=["Analytics"])