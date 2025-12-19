from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from ..core import security
from typing import List

router = APIRouter()

# Dependência para verificar se o usuário é Admin (de Tenant)
def check_tenant_admin_profile(request: Request):
    """
    Verifica se o usuário logado tem o perfil 'Admin' ou 'sysadmin'.
    Utiliza role_name pois profile foi depreciado.
    """
    allowed_roles = ['Admin', 'sysadmin']
    if request.state.role_name not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores."
        )
    return True

# --- USER MANAGEMENT ---

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

    # Verificação de unicidade
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username já cadastrado")

    hashed_password = security.get_password_hash(user.password)
    
    # Se um role_id foi passado, verifica se pertence ao tenant
    role_id = user.role_id
    if role_id:
        role = db.query(models.Role).filter(models.Role.id == role_id, models.Role.tenant_id == tenant_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Cargo inválido para este tenant")
    
    db_new_user = models.User(
        username=user.username,
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        profile=profile,
        tenant_id=tenant_id,
        role_id=role_id # Associa o cargo
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

# --- PASSO 2: API DE GESTÃO DE CARGOS (ROLES) ---

@router.get("/roles", response_model=List[schemas.Role], dependencies=[Depends(check_tenant_admin_profile)])
def get_tenant_roles(request: Request, db: Session = Depends(database.get_db)):
    """Lista todos os cargos do tenant atual."""
    tenant_id = request.state.tenant_id
    return db.query(models.Role).filter(models.Role.tenant_id == tenant_id).all()

@router.post("/roles", response_model=schemas.Role, status_code=201, dependencies=[Depends(check_tenant_admin_profile)])
def create_tenant_role(
    role_in: schemas.RoleCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    """Cria um novo cargo para o tenant."""
    tenant_id = request.state.tenant_id
    
    # Verifica duplicidade de nome
    existing = db.query(models.Role).filter(models.Role.name == role_in.name, models.Role.tenant_id == tenant_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Já existe um cargo com este nome.")

    new_role = models.Role(
        name=role_in.name,
        description=role_in.description,
        tenant_id=tenant_id
    )
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    
    # Vincula áreas se fornecidas
    if role_in.area_ids:
        areas = db.query(models.Area).filter(
            models.Area.id.in_(role_in.area_ids),
            models.Area.tenant_id == tenant_id
        ).all()
        for area in areas:
            new_role.areas.append(area)
        db.commit()
        db.refresh(new_role)
        
    return new_role

@router.put("/roles/{role_id}", response_model=schemas.Role, dependencies=[Depends(check_tenant_admin_profile)])
def update_tenant_role(
    role_id: int,
    role_in: schemas.RoleUpdate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    role = db.query(models.Role).filter(models.Role.id == role_id, models.Role.tenant_id == tenant_id).first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Cargo não encontrado.")
    
    # Update campos simples
    if role_in.name:
        role.name = role_in.name
    if role_in.description is not None:
        role.description = role_in.description
        
    # Update Áreas (Substituição total da lista)
    if role_in.area_ids is not None:
        # Limpa lista atual
        role.areas = []
        # Busca novas áreas (garantindo que pertencem ao tenant)
        areas = db.query(models.Area).filter(
            models.Area.id.in_(role_in.area_ids),
            models.Area.tenant_id == tenant_id
        ).all()
        for area in areas:
            role.areas.append(area)
            
    db.commit()
    db.refresh(role)
    return role

@router.delete("/roles/{role_id}", dependencies=[Depends(check_tenant_admin_profile)])
def delete_tenant_role(
    role_id: int,
    request: Request,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    role = db.query(models.Role).filter(models.Role.id == role_id, models.Role.tenant_id == tenant_id).first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Cargo não encontrado.")
    
    # Opcional: Impedir deletar se tiver usuários vinculados
    if role.users:
        raise HTTPException(status_code=400, detail="Não é possível excluir um cargo com usuários vinculados.")

    db.delete(role)
    db.commit()
    return {"message": "Cargo excluído com sucesso"}

@router.get("/areas", response_model=List[schemas.Area], dependencies=[Depends(check_tenant_admin_profile)])
def get_tenant_available_areas(request: Request, db: Session = Depends(database.get_db)):
    """Retorna todas as áreas disponíveis para este tenant (para vincular aos cargos)."""
    tenant_id = request.state.tenant_id
    return db.query(models.Area).filter(models.Area.tenant_id == tenant_id).all()