from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from ..core import security
from typing import List

router = APIRouter()

# Dependência para verificar se o usuário é Admin (de Tenant)
def check_tenant_admin_profile(request: Request):
    """
    Verifica se o usuário logado tem o perfil 'admin' (e NÃO 'sysadmin').
    """
    if request.state.profile != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores de tenant."
        )
    return True

@router.post("/users", 
             response_model=schemas.User, 
             status_code=201, 
             dependencies=[Depends(check_tenant_admin_profile)])
def create_tenant_user( # Renomeado para clareza
    user: schemas.UserCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    (Admin de Tenant) Cria um novo usuário (Representante ou Admin) 
    dentro do SEU PRÓPRIO tenant.
    """
    tenant_id = request.state.tenant_id # Tenant do Admin
    
    # REGRA DE SEGURANÇA: Admin de Tenant NÃO PODE criar SysAdmin
    if user.profile == 'sysadmin':
        raise HTTPException(status_code=403, detail="Não é permitido criar usuários SysAdmin")

    # Garante que o perfil seja 'admin' ou 'representante'
    profile = user.profile if user.profile in ['admin', 'representante'] else 'representante'

    # --- MUDANÇA 1: Usar 'username' para verificação de unicidade ---
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username já cadastrado")
    # --- FIM MUDANÇA 1 ---

    hashed_password = security.get_password_hash(user.password)
    
    db_new_user = models.User(
        username=user.username, # NOVO: Usando username do input
        email=user.email, # Usando email do input (agora opcional)
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
            dependencies=[Depends(check_tenant_admin_profile)])
def get_users_in_tenant(
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    (Admin de Tenant) Lista todos os usuários do SEU PRÓPRIO tenant.
    """
    tenant_id = request.state.tenant_id
    users = db.query(models.User).filter(models.User.tenant_id == tenant_id).all()
    return users