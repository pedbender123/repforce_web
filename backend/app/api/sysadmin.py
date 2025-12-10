from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import models, schemas, database
from app.core import security
from app.api import auth

router = APIRouter()

def check_sysadmin(user: models.User):
    if not user.is_sysadmin:
        raise HTTPException(status_code=403, detail="Requires SysAdmin privileges")

# --- Tenants Management ---

@router.post("/tenants", response_model=schemas.Tenant)
def create_tenant(
    tenant: schemas.TenantCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)

    if db.query(models.Tenant).filter(models.Tenant.slug == tenant.slug).first():
        raise HTTPException(status_code=400, detail="Tenant slug already exists")

    schema_name = f"tenant_{tenant.slug}"

    # 1. Criar Tenant
    db_tenant = models.Tenant(
        name=tenant.name,
        slug=tenant.slug,
        schema_name=schema_name,
        status="active"
    )
    db.add(db_tenant)
    db.flush()

    # 2. Criar Admin do Tenant
    hashed_password = security.get_password_hash(tenant.sysadmin_password)
    db_user = models.User(
        username=f"admin_{tenant.slug}",
        email=tenant.sysadmin_email,
        password_hash=hashed_password, # CORREÇÃO AQUI
        is_sysadmin=False,
        tenant_id=db_tenant.id,
        is_active=True
        # Futuro: role_id = role_admin.id
    )
    db.add(db_user)
    
    # 3. Criar Schema
    try:
        db.execute(text(f"CREATE SCHEMA {schema_name}"))
        
        # Migrar tabelas do TenantBase para o novo schema
        # Dica: Em produção, usar Alembic. Aqui usamos create_all para protótipo.
        db.execute(text(f"SET search_path TO {schema_name}, public"))
        models.TenantBase.metadata.create_all(bind=db.get_bind())
        db.execute(text("SET search_path TO public"))
        
        # 4. Seed Menu Padrão (Opcional por enquanto)
        # seed_default_layout(db, db_tenant.id)

        db.commit()
    except Exception as e:
        db.rollback()
        # Tenta limpar o tenant criado se falhar o schema
        raise HTTPException(status_code=500, detail=f"Failed to create tenant schema: {str(e)}")

    return db_tenant

@router.get("/tenants", response_model=List[schemas.Tenant])
def list_tenants(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)
    return db.query(models.Tenant).all()