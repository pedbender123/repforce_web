from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import database, models
from app.api import auth, sysadmin, navigation, webhooks, catalog, crm, orders, routes
from app.middleware import TenantMiddleware
from app.core import seed_data
from app.core.security import get_password_hash

# Inicializa Tabelas Core
models.CoreBase.metadata.create_all(bind=database.engine)

app = FastAPI(title="RepForce Enterprise API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TenantMiddleware)

# Rotas
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(sysadmin.router, prefix="/sysadmin", tags=["SysAdmin"])
app.include_router(navigation.router, prefix="/navigation", tags=["Navigation"])
app.include_router(catalog.router, prefix="/catalog", tags=["Catalog"])
app.include_router(crm.router, prefix="/crm", tags=["CRM"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(routes.router, prefix="/routes", tags=["Routes"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])

@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    try:
        # 1. Garante Componentes do Sistema (Templates React)
        components = ["GENERIC_LIST", "ROLE_MANAGER", "TABLE_MANAGER", "DASHBOARD"]
        for key in components:
            if not db.query(models.SysComponent).filter_by(key=key).first():
                db.add(models.SysComponent(key=key, name=key.replace("_", " ").title()))
        db.commit()

        # 2. Garante Tenant "Systems" (ID 1)
        sys_tenant = db.query(models.Tenant).filter_by(id=1).first()
        if not sys_tenant:
            sys_tenant = models.Tenant(id=1, name="Systems", slug="systems", schema_name="public", status="active")
            db.add(sys_tenant)
            db.commit()

        # 3. Garante Usuário SysAdmin
        sysadmin_user = db.query(models.User).filter_by(username="sysadmin").first()
        if not sysadmin_user:
            sysadmin_user = models.User(
                username="sysadmin",
                email="admin@repforce.com",
                password_hash=get_password_hash("12345678"),
                is_sysadmin=True,
                is_active=True,
                tenant_id=1
            )
            db.add(sysadmin_user)
            db.commit()

        # 4. Cria Menu do SysAdmin (Se não existir)
        # Verifica se já tem áreas para o tenant 1
        if not db.query(models.TenantArea).filter_by(tenant_id=1).first():
            print("⚙️ Criando Menu SysAdmin...")
            for area_def in seed_data.SYSADMIN_PAGES:
                area = models.TenantArea(
                    tenant_id=1,
                    label=area_def['area'],
                    icon=area_def['icon'],
                    order=area_def.get('order', 0)
                )
                db.add(area)
                db.flush() # para pegar o ID
                
                for page_def in area_def['pages']:
                    comp = db.query(models.SysComponent).filter_by(key=page_def['component_key']).first()
                    if comp:
                        page = models.TenantPage(
                            area_id=area.id,
                            component_id=comp.id,
                            label=page_def['label'],
                            path=page_def['path'],
                            config_json=page_def['config']
                        )
                        db.add(page)
            db.commit()
            print("✅ Menu SysAdmin Criado!")

    except Exception as e:
        print(f"❌ Startup Error: {e}")
        db.rollback()
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "RepForce API Running"}