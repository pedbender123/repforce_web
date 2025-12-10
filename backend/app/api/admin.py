from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from ..core import security
from typing import List

router = APIRouter()

def check_tenant_admin_profile(request: Request):
    if request.state.profile != 'admin' and request.state.profile != 'sysadmin': 
        # Sysadmin também pode debuggar, mas o foco é o admin do tenant
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")
    return True

@router.post("/users", response_model=schemas.User, status_code=201, dependencies=[Depends(check_tenant_admin_profile)])
def create_tenant_user(
    user: schemas.UserCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    # 1. Identificar o Tenant Alvo
    tenant_slug = request.state.tenant_slug
    if not tenant_slug:
         raise HTTPException(status_code=400, detail="Contexto de tenant ausente")

    tenant = db.query(models.Tenant).filter(models.Tenant.slug == tenant_slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado.")

    if user.profile == 'sysadmin':
        raise HTTPException(status_code=403, detail="Não é permitido criar usuários SysAdmin aqui")

    # 2. Verificar duplicidade
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username já cadastrado")

    # 3. Criar Usuário
    hashed_password = security.get_password_hash(user.password)
    
    db_new_user = models.User(
        username=user.username,
        email=user.email,
        # name=user.name, # Ajuste conforme seu schema schemas.UserCreate se tiver 'name'
        password_hash=hashed_password, # CORREÇÃO AQUI
        # profile=user.profile, # Role system replaces profile string
        tenant_id=tenant.id,
        is_active=True
    )
    
    db.add(db_new_user)
    db.commit()
    db.refresh(db_new_user)
    return db_new_user

@router.get("/users", response_model=List[schemas.User], dependencies=[Depends(check_tenant_admin_profile)])
def get_users_in_tenant(
    request: Request,
    db: Session = Depends(database.get_db)
):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == request.state.tenant_slug).first()
    if not tenant: return []

    return db.query(models.User).filter(models.User.tenant_id == tenant.id).all()