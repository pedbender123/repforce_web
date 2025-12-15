from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles 
import os 
from .middleware import TenantMiddleware
from .db import models, database
from .core import security
from sqlalchemy.orm import Session

# Importa as rotas
from .api import auth, catalog, orders, admin, sysadmin, webhooks, crm, routes

# Cria tabelas
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Repforce API", version="0.3.0")

# Uploads
upload_dir = "/app/uploads"
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

@app.on_event("startup")
def create_initial_seed():
    db: Session = database.SessionLocal()
    try:
        # 1. Tenant Systems
        tenant = db.query(models.Tenant).filter(models.Tenant.name == "Systems").first()
        if not tenant:
            tenant = models.Tenant(name="Systems", status="active", cnpj="000")
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
        
        # 2. Área do SysAdmin (Criação Automática)
        sysadmin_pages = [
            {"label": "Dashboard", "path": "/sysadmin/dashboard"},
            {"label": "Tenants (Empresas)", "path": "/sysadmin/tenants"},
            {"label": "Usuários do Sistema", "path": "/sysadmin/users"}
        ]
        
        area_name = "Gestão do Sistema"
        area = db.query(models.Area).filter(models.Area.name == area_name, models.Area.tenant_id == tenant.id).first()
        if not area:
            area = models.Area(
                name=area_name, 
                icon="ShieldAlert", 
                tenant_id=tenant.id,
                pages_json=sysadmin_pages
            )
            db.add(area)
            db.commit()
            db.refresh(area)

        # 3. Cargo Super Admin
        role_name = "Super Admin"
        role = db.query(models.Role).filter(models.Role.name == role_name, models.Role.tenant_id == tenant.id).first()
        if not role:
            role = models.Role(name=role_name, tenant_id=tenant.id)
            role.areas.append(area) # Vincula a área ao cargo
            db.add(role)
            db.commit()
            db.refresh(role)
        
        # 4. Usuário SysAdmin
        admin_user = db.query(models.User).filter(models.User.username == "sysadmin").first()
        if not admin_user:
            hashed_pw = security.get_password_hash("12345678")
            new_admin = models.User(
                username="sysadmin", 
                name="SysAdmin", 
                hashed_password=hashed_pw, 
                profile="sysadmin", 
                tenant_id=tenant.id,
                role_id=role.id # Vincula o usuário ao cargo
            )
            db.add(new_admin)
            db.commit()
            
    except Exception as e:
        print(f"Erro seeding: {e}")
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
    return {"message": "Repforce API Online"}

# Definição das Rotas
app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(crm.router, prefix="/crm", tags=["CRM (Clientes)"])
app.include_router(catalog.router, prefix="/catalog", tags=["Catálogo"])
app.include_router(orders.router, prefix="/orders", tags=["Pedidos"])
app.include_router(routes.router, prefix="/routes", tags=["Rotas de Visita"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Tenant"])
app.include_router(sysadmin.router, prefix="/sysadmin", tags=["SysAdmin"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])