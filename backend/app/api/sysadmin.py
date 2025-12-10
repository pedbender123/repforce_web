from typing import List, Optional
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
        status="active",
        tenant_type=tenant.tenant_type
    )
    db.add(db_tenant)
    db.flush()

    # 2. Criar Admin do Tenant
    hashed_password = security.get_password_hash(tenant.sysadmin_password)
    db_user = models.User(
        username=f"admin_{tenant.slug}",
        email=tenant.sysadmin_email,
        password_hash=hashed_password,
        is_sysadmin=False,
        tenant_id=db_tenant.id,
        is_active=True
    )
    db.add(db_user)
    
    # 3. Criar Schema
    try:
        db.execute(text(f"CREATE SCHEMA {schema_name}"))
        db.execute(text(f"SET search_path TO {schema_name}, public"))
        models.TenantBase.metadata.create_all(bind=db.get_bind())
        db.execute(text("SET search_path TO public"))
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create tenant schema: {str(e)}")

    return db_tenant

@router.get("/tenants", response_model=List[schemas.Tenant])
def list_tenants(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)
    return db.query(models.Tenant).all()

@router.put("/tenants/{tenant_id}", response_model=schemas.Tenant)
def update_tenant(
    tenant_id: int,
    tenant_update: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)
    db_tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not db_tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if 'status' in tenant_update:
        db_tenant.status = tenant_update['status']
    # Adicione outros campos conforme necessário
    
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

# --- User Management (Global) ---

@router.get("/all-users", response_model=List[schemas.User])
def list_all_users_system(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)
    return db.query(models.User).all()

@router.post("/users", response_model=schemas.User)
def create_sysadmin_user(
    user: schemas.UserCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        is_sysadmin=(user.tenant_id == 1), 
        tenant_id=user.tenant_id,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- STRUCTURE MANAGEMENT (AREAS & PAGES) ---

@router.get("/areas", response_model=List[schemas.TenantArea])
def list_areas(
    tenant_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)
    query = db.query(models.TenantArea)
    if tenant_id:
        query = query.filter(models.TenantArea.tenant_id == tenant_id)
    return query.all()

@router.post("/areas", response_model=schemas.TenantArea)
def create_area(
    area: schemas.TenantAreaCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)
    db_area = models.TenantArea(**area.dict())
    db.add(db_area)
    db.commit()
    db.refresh(db_area)
    return db_area

@router.put("/areas/{area_id}", response_model=schemas.TenantArea)
def update_area(
    area_id: int,
    area: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)
    db_area = db.query(models.TenantArea).filter(models.TenantArea.id == area_id).first()
    if not db_area:
        raise HTTPException(status_code=404, detail="Area not found")
    
    for k, v in area.items():
        if hasattr(db_area, k):
            setattr(db_area, k, v)
            
    db.commit()
    db.refresh(db_area)
    return db_area

@router.delete("/areas/{area_id}")
def delete_area(
    area_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)
    db_area = db.query(models.TenantArea).filter(models.TenantArea.id == area_id).first()
    if not db_area:
        raise HTTPException(status_code=404, detail="Area not found")
    db.delete(db_area)
    db.commit()
    return {"ok": True}

# --- Pages Management ---

@router.get("/pages", response_model=List[schemas.TenantPage])
def list_pages(
    area_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)
    query = db.query(models.TenantPage)
    if area_id:
        query = query.filter(models.TenantPage.area_id == area_id)
    return query.all()

@router.post("/pages", response_model=schemas.TenantPage)
def create_page(
    page: schemas.TenantPageCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)
    
    # Buscar o ID do Componente baseado na Key
    comp = db.query(models.SysComponent).filter(models.SysComponent.key == page.component_key).first()
    if not comp:
        raise HTTPException(status_code=400, detail=f"Component Key '{page.component_key}' inválida")

    db_page = models.TenantPage(
        area_id=page.area_id,
        component_id=comp.id,
        label=page.label,
        path=page.path,
        order=page.order,
        config_json=page.config_json
    )
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

@router.delete("/pages/{page_id}")
def delete_page(
    page_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)
    db_page = db.query(models.TenantPage).filter(models.TenantPage.id == page_id).first()
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    db.delete(db_page)
    db.commit()
    return {"ok": True}