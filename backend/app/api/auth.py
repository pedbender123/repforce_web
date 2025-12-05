from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from ..db import database, models, schemas
from ..core import security

router = APIRouter()

# Login Unificado para Usuários de Tenant
@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    tenant_slug: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    db_core: Session = Depends(database.get_core_db) # <--- Conecta no Core
):
    # 1. Verifica se o Tenant existe no Core
    tenant = db_core.query(models.Tenant).filter(models.Tenant.slug == tenant_slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")
    
    if tenant.status != 'active':
        raise HTTPException(status_code=403, detail="Empresa inativa.")

    # 2. Busca o usuário no Core (filtrando pelo tenant_id para garantir escopo)
    user = db_core.query(models.User).filter(
        models.User.username == username,
        models.User.tenant_id == tenant.id
    ).first()

    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Usuário ou senha incorretos.")

    # 3. Gera Token com o SLUG e ID do Usuário
    token_data = {
        "sub": str(user.id),
        "profile": user.profile,
        "username": user.username,
        "tenant_slug": tenant.slug # Necessário para o Middleware rotear a conexão
    }
    
    access_token = security.create_access_token(data=token_data)
    return {"access_token": access_token, "token_type": "bearer"}

# Login de SysAdmin (Sem slug, busca globalmente)
@router.post("/sysadmin/token", response_model=schemas.Token)
def sysadmin_login(
    username: str = Form(...),
    password: str = Form(...),
    db_core: Session = Depends(database.get_core_db)
):
    # SysAdmin é um usuário especial no Core (geralmente tenant_id=None ou 1-'Systems')
    user = db_core.query(models.User).filter(
        models.User.username == username, 
        models.User.profile == 'sysadmin'
    ).first()
    
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    access_token = security.create_access_token(
        data={"sub": str(user.id), "profile": "sysadmin", "username": user.username}
    )
    return {"access_token": access_token, "token_type": "bearer"}