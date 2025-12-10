from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.core import security
# CORREÇÃO: Importamos 'settings' explicitamente para acessar as variáveis
from app.core.config import settings 
from app.db import models, schemas, database

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(database.get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # CORREÇÃO: Usar settings.SECRET_KEY e settings.ALGORITHM
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        tenant_schema: str = payload.get("tenant_schema")
        
        if username is None:
            raise credentials_exception
            
        token_data = schemas.TokenData(username=username, tenant_schema=tenant_schema)
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
        
    return user

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    tenant_schema = "public"
    tenant_slug = None
    if user.tenant and user.tenant.schema_name:
        tenant_schema = user.tenant.schema_name
        tenant_slug = user.tenant.slug

    # CORREÇÃO: Usar settings.ACCESS_TOKEN_EXPIRE_MINUTES
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={
            "sub": user.username,
            "sub_id": user.id,
            "profile": "admin" if user.role and user.role.name == "admin" else "representante",
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
    print(f"🔐 Tentativa de Login SysAdmin: {form_data.username}")
    
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user:
        print("❌ Usuário não encontrado no banco.")
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
        
    if not user.is_sysadmin:
        print(f"❌ Usuário {user.username} existe mas is_sysadmin=False")
        raise HTTPException(status_code=401, detail="Não é SysAdmin")
    
    if not security.verify_password(form_data.password, user.password_hash):
        print(f"❌ Senha incorreta para {user.username}")
        raise HTTPException(status_code=401, detail="Senha incorreta")

    print("✅ Login SysAdmin Autorizado!")
    
    # CORREÇÃO: Usar settings.ACCESS_TOKEN_EXPIRE_MINUTES
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
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