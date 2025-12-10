from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import database, models
from app.api import auth, sysadmin, navigation, webhooks
from app.middleware import TenantMiddleware

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
# ALTERAÇÃO: Removemos o prefixo "/api" daqui.
# O Nginx recebe na porta 80 (/api/...) e encaminha para porta 8000 (/...)
# Ao remover o prefixo aqui, alinhamos com o comportamento de strip do Nginx.
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(sysadmin.router, prefix="/sysadmin", tags=["SysAdmin"])
app.include_router(navigation.router, prefix="/navigation", tags=["Navigation (UI)"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])

@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    try:
        from app.core.security import get_password_hash
        
        sysadmin_user = db.query(models.User).filter(models.User.username == "sysadmin").first()
        
        if not sysadmin_user:
            print("⚙️ Criando usuário SysAdmin...")
            sysadmin_user = models.User(
                username="sysadmin",
                email="admin@repforce.com",
                password_hash=get_password_hash("12345678"),
                is_sysadmin=True,
                is_active=True,
                role_id=None
            )
            db.add(sysadmin_user)
        else:
            # Garante que a senha está certa mesmo se o usuário já existir
            # Isso corrige casos onde o banco não foi apagado corretamente
            sysadmin_user.password_hash = get_password_hash("12345678")
            sysadmin_user.is_sysadmin = True
            
        db.commit()
        print("✅ SysAdmin user ready (User: sysadmin / Pass: 12345678)")
            
    except Exception as e:
        print(f"❌ Startup seed failed: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "RepForce Enterprise API is running 🚀"}