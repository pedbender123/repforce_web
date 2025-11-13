from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from ..core import security
from typing import List

router = APIRouter()

# Dependência para verificar se o usuário é Admin
def check_admin_profile(request: Request):
    """
    Verifica se o usuário logado tem o perfil 'admin'.
    """
    if request.state.profile != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores."
        )
    return True

@router.post("/users", 
             response_model=schemas.User, 
             status_code=201, 
             dependencies=[Depends(check_admin_profile)])
def create_user( # Nome modificado
    user: schemas.UserCreate, # Schema modificado
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    Cria um novo usuário (Representante ou Admin) dentro do tenant do Admin logado.
    """
    tenant_id = request.state.tenant_id # Tenant do Admin
    
    # Verifica se o email já existe
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    hashed_password = security.get_password_hash(user.password)
    
    # Garante que o perfil seja 'admin' ou 'representante'
    profile = user.profile if user.profile in ['admin', 'representante'] else 'representante'

    db_new_user = models.User(
        email=user.email,
        name=user.name, # Novo campo
        hashed_password=hashed_password,
        profile=profile, # Perfil dinâmico
        tenant_id=tenant_id # Mesmo tenant do Admin
    )
    
    db.add(db_new_user)
    db.commit()
    db.refresh(db_new_user)
    return db_new_user

@router.get("/users", 
            response_model=List[schemas.User], 
            dependencies=[Depends(check_admin_profile)])
def get_users_in_tenant(
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    Lista todos os usuários (Admins e Representantes) do tenant do Admin logado.
    """
    tenant_id = request.state.tenant_id
    users = db.query(models.User).filter(models.User.tenant_id == tenant_id).all()
    return users