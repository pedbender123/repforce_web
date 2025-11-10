from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from ..core import security
from typing import List

router = APIRouter()

# Dependência para verificar se o usuário é Admin
def check_admin_profile(request: Request):
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
def create_representative(
    user: schemas.UserCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    Cria um novo usuário (Representante) dentro do tenant do Admin logado.
    """
    tenant_id = request.state.tenant_id # Tenant do Admin
    
    # Verifica se o email já existe
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    hashed_password = security.get_password_hash(user.password)
    
    db_representative = models.User(
        email=user.email,
        hashed_password=hashed_password,
        profile="representante", # Perfil fixo
        tenant_id=tenant_id # Mesmo tenant do Admin
    )
    
    db.add(db_representative)
    db.commit()
    db.refresh(db_representative)
    return db_representative

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