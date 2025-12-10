from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.core import security, config
from app.db import models, schemas, database

router = APIRouter()

# Define onde o token é obtido (URL de login padrão)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# --- Dependência de Usuário Atual ---
async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(database.get_db)
) -> models.User:
    """
    Decodifica o Token JWT e recupera o usuário atual.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        username: str = payload.get("sub")
        tenant_schema: str = payload.get("tenant_schema")
        
        if username is None:
            raise credentials_exception
            
        token_data = schemas.TokenData(username=username, tenant_schema=tenant_schema)
    except JWTError:
        raise credentials_exception
    
    # Busca user no schema public
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
        
    return user

# --- Rotas de Login ---

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    """Login para usuários comuns e Admins de Tenant"""
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    # CORREÇÃO: Usando user.password_hash (novo nome)
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Determinar Schema
    tenant_schema = "public"
    tenant_slug = None
    if user.tenant and user.tenant.schema_name:
        tenant_schema = user.tenant.schema_name
        tenant_slug = user.tenant.slug

    # Criar Token
    access_token_expires = timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={
            "sub": user.username,
            "sub_id": user.id,
            "profile": "admin" if user.role and user.role.name == "admin" else "representante", # Simplificação temporária
            "tenant_schema": tenant_schema,
            "tenant_slug": tenant_slug
        },
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/sysadmin/token", response_model=schemas.Token)
def login_sysadmin(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    """Login exclusivo para SysAdmin"""
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    # Validações estritas
    if not user or not user.is_sysadmin:
        # Retorna erro genérico para não vazar existência do user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Acesso negado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={
            "sub": user.username,
            "sub_id": user.id,
            "profile": "sysadmin",
            "tenant_schema": "public",
            "tenant_slug": None
        },
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}