from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from ..db import database, models, schemas
from ..core import security

router = APIRouter()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    username: str = Form(...),
    password: str = Form(...),
    remember_me: bool = Form(False), # Recebe do form
    db: Session = Depends(database.get_db)
):
    """
    Login para 'admin' e 'representante' com suporte a 'Manter conectado'.
    """
    # Carrega usuário com Cargo para verificar permissões
    user = db.query(models.User).options(joinedload(models.User.role_obj)).filter(models.User.username == username).first()
    
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    role_name = user.role_obj.name if user.role_obj else "unknown"

    if role_name == 'sysadmin':
        raise HTTPException(status_code=403, detail="Login de SysAdmin deve ser feito na área restrita.")
    
    # Define o profile
    profile = role_name.lower() if role_name else "sales_rep"
    
    token_data = {
        "sub": str(user.id), 
        "role_name": role_name,
        "tenant_id": user.tenant_id,
        "username": user.username,
        "profile": profile
    }
    
    # Usa a flag remember_me
    access_token = security.create_access_token(data=token_data, remember_me=remember_me)
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/sysadmin/token", response_model=schemas.Token)
def sysadmin_login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    """Login exclusivo para SysAdmin (sem remember_me por segurança)."""
    user = db.query(models.User).options(joinedload(models.User.role_obj)).filter(models.User.username == form_data.username).first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Dados incorretos")
        
    role_name = user.role_obj.name if user.role_obj else "unknown"

    if role_name != 'sysadmin':
        raise HTTPException(status_code=403, detail="Acesso negado. Área exclusiva SysAdmin.")
    
    # Profile é sempre sysadmin neste endpoint
    profile = "sysadmin"

    token_data = {
        "sub": str(user.id), 
        "role_name": role_name, 
        "tenant_id": user.tenant_id, 
        "username": user.username,
        "profile": profile
    }
    access_token = security.create_access_token(data=token_data)
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=schemas.User)
def read_users_me(request: Request, db: Session = Depends(database.get_db)):
    user_id = request.state.user_id
    
    # PASSO 1: Carregamento Eager dos relacionamentos
    # Carrega Tenant, Cargo e as Áreas vinculadas ao Cargo
    user = db.query(models.User).options(
        joinedload(models.User.tenant),
        joinedload(models.User.role_obj).joinedload(models.Role.areas)
    ).filter(models.User.id == user_id).first()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # DEBUG MENU
    print(f"DEBUG[me]: User {user.username} Role {user.role_obj.name}", flush=True)
    if user.role_obj:
        print(f"DEBUG[me]: Areas: {[a.name for a in user.role_obj.areas]}", flush=True)

    return user

from fastapi import Body
from typing import List, Dict, Any

@router.get("/users/me/preferences/grid/{grid_id}")
def get_user_grid_preference(
    grid_id: str,
    request: Request,
    db: Session = Depends(database.get_db)
):
    user_id = request.state.user_id
    pref = db.query(models.UserGridPreference).filter(
        models.UserGridPreference.user_id == user_id,
        models.UserGridPreference.grid_id == grid_id
    ).first()
    
    if not pref:
        return []
    return pref.columns_json

@router.put("/users/me/preferences/grid/{grid_id}")
def update_user_grid_preference(
    grid_id: str,
    columns: List[Dict[str, Any]] = Body(...),
    request: Request = None,
    db: Session = Depends(database.get_db)
):
    user_id = request.state.user_id
    pref = db.query(models.UserGridPreference).filter(
        models.UserGridPreference.user_id == user_id,
        models.UserGridPreference.grid_id == grid_id
    ).first()
    
    if not pref:
        pref = models.UserGridPreference(
            user_id=user_id,
            grid_id=grid_id,
            columns_json=columns
        )
        db.add(pref)
    else:
        pref.columns_json = columns
    
    db.commit()
    return {"status": "success"}