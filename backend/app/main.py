from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os 
from .middleware import TenantMiddleware
from .db import database, models_global, models_crm
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
    # 1. Initialize Manager DB (Global)
    print("Initializing Manager DB...")
    models_global.Base.metadata.create_all(bind=database.engine_sys)
    
    # 2. Initialize Template DB (CRM Source)
    template_path = os.path.join(database.DATA_DIR, "template.db")
    if not os.path.exists(template_path):
        print(f"Creating template.db at {template_path}...")
        url = f"sqlite:///{template_path}"
        engine_template = create_engine(url)
        models_crm.BaseCrm.metadata.create_all(bind=engine_template)
        print("Template DB initialized.")

    # 3. Seed SysAdmin (Global)
    db = database.SessionSys()
    try:
        sysadmin_user = db.query(models_global.GlobalUser).filter(models_global.GlobalUser.username == "sysadmin").first()
        if not sysadmin_user:
            hashed_pw = security.get_password_hash("12345678")
            sysadmin_user = models_global.GlobalUser(
                username="sysadmin",
                email="sysadmin@repforce.com",
                hashed_password=hashed_pw,
                full_name="System Administrator",
                is_sysadmin=True
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