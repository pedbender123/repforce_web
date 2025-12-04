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

# Recria tabelas (NOTA: Em prod use Alembic para migrações)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Repforce API",
    version="0.2.0"
)

# Servir uploads
upload_dir = "/app/uploads"
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

@app.on_event("startup")
def startup_db_automation():
    print("🚀 [Startup] Iniciando automação de Banco de Dados...")
    
    # 1. Configurar Conexão com o Banco GLOBAL
    # Nota: settings.DATABASE_URL deve apontar para o banco global no .env 
    # (ex: postgresql://user:pass@db:5432/repforce_global)
    global_engine = database.global_engine
    GlobalSession = sessionmaker(bind=global_engine)
    session = GlobalSession()

    try:
        # 2. Criar Tabelas no Banco Global
        print("🔧 [Global] Criando tabelas...")
        models.Base.metadata.create_all(bind=global_engine)

        # 3. Seed: Criar Usuário SysAdmin (se não existir)
        sysadmin = session.query(models.SysUser).filter_by(username="sysadmin").first()
        if not sysadmin:
            print("👤 [Global] Criando SysAdmin...")
            hashed_pwd = security.get_password_hash("12345678")
            new_sysadmin = models.SysUser(
                username="sysadmin", 
                hashed_password=hashed_pwd,
                is_active=True,
                profile="sysadmin"
            )
            session.add(new_sysadmin)
        
        # 4. Seed: Criar o Tenant Demo (Registro no Global)
        demo_tenant = session.query(models.Tenant).filter_by(slug="demo").first()
        demo_db_url = settings.DATABASE_URL.replace("repforce_global", "repforce_tenant_demo")
        
        if not demo_tenant:
            print("cY [Global] Registrando Tenant Demo...")
            new_tenant = models.Tenant(
                name="Demo Corp",
                slug="demo",
                db_connection_string=demo_db_url,
                cnpj="00.000.000/0001-00",
                status="active"
            )
            session.add(new_tenant)
            session.commit() # Comita para garantir que temos o tenant salvo
        
        # 5. Configurar Conexão com Banco do TENANT DEMO
        print("🔌 [Tenant] Conectando ao banco Demo...")
        tenant_engine = create_engine(demo_db_url)
        TenantSession = sessionmaker(bind=tenant_engine)
        t_session = TenantSession()

        # 6. Criar Tabelas no Banco Demo
        print("🔧 [Tenant] Criando tabelas do negócio...")
        models.Base.metadata.create_all(bind=tenant_engine)

        # 7. Seed: Criar Admin do Tenant Demo
        admin_user = t_session.query(models.User).filter_by(username="admin_demo").first()
        if not admin_user:
            print("👤 [Tenant] Criando Admin do Demo...")
            hashed_pwd = security.get_password_hash("12345678")
            new_admin = models.User(
                username="admin_demo",
                email="admin@demo.com",
                name="Administrador Demo",
                hashed_password=hashed_pwd,
                profile="admin"
            )
            t_session.add(new_admin)
            t_session.commit()
            
        t_session.close()
        print("✅ [Startup] Automação concluída com sucesso!")

    except Exception as e:
        print(f"❌ [Startup] Erro crítico na automação: {e}")
        # Não damos raise para não crashar o container em loop se for erro de conexão temporário
    finally:
        session.close()

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

app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(crm.router, prefix="/crm", tags=["CRM"])
app.include_router(catalog.router, prefix="/catalog", tags=["Catálogo"])
app.include_router(orders.router, prefix="/orders", tags=["Pedidos"])
app.include_router(routes.router, prefix="/routes", tags=["Rotas"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Tenant"])
app.include_router(sysadmin.router, prefix="/sysadmin", tags=["SysAdmin"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])