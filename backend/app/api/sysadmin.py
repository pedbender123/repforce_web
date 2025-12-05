from fastapi import APIRouter, Depends, Request, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..db import database, models, schemas
from ..core import security
from typing import List, Optional
import shutil, os

router = APIRouter()

# Dependência de SysAdmin
def check_sysadmin_profile(request: Request):
    if request.state.profile != 'sysadmin':
        raise HTTPException(status_code=403, detail="Acesso restrito.")
    return True

@router.post("/tenants", response_model=schemas.Tenant, status_code=201, dependencies=[Depends(check_sysadmin_profile)])
def create_tenant(
    db: Session = Depends(database.get_db), # Conectado no public
    name: str = Form(...),
    slug: str = Form(...), # Agora pedimos o slug explicitamente ou geramos
    status: Optional[str] = Form('active'),
):
    # 1. Validações
    slug = slug.lower().strip()
    if not slug.isalnum():
        raise HTTPException(400, "Slug deve conter apenas letras e números.")
    
    if db.query(models.Tenant).filter(models.Tenant.slug == slug).first():
        raise HTTPException(400, "Slug já utilizado.")

    # 2. Cria o Tenant no 'public'
    new_tenant = models.Tenant(name=name, slug=slug, status=status, db_connection_string="schema-mode")
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)

    # 3. MÁGICA DOS SCHEMAS: Cria a estrutura isolada
    schema_name = f"tenant_{slug}"
    try:
        # Cria o Schema
        db.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
        db.commit() # Commita a criação do schema

        # Configura o path para criar as tabelas LÁ DENTRO
        db.execute(text(f"SET search_path TO {schema_name}"))
        
        # Cria as tabelas do TenantBase (Clients, Orders, etc.) neste schema
        models.TenantBase.metadata.create_all(bind=db.get_bind())
        
        # Volta para o public (boa prática)
        db.execute(text("SET search_path TO public"))
        db.commit()
        
    except Exception as e:
        # Rollback manual se falhar (deletar o tenant criado)
        db.delete(new_tenant)
        db.commit()
        raise HTTPException(500, detail=f"Erro ao criar infraestrutura do tenant: {str(e)}")

    return new_tenant

@router.get("/tenants", 
            response_model=List[schemas.Tenant],
            dependencies=[Depends(check_sysadmin_profile)])
def get_tenants(db: Session = Depends(database.get_db)):
    tenants = db.query(models.Tenant).order_by(models.Tenant.id).all()
    return tenants

class TenantUpdateStatus(schemas.TenantBase):
    status: str

@router.put("/tenants/{tenant_id}", 
            response_model=schemas.Tenant,
            dependencies=[Depends(check_sysadmin_profile)])
def update_tenant_status(
    tenant_id: int,
    tenant_update: TenantUpdateStatus,
    db: Session = Depends(database.get_db)
):
    db_tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    
    if not db_tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    
    db_tenant.status = tenant_update.status
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

# --- Gestão de Usuários (SysAdmin) ---

@router.post("/users", 
             response_model=schemas.User, 
             status_code=201, 
             dependencies=[Depends(check_sysadmin_profile)])
def create_sysadmin_user(
    user: schemas.UserCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    tenant_id = user.tenant_id
    if not tenant_id:
        systems_tenant = db.query(models.Tenant).filter(models.Tenant.name == "Systems").first()
        if not systems_tenant:
            raise HTTPException(status_code=500, detail="Tenant 'Systems' não encontrado.")
        tenant_id = systems_tenant.id
    
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username já cadastrado")

    hashed_password = security.get_password_hash(user.password)
    profile = user.profile if user.profile else 'representante'

    db_new_user = models.User(
        username=user.username,
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        profile=profile,
        tenant_id=tenant_id
    )
    
    db.add(db_new_user)
    db.commit()
    db.refresh(db_new_user)
    return db_new_user

@router.get("/users", 
            response_model=List[schemas.User], 
            dependencies=[Depends(check_sysadmin_profile)])
def get_systems_users(
    db: Session = Depends(database.get_db)
):
    systems_tenant = db.query(models.Tenant).filter(models.Tenant.name == "Systems").first()
    if not systems_tenant:
        return [] 
    
    users = db.query(models.User).options(joinedload(models.User.tenant)).filter(
        models.User.tenant_id == systems_tenant.id,
        models.User.profile == 'sysadmin'
    ).order_by(models.User.id).all()
    
    return users

@router.get("/all-users", 
            response_model=List[schemas.User], 
            dependencies=[Depends(check_sysadmin_profile)])
def get_all_users_in_system(
    request: Request,
    db: Session = Depends(database.get_db)
):
    users = db.query(models.User).options(joinedload(models.User.tenant)).order_by(models.User.id).all()
    return users