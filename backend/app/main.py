from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import database, models
from app.api import auth, sysadmin, navigation, webhooks
# from app.api import crm, catalog, orders, routes as app_routes # ARQUIVADO FASE 1
from app.middleware import TenantMiddleware

# Inicializa Tabelas Core (TenantBase não é criado aqui pois é dinâmico)
models.CoreBase.metadata.create_all(bind=database.engine)

app = FastAPI(title="RepForce Enterprise API")

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware Multi-Tenant (Injeção de Schema)
app.add_middleware(TenantMiddleware)

# --- ROTAS ATIVAS (CORE) ---
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(sysadmin.router, prefix="/api/sysadmin", tags=["SysAdmin"])
app.include_router(navigation.router, prefix="/api/navigation", tags=["Navigation (UI)"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])

# --- ROTAS ARQUIVADAS/DESATIVADAS (FASE 1 LIMPEZA) ---
# O objetivo é reescrever estas rotas para usar os novos models TenantBase
# e a lógica de permissões correta nas próximas fases.
# app.include_router(crm.router, prefix="/api/crm", tags=["CRM"])
# app.include_router(catalog.router, prefix="/api/catalog", tags=["Catalog"])
# app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
# app.include_router(app_routes.router, prefix="/api/routes", tags=["Routes"])

@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    try:
        # Seed SysAdmin Padrão
        if not db.query(models.User).filter(models.User.username == "sysadmin").first():
            from app.core.security import get_password_hash
            sysadmin_user = models.User(
                username="sysadmin",
                email="admin@repforce.com",
                password_hash=get_password_hash("12345678"),
                is_sysadmin=True,
                is_active=True,
                role_id=None # SysAdmin não precisa de role por enquanto (God Mode)
            )
            db.add(sysadmin_user)
            db.commit()
            print("✅ SysAdmin user created")
            
    except Exception as e:
        print(f"❌ Startup seed failed: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "RepForce Enterprise API is running 🚀", "phase": "1 - Core Infrastructure"}