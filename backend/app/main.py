from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import database, models
from app.api import auth, sysadmin, navigation
from app.middleware import TenantMiddleware
from app.core import seed_data, security

# Inicializa Tabelas Públicas
models.CoreBase.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TenantMiddleware)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(sysadmin.router, prefix="/sysadmin", tags=["SysAdmin"])
app.include_router(navigation.router, prefix="/navigation", tags=["Navigation"])

@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    try:
        # 1. Tenant System
        if not db.query(models.Tenant).filter_by(id=1).first():
            db.add(models.Tenant(id=1, name="System", slug="system", schema_name="public", status="active"))
            db.commit()

        # 2. Usuário SysAdmin
        if not db.query(models.User).filter_by(username="sysadmin").first():
            user = models.User(
                username="sysadmin",
                email="admin@repforce.com",
                password_hash=security.get_password_hash("12345678"),
                is_sysadmin=True,
                tenant_id=1
            )
            db.add(user)
            db.commit()

        # 3. Componentes
        components = ["GENERIC_LIST", "ROLE_MANAGER", "TABLE_MANAGER", "DASHBOARD"]
        for key in components:
            if not db.query(models.SysComponent).filter_by(key=key).first():
                db.add(models.SysComponent(key=key, name=key))
        db.commit()

        # 4. Seed SysAdmin Menu
        if db.query(models.TenantArea).filter_by(tenant_id=1).count() == 0:
            for area_def in seed_data.SYSADMIN_PAGES:
                area = models.TenantArea(tenant_id=1, label=area_def['area'], icon=area_def['icon'])
                db.add(area)
                db.flush()
                for page_def in area_def['pages']:
                    comp = db.query(models.SysComponent).filter_by(key=page_def['component_key']).first()
                    page = models.TenantPage(
                        area_id=area.id,
                        component_id=comp.id,
                        label=page_def['label'],
                        path=page_def['path'],
                        config_json=page_def['config']
                    )
                    db.add(page)
            db.commit()
            print("✅ Seed SysAdmin concluído.")

    except Exception as e:
        print(f"Erro no seed: {e}")
        db.rollback()
    finally:
        db.close()