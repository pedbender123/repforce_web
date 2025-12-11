from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import database, models, schemas
from app.core import security, seed_data
from typing import List

router = APIRouter()

def check_sysadmin(request):
    if request.state.profile != 'sysadmin':
        raise HTTPException(status_code=403, detail="Apenas SysAdmin")

@router.get("/tenants", response_model=List[schemas.Tenant])
def list_tenants(request: database.Request, db: Session = Depends(database.get_db)):
    return db.query(models.Tenant).all()

@router.post("/tenants", response_model=schemas.Tenant)
def create_tenant(tenant: schemas.TenantCreate, db: Session = Depends(database.get_db)):
    # 1. Cria Tenant no Public
    schema_name = f"tenant_{tenant.slug}"
    db_tenant = models.Tenant(
        name=tenant.name, slug=tenant.slug, schema_name=schema_name, tenant_type=tenant.tenant_type
    )
    db.add(db_tenant)
    db.flush()

    # 2. Cria Usuário Admin
    db_user = models.User(
        username=f"admin_{tenant.slug}",
        email=tenant.sysadmin_email,
        password_hash=security.get_password_hash(tenant.sysadmin_password),
        tenant_id=db_tenant.id
    )
    db.add(db_user)

    # 3. Cria Menu Padrão para este Tenant
    # (Copia do seed_data.TENANT_DEFAULT_PAGES)
    for area_def in seed_data.TENANT_DEFAULT_PAGES:
        area = models.TenantArea(tenant_id=db_tenant.id, label=area_def['area'], icon=area_def['icon'])
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

    # 4. Cria Schema Físico no Postgres
    try:
        db.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
        # Cria tabelas dentro do schema
        db.execute(text(f"SET search_path TO {schema_name}, public"))
        models.TenantBase.metadata.create_all(bind=db.get_bind())
        db.execute(text("SET search_path TO public")) # volta ao normal
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
    return db_tenant

@router.get("/users", response_model=List[schemas.User])
def list_users(db: Session = Depends(database.get_db)):
    return db.query(models.User).all()

@router.post("/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=security.get_password_hash(user.password),
        tenant_id=user.tenant_id,
        is_sysadmin=(user.tenant_id == 1)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user