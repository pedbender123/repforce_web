from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles 
import os 
from .middleware import TenantMiddleware
from .db import models, database
from .core import security
from sqlalchemy.orm import Session

# Importa todas as rotas
from .api import auth, crm, catalog, orders, admin, sysadmin, routes, webhooks

# Cria tabelas no banco único
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Repforce API", version="0.2.0")

# Uploads
upload_dir = "/app/uploads"
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# --- SEED DE SYSADMIN (LIMPO) ---
@app.on_event("startup")
def create_initial_admin():
    db: Session = database.SessionLocal()
    try:
        # 1. Garante que o Tenant 'Systems' existe (para o SysAdmin pertencer a ele)
        tenant_name = "Systems"
        tenant = db.query(models.Tenant).filter(models.Tenant.name == tenant_name).first()
        if not tenant:
            print("⚙️ Criando Tenant Administrativo...")
            tenant = models.Tenant(name=tenant_name, status="active", cnpj="000")
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
        
        # 2. Garante que o usuário 'sysadmin' existe
        admin_username = "sysadmin"
        admin_user = db.query(models.User).filter(models.User.username == admin_username).first()
        if not admin_user:
            print("👤 Criando usuário SysAdmin...")
            hashed_password = security.get_password_hash("12345678")
            # Note que o tenant_id é o do 'Systems' criado acima
            new_admin = models.User(
                username=admin_username, 
                name="Super Administrador", 
                hashed_password=hashed_password, 
                profile="sysadmin", 
                tenant_id=tenant.id
            )
            db.add(new_admin)
            db.commit()
            print("✅ SysAdmin criado com sucesso!")
            
    except Exception as e:
        print(f"❌ Erro no seeding inicial: {e}")
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

app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(crm.router, prefix="/crm", tags=["CRM"])
app.include_router(catalog.router, prefix="/catalog", tags=["Catálogo"])
app.include_router(orders.router, prefix="/orders", tags=["Pedidos"])
app.include_router(routes.router, prefix="/routes", tags=["Rotas"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Tenant"])
app.include_router(sysadmin.router, prefix="/sysadmin", tags=["SysAdmin"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])

@app.get("/")
def read_root():
    return {"message": "Repforce API Online (Single DB)"}