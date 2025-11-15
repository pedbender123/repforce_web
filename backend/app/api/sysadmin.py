from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from ..core import security
from typing import List

router = APIRouter()

# Dependência para verificar se o usuário é SysAdmin
def check_sysadmin_profile(request: Request):
    """
    Verifica se o usuário logado tem o perfil 'sysadmin'.
    """
    if request.state.profile != 'sysadmin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a SysAdmins."
        )
    return True

# --- Gestão de Tenants (SysAdmin) ---

@router.post("/tenants", 
             response_model=schemas.Tenant, 
             status_code=201,
             dependencies=[Depends(check_sysadmin_profile)])
def create_tenant(
    tenant: schemas.TenantCreate,
    db: Session = Depends(database.get_db)
):
    """
    (SysAdmin) Cria uma nova Conta Mãe (Tenant).
    """
    db_tenant_name = db.query(models.Tenant).filter(models.Tenant.name == tenant.name).first()
    if db_tenant_name:
        raise HTTPException(status_code=400, detail="Nome do Tenant já existe")
        
    if tenant.cnpj:
        db_tenant_cnpj = db.query(models.Tenant).filter(models.Tenant.cnpj == tenant.cnpj).first()
        if db_tenant_cnpj:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado")

    new_tenant = models.Tenant(**tenant.dict())
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    return new_tenant

@router.get("/tenants", 
            response_model=List[schemas.Tenant],
            dependencies=[Depends(check_sysadmin_profile)])
def get_tenants(db: Session = Depends(database.get_db)):
    """
    (SysAdmin) Lista todos os Tenants.
    """
    tenants = db.query(models.Tenant).all()
    return tenants

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
    """
    (SysAdmin) Cria um novo usuário (SysAdmin, Admin ou Rep) 
    dentro do tenant 'Systems'.
    """
    
    # 1. Encontra o Tenant "Systems" (deve ter ID 1 pelo seeding)
    systems_tenant = db.query(models.Tenant).filter(models.Tenant.name == "Systems").first()
    if not systems_tenant:
        raise HTTPException(status_code=500, detail="Tenant 'Systems' não encontrado.")
    
    tenant_id = systems_tenant.id

    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    hashed_password = security.get_password_hash(user.password)
    
    profile = user.profile if user.profile in ['admin', 'representante', 'sysadmin'] else 'representante'

    db_new_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        profile=profile,
        tenant_id=tenant_id # Força a criação dentro do tenant "Systems"
    )
    
    db.add(db_new_user)
    db.commit()
    db.refresh(db_new_user)
    return db_new_user

@router.get("/users", 
            response_model=List[schemas.User], 
            dependencies=[Depends(check_sysadmin_profile)])
def get_sysadmin_users(
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    (SysAdmin) Lista todos os usuários do tenant 'Systems'.
    """
    systems_tenant = db.query(models.Tenant).filter(models.Tenant.name == "Systems").first()
    if not systems_tenant:
        raise HTTPException(status_code=500, detail="Tenant 'Systems' não encontrado.")

    users = db.query(models.User).filter(models.User.tenant_id == systems_tenant.id).all()
    return users