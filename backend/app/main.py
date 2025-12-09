from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import database, models
from app.api import auth, admin, sysadmin, crm, catalog, orders, routes as app_routes, webhooks, navigation
from app.middleware import TenantMiddleware
from sqlalchemy.orm import Session

# Create Core Tables (Public Schema)
models.CoreBase.metadata.create_all(bind=database.engine)

app = FastAPI(title="RepForce Backend (Multi-Tenant)")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tenant Middleware
app.add_middleware(TenantMiddleware)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(sysadmin.router, prefix="/api/sysadmin", tags=["SysAdmin"])
app.include_router(navigation.router, prefix="/api/navigation", tags=["Navigation"]) # Novo

# Tenant Specific Routers
app.include_router(crm.router, prefix="/api/crm", tags=["CRM"])
app.include_router(catalog.router, prefix="/api/catalog", tags=["Catalog"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(app_routes.router, prefix="/api/routes", tags=["Routes"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])

@app.on_event("startup")
def startup_event():
    # Seed Initial SysAdmin and Components
    db = database.SessionLocal()
    try:
        # 1. Seed SysAdmin
        if not db.query(models.User).filter(models.User.username == "sysadmin").first():
            from app.core.security import get_password_hash
            sysadmin_user = models.User(
                username="sysadmin",
                email="admin@repforce.com",
                password_hash=get_password_hash("12345678"),
                is_sysadmin=True,
                is_active=True
            )
            db.add(sysadmin_user)
            db.commit()
            print("✅ SysAdmin user created")
        
        # 2. Seed System Components (Required for Phase 2)
        components = [
            {"key": "DASHBOARD", "name": "Dashboard Principal", "default_path": "/dashboard"},
            {"key": "CLIENT_LIST", "name": "Lista de Clientes", "default_path": "/clients"},
            {"key": "CLIENT_FORM", "name": "Cadastro de Cliente", "default_path": "/clients/new"},
            {"key": "ORDER_LIST", "name": "Lista de Pedidos", "default_path": "/orders"},
            {"key": "ORDER_CREATE", "name": "Novo Pedido", "default_path": "/orders/new"},
            {"key": "PRODUCT_LIST", "name": "Lista de Produtos", "default_path": "/products"},
        ]
        
        for comp in components:
            if not db.query(models.SysComponent).filter_by(key=comp["key"]).first():
                db.add(models.SysComponent(**comp))
        
        db.commit()
        print("✅ System Components seeded")

    except Exception as e:
        print(f"❌ Startup seed failed: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "RepForce API is running 🚀"}