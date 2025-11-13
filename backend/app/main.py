from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .middleware import TenantMiddleware
from .db import models, database
from .core import security
from sqlalchemy.orm import Session

# Importa os roteadores da API
from .api import auth, crm, catalog, orders, admin, sysadmin

# Cria as tabelas no DB
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Repforce API",
    description="API para o sistema de gestão Repforce.",
    version="0.1.0"
)

# --- SEEDING AUTOMÁTICO (A SUA IDEIA) ---
@app.on_event("startup")
def create_initial_admin():
    """
    Executa na inicialização da API.
    Verifica se o Tenant 'Systems' e o User 'admin@sistemas.com' existem.
    Se não, cria eles.
    """
    db: Session = database.SessionLocal()
    try:
        # 1. Verificar/Criar o Tenant "Systems"
        tenant_name = "Systems"
        tenant = db.query(models.Tenant).filter(models.Tenant.name == tenant_name).first()
        
        if not tenant:
            tenant = models.Tenant(
                name=tenant_name,
                status="active" # Tenant do sistema sempre ativo
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
            print(f"Tenant '{tenant_name}' criado com sucesso.")
        
        # 2. Verificar/Criar o Admin "admin@sistemas.com"
        admin_email = "admin@sistemas.com"
        admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
        
        if not admin_user:
            hashed_password = security.get_password_hash("12345678")
            new_admin = models.User(
                email=admin_email,
                name="Admin Padrão", # Adiciona o nome
                hashed_password=hashed_password,
                profile="admin",
                tenant_id=tenant.id  # Vincula ao tenant "Systems"
            )
            db.add(new_admin)
            db.commit()
            print(f"Usuário Admin '{admin_email}' criado com sucesso.")
        
    except Exception as e:
        print(f"Erro durante o seeding inicial: {e}")
        db.rollback()
    finally:
        db.close()
# --- FIM DO SEEDING ---


# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Adiciona o Middleware de Tenant
app.add_middleware(TenantMiddleware)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API Repforce v0"}

# Inclui os roteadores das APIs (sem o /api/)
app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(crm.router, prefix="/crm", tags=["CRM"])
app.include_router(catalog.router, prefix="/catalog", tags=["Catálogo"])
app.include_router(orders.router, prefix="/orders", tags=["Pedidos"])
app.include_router(admin.router, prefix="/admin", tags=["Admin (Conta Mãe)"])
app.include_router(sysadmin.router, prefix="/sysadmin", tags=["SysAdmin"])