from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import database, models
from app.api import auth, sysadmin, navigation, webhooks
# from app.api import crm, catalog, orders, routes as app_routes # ARQUIVADO FASE 1
from app.middleware import TenantMiddleware
from sqlalchemy.orm import Session # Import Session para tipagem se necessário

# Inicializa Tabelas Core
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

# Middleware Multi-Tenant
app.add_middleware(TenantMiddleware)

# --- ROTAS ATIVAS (CORE) ---
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(sysadmin.router, prefix="/api/sysadmin", tags=["SysAdmin"])
app.include_router(navigation.router, prefix="/api/navigation", tags=["Navigation (UI)"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])

@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    try:
        # Reset/Ensure SysAdmin
        from app.core.security import get_password_hash
        
        sysadmin = db.query(models.User).filter(models.User.username == "sysadmin").first()
        
        if not sysadmin:
            print("⚙️ Criando usuário SysAdmin...")
            sysadmin = models.User(
                username="sysadmin",
                email="admin@repforce.com",
                password_hash=get_password_hash("12345678"),
                is_sysadmin=True,
                is_active=True,
                role_id=None
            )
            db.add(sysadmin)
        else:
            # Força a atualização da senha para garantir que bate com o código atual
            print("⚙️ Atualizando senha do SysAdmin...")
            sysadmin.password_hash = get_password_hash("12345678")
            sysadmin.is_sysadmin = True
            sysadmin.is_active = True
            
        db.commit()
        print("✅ SysAdmin user ready (User: sysadmin / Pass: 12345678)")
            
    except Exception as e:
        print(f"❌ Startup seed failed: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "RepForce Enterprise API is running 🚀", "phase": "1 - Core Infrastructure"}