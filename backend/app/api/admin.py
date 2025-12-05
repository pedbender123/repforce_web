from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from ..core import security
from typing import List

router = APIRouter()

def check_tenant_admin_profile(request: Request):
    if request.state.profile != 'admin':
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")
    return True

@router.post("/users", response_model=schemas.User, status_code=201, dependencies=[Depends(check_tenant_admin_profile)])
def create_tenant_user(
    user: schemas.UserCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    # O middleware já configurou o schema, MAS usuários ficam na tabela 'users' (Core/Public).
    # Graças ao fix no database.py (search_path ... , public), conseguimos escrever lá.
    
    # Precisamos saber o ID do tenant atual para vincular o usuário
    # Como estamos no schema "tenant_nike", precisamos descobrir o ID do tenant "nike"
    # Uma forma segura é buscar pelo slug que está no request.state
    tenant_slug = request.state.tenant_slug
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == tenant_slug).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Erro de integridade: Tenant não encontrado.")

    if user.profile == 'sysadmin':
        raise HTTPException(status_code=403, detail="Não é permitido criar usuários SysAdmin")

    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username já cadastrado")

    hashed_password = security.get_password_hash(user.password)
    
    db_new_user = models.User(
        username=user.username,
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        profile=user.profile,
        tenant_id=tenant.id # Vincula ao tenant correto
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
    # Busca tenant ID pelo slug
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == request.state.tenant_slug).first()
    if not tenant: return []

    # Filtra usuários deste tenant
    users = db.query(models.User).filter(models.User.tenant_id == tenant.id).all()
    return users