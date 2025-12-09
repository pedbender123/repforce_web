from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import models, schemas, database
from app.core import security
from app.api import auth

router = APIRouter()

# --- Helpers ---
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
    """Cria um novo Tenant, seu SysAdmin local e seu Schema isolado."""
    check_sysadmin(current_user)

    # 1. Validar Slug
    if db.query(models.Tenant).filter(models.Tenant.slug == tenant.slug).first():
        raise HTTPException(status_code=400, detail="Tenant slug already exists")

    schema_name = f"tenant_{tenant.slug}"

    # 2. Criar Tenant no DB (Public)
    db_tenant = models.Tenant(
        name=tenant.name,
        slug=tenant.slug,
        schema_name=schema_name,
        status="active"
    )
    db.add(db_tenant)
    db.flush() # Pega o ID

    # 3. Criar Usuário Admin do Tenant (Public)
    hashed_password = security.get_password_hash(tenant.sysadmin_password)
    db_user = models.User(
        username=f"admin_{tenant.slug}",
        email=tenant.sysadmin_email,
        password_hash=hashed_password,
        is_sysadmin=False, # Admin do tenant, não do sistema
        tenant_id=db_tenant.id
    )
    db.add(db_user)
    
    # 4. Criar Schema no PostgreSQL
    try:
        db.execute(text(f"CREATE SCHEMA {schema_name}"))
        
        # Opcional: Criar tabelas dentro do schema agora.
        # Na prática, usamos Alembic ou create_all apontando pro schema.
        # Aqui, vamos fazer um "hack" rápido para criar as tabelas usando o metadata do TenantBase
        # Mudar search_path para criar tabelas lá
        db.execute(text(f"SET search_path TO {schema_name}, public"))
        models.TenantBase.metadata.create_all(bind=db.get_bind())
        
        # Voltar para public
        db.execute(text("SET search_path TO public"))
        
        # 5. Seed Default Layout (Opcional, mas útil)
        seed_default_layout(db, db_tenant.id)

        db.commit()
    except Exception as e:
        db.rollback()
        # Tentar limpar schema se falhou (cuidado em prod)
        # db.execute(text(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE"))
        raise HTTPException(status_code=500, detail=f"Failed to create tenant schema: {str(e)}")

    return db_tenant

@router.get("/tenants", response_model=List[schemas.Tenant])
def list_tenants(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)
    return db.query(models.Tenant).all()

# --- UI Components Management (SysAdmin) ---

@router.post("/components", response_model=schemas.SysComponent)
def create_component(
    comp: schemas.SysComponentCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)
    db_comp = models.SysComponent(**comp.dict())
    try:
        db.add(db_comp)
        db.commit()
        db.refresh(db_comp)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Component key already exists")
    return db_comp

@router.get("/components", response_model=List[schemas.SysComponent])
def list_components(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    check_sysadmin(current_user)
    return db.query(models.SysComponent).all()

# --- Layout Management Helpers ---

def seed_default_layout(db: Session, tenant_id: int):
    """Cria um menu padrão para novos tenants"""
    
    # Busca componentes (assume que já existem no seed global)
    comp_dash = db.query(models.SysComponent).filter_by(key="DASHBOARD").first()
    comp_clients = db.query(models.SysComponent).filter_by(key="CLIENT_LIST").first()
    comp_orders = db.query(models.SysComponent).filter_by(key="ORDER_LIST").first()
    comp_products = db.query(models.SysComponent).filter_by(key="PRODUCT_LIST").first()

    if not comp_dash: return # Se não tiver componentes base, aborta

    # Área: Principal
    area_main = models.TenantArea(tenant_id=tenant_id, label="Principal", icon="LayoutDashboard", order=1)
    db.add(area_main)
    db.flush()

    db.add(models.TenantPage(area_id=area_main.id, component_id=comp_dash.id, label="Visão Geral", order=1))

    # Área: Vendas
    if comp_clients and comp_orders:
        area_sales = models.TenantArea(tenant_id=tenant_id, label="Vendas", icon="ShoppingCart", order=2)
        db.add(area_sales)
        db.flush()
        
        db.add(models.TenantPage(area_id=area_sales.id, component_id=comp_clients.id, label="Clientes", order=1))
        db.add(models.TenantPage(area_id=area_sales.id, component_id=comp_orders.id, label="Pedidos", order=2))
        
        if comp_products:
             db.add(models.TenantPage(area_id=area_sales.id, component_id=comp_products.id, label="Catálogo", order=3))